// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { Review } from "./reviews.model.js";
import { MaintenanceRequest } from "../../models/maintenance-request.model.js";
import { Staff } from "../../models/staff.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { Owner } from "../../models/owner.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import { MAINTENANCE_REQUEST_STATUS } from "../maintenance-requests/maintenance-requests.constants.js";
import { MODERATION_STATUS, REVIEW_PAGINATION } from "./reviews.constants.js";
import { logger } from "../../utils/logger.util.js";

// =====================  SERVICE LAYER  =====================
/**
 * Authoritative Domain Service for Module 17: Ratings & Service Reviews (reviews).
 *
 * Governs resident quality feedback and performance scorecards for completed work orders.
 * Architectural Invariants:
 * 1. Strict Eligibility: Work orders must be in completed/terminal status (CLOSED, VERIFIED, COMPLETED).
 * 2. Strict IDOR & Identity Protection: Resident identity and unit linkages are resolved server-side.
 * 3. Atomic Recalculation: Review creation and staff rating metrics recalculate atomically inside an ACID transaction.
 * 4. Building-Scoped Moderation: Facility managers can only flag or hide reviews within their assigned complexes.
 */
class ReviewsService {
  /**
   * Submits a resident quality review and atomically updates the assigned technician's metrics.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal context (req.user).
   * @param {Object} params.input - Validated review payload from createReviewSchema.
   * @returns {Promise<Object>} Created plain safe review object.
   */
  async createReview({ actor, input }) {
    const actorUserId = actor._id || actor.id;

    // 1. Fetch Authoritative Maintenance Request
    const mr = await MaintenanceRequest.findById(input.maintenanceRequestId);
    if (!mr) {
      throw new ApiError(
        404,
        `Maintenance request '${input.maintenanceRequestId}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Validate Review Eligibility: Work order must be completed, verified, or closed
    const eligibleStatuses = [
      MAINTENANCE_REQUEST_STATUS.CLOSED,
      MAINTENANCE_REQUEST_STATUS.VERIFIED,
      MAINTENANCE_REQUEST_STATUS.COMPLETED,
    ];

    if (!eligibleStatuses.includes(mr.status)) {
      throw new ApiError(
        400,
        `Cannot review maintenance request in '${mr.status}' status. Only completed or closed work orders are eligible for review.`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 3. Validate Assigned Staff Technician exists on the work order
    if (!mr.assignedStaffId) {
      throw new ApiError(
        400,
        "Maintenance request does not have an assigned staff technician to review",
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 4. Verify Resident Authority & Anti-IDOR Binding
    await this._assertResidentReviewEligibility(mr, actor, actorUserId);

    // 5. Pre-check for duplicate review (defense-in-depth before transaction)
    const existingReview = await Review.findOne({
      maintenanceRequestId: mr._id,
    });
    if (existingReview) {
      throw new ApiError(
        409,
        "A review has already been submitted for this maintenance work order",
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 6. Verify Assigned Staff Record exists and is active
    const staff = await Staff.findOne({
      _id: mr.assignedStaffId,
      isDeleted: false,
    });
    if (!staff) {
      throw new ApiError(
        400,
        "Assigned technician staff record not found or has been deactivated",
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 7. Execute ACID Transaction: Insert Review + Recalculate Technician Rating
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Concurrency defense: re-check uniqueness inside session
      const existingInSession = await Review.findOne({
        maintenanceRequestId: mr._id,
      }).session(session);

      if (existingInSession) {
        throw new ApiError(
          409,
          "A review has already been submitted for this maintenance work order",
          [],
          ERROR_CODES.CONFLICT
        );
      }

      // Persist Review Document
      const [createdReview] = await Review.create(
        [
          {
            maintenanceRequestId: mr._id,
            buildingId: mr.buildingId,
            flatId: mr.flatId,
            residentUserId: actorUserId,
            staffId: mr.assignedStaffId,
            rating: input.rating,
            title: input.title || null,
            comment: input.comment || null,
            moderationStatus: MODERATION_STATUS.PUBLISHED,
          },
        ],
        { session }
      );

      // Recalculate Technician Cumulative Metrics
      const currentStaff = await Staff.findById(mr.assignedStaffId).session(
        session
      );
      if (!currentStaff) {
        throw new ApiError(
          404,
          "Assigned staff member not found during rating update",
          [],
          ERROR_CODES.NOT_FOUND
        );
      }

      const currentCount = currentStaff.totalRatingsCount || 0;
      const currentAvg = currentStaff.averageRating || 0.0;
      const newCount = currentCount + 1;
      const newAvgRaw = (currentAvg * currentCount + input.rating) / newCount;
      const newAvg = Math.round(newAvgRaw * 100) / 100;

      await Staff.findByIdAndUpdate(
        mr.assignedStaffId,
        {
          $set: {
            averageRating: newAvg,
            totalRatingsCount: newCount,
          },
        },
        { session, returnDocument: "after" }
      );

      await session.commitTransaction();

      logger.security("REVIEW_SUBMITTED", {
        reviewId: createdReview._id.toString(),
        maintenanceRequestId: mr._id.toString(),
        staffId: mr.assignedStaffId.toString(),
        rating: input.rating,
        actorId: actorUserId.toString(),
        actorRole: actor.role,
      });

      return createdReview.toSafeReview();
    } catch (err) {
      await session.abortTransaction();
      if (err.code === 11000) {
        throw new ApiError(
          409,
          "A review has already been submitted for this maintenance work order",
          [],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Queries published reviews with optional technician, building, and pagination filters.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal context.
   * @param {Object} params.query - Validated query parameters from listReviewsQuerySchema.
   * @returns {Promise<Object>} Paginated envelope with plain safe review items.
   */
  async listReviews({ actor, query }) {
    const isManagerialRole = [
      ROLES.SUPER_ADMIN,
      ROLES.BUILDING_ADMIN,
      ROLES.MANAGER,
    ].includes(actor.role);

    const filter = {};

    // 1. Moderation Status Visibility
    if (!isManagerialRole) {
      // Ordinary residents and staff can only see PUBLISHED reviews
      filter.moderationStatus = MODERATION_STATUS.PUBLISHED;
    } else if (query.moderationStatus) {
      filter.moderationStatus = query.moderationStatus;
    } else {
      filter.moderationStatus = MODERATION_STATUS.PUBLISHED;
    }

    // 2. Building Scope & Filter Enforcement
    if (actor.role === ROLES.SUPER_ADMIN) {
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
    } else if (
      actor.role === ROLES.BUILDING_ADMIN ||
      actor.role === ROLES.MANAGER
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You cannot view reviews for a building outside your authorized scope",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
    } else {
      // Resident or other role querying reviews
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
    }

    // 3. Staff Filter Enforcement
    if (query.staffId) {
      filter.staffId = query.staffId;
    }

    // 4. Paginated Execution with Projections
    const page = Math.max(
      1,
      parseInt(query.page, 10) || REVIEW_PAGINATION.DEFAULT_PAGE
    );
    const limit = Math.min(
      REVIEW_PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query.limit, 10) || REVIEW_PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      items: reviews.map((r) => ({
        _id: r._id.toString(),
        id: r._id.toString(),
        maintenanceRequestId: r.maintenanceRequestId.toString(),
        buildingId: r.buildingId.toString(),
        flatId: r.flatId.toString(),
        residentUserId: r.residentUserId.toString(),
        staffId: r.staffId.toString(),
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        moderationStatus: r.moderationStatus,
        moderatedById: r.moderatedById ? r.moderatedById.toString() : null,
        moderatedAt: r.moderatedAt,
        moderationReason: r.moderationReason,
        moderationNotes: r.moderationNotes || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Flags or hides a resident review under facility manager supervision.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated manager principal.
   * @param {string} params.id - Target review ObjectId.
   * @param {Object} params.input - Validated moderation payload.
   * @returns {Promise<Object>} Updated safe review object.
   */
  async moderateReview({ actor, id, input }) {
    const actorUserId = actor._id || actor.id;

    const review = await Review.findById(id);
    if (!review) {
      throw new ApiError(
        404,
        `Review with ID '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // Manager Scope Verification
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (!assignedIds.includes(review.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot moderate reviews outside your assigned building complex",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // Update Moderation State
    review.moderationStatus = input.moderationStatus;
    review.moderatedById = actorUserId;
    review.moderatedAt = new Date();
    if (input.moderationReason !== undefined) {
      review.moderationReason = input.moderationReason;
    }
    if (input.moderationNotes !== undefined) {
      review.moderationNotes = input.moderationNotes;
    }

    await review.save();

    logger.security("REVIEW_MODERATED", {
      reviewId: review._id.toString(),
      buildingId: review.buildingId.toString(),
      moderationStatus: input.moderationStatus,
      actorId: actorUserId.toString(),
      actorRole: actor.role,
    });

    return review.toSafeReview();
  }

  /**
   * Asserts that the authenticated actor is legitimately entitled to review the ticket.
   *
   * @param {Object} mr - Maintenance request document.
   * @param {Object} actor - Authenticated user JWT claims.
   * @param {string} actorUserId - User ObjectId.
   * @private
   */
  async _assertResidentReviewEligibility(mr, actor, actorUserId) {
    if (actor.role === ROLES.SUPER_ADMIN) {
      return;
    }

    // 1. Check if actor is the original ticket creator
    const isCreator = mr.createdById.toString() === actorUserId.toString();
    if (isCreator) {
      return;
    }

    // 2. Check if actor currently has an active lease for the flat
    if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        flatId: mr.flatId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });

      if (tenant) {
        return;
      }
    }

    // 3. Check if actor is the owner of the flat
    if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        flatsOwned: mr.flatId,
        isDeleted: false,
      });

      if (owner) {
        return;
      }
    }

    throw new ApiError(
      403,
      "Access forbidden: You are not authorized to submit a review for this maintenance work order",
      [],
      ERROR_CODES.FORBIDDEN
    );
  }
}

// =====================  EXPORTS  ===========================
export const reviewService = new ReviewsService();
export default reviewService;
