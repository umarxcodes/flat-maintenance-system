// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { Notification } from "./notifications.model.js";
import { NOTIFICATION_PAGINATION } from "./notifications.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  NOTIFICATIONS SERVICE  ==============
export class NotificationsService {
  /**
   * Returns the authenticated user's notification feed while enforcing strict
   * recipient ownership at the database query boundary.
   *
   * Architectural & Security Invariants:
   * - The recipient identifier is derived exclusively from the authenticated actor context.
   * - Client-controlled recipient filters are strictly ignored and prohibited, eliminating
   *   horizontal privilege escalation (IDOR) vectors.
   * - Queries are bounded with deterministic chronological ordering (newest first).
   * - Utilizes compound index { recipientUserId: 1, isRead: 1, createdAt: -1 } for sub-millisecond execution.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal from JWT middleware.
   * @param {Object} params.query - Validated query parameters.
   * @param {number} [params.query.page] - Page number (>= 1).
   * @param {number} [params.query.limit] - Page size limit (1..100).
   * @param {boolean} [params.query.isRead] - Optional filter by read receipt state.
   * @param {string} [params.query.category] - Optional filter by canonical notification category.
   * @returns {Promise<Object>} Paginated personal notifications payload with envelope metadata.
   */
  async listUserNotifications({ actor, query }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    // Recipient ownership is strictly enforced in the MongoDB predicate itself.
    // Untrusted client input can never expand query scope beyond the authenticated user.
    const filter = {
      recipientUserId: new mongoose.Types.ObjectId(actorUserId),
    };

    if (typeof query.isRead === "boolean") {
      filter.isRead = query.isRead;
    } else if (query.isRead === "true" || query.isRead === "false") {
      filter.isRead = query.isRead === "true";
    }

    if (query.category) {
      filter.category = query.category;
    }

    const page = Math.max(
      1,
      parseInt(query.page, 10) || NOTIFICATION_PAGINATION.DEFAULT_PAGE
    );
    const limit = Math.min(
      NOTIFICATION_PAGINATION.MAX_LIMIT,
      Math.max(
        1,
        parseInt(query.limit, 10) || NOTIFICATION_PAGINATION.DEFAULT_LIMIT
      )
    );
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      items: notifications.map((n) => ({
        _id: n._id.toString(),
        id: n._id.toString(),
        recipientUserId: n.recipientUserId.toString(),
        buildingId: n.buildingId.toString(),
        title: n.title,
        body: n.body,
        category: n.category,
        referenceId: n.referenceId ? n.referenceId.toString() : null,
        referenceModel: n.referenceModel || null,
        isRead: Boolean(n.isRead),
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt ? n.createdAt.toISOString() : null,
        updatedAt: n.updatedAt ? n.updatedAt.toISOString() : null,
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
   * Marks one notification as read for its authenticated recipient.
   *
   * Architectural & Security Invariants:
   * - Recipient ownership is included directly in the database lookup predicate rather
   *   than checked in an unrestricted post-lookup step.
   * - Cross-tenant or cross-user requests produce a deterministic 404 NOT_FOUND error,
   *   strictly preventing existence disclosure of other users' alerts.
   * - Preserves the initial readAt timestamp when called idempotently on an already-read notification.
   * - Single-document atomic mutation eliminates race conditions under concurrent requests.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Notification ObjectId.
   * @returns {Promise<Object>} Safe notification presentation DTO.
   */
  async markNotificationRead({ actor, id }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    const existing = await Notification.findOne({
      _id: id,
      recipientUserId: actorUserId,
    });

    if (!existing) {
      throw new ApiError(
        404,
        `Notification with ID '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // Idempotency: Preserve original readAt timestamp if already marked as read
    if (existing.isRead) {
      return existing.toSafeNotification();
    }

    // Atomic update transitioning unread alert to read
    const updated = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipientUserId: actorUserId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return (updated || existing).toSafeNotification();
  }

  /**
   * Marks all unread notifications belonging to the authenticated user as read.
   *
   * Architectural & Performance Invariants:
   * - The update is intentionally scoped by recipientUserId and isRead=false so the operation
   *   remains a strictly isolated personal state mutation.
   * - Executes a single atomic MongoDB updateMany operation directly in the database engine,
   *   avoiding loading potentially large notification sets into application memory (eliminating N+1 writes).
   * - Uses a single coherent timestamp across the bulk operation.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @returns {Promise<{ updatedCount: number }>} Count of newly marked read records.
   */
  async markAllNotificationsRead({ actor }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    const now = new Date();

    const result = await Notification.updateMany(
      {
        recipientUserId: actorUserId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: now,
        },
      }
    );

    return {
      updatedCount: result.modifiedCount || 0,
    };
  }

  // =====================  INTERNAL FACTORY HELPERS  ===========
  /**
   * Internal helper: Persists a single validated notification document.
   * Strictly intended for domain event producers and outbox handlers.
   *
   * @param {Object} data - Notification fields.
   * @returns {Promise<Object>} Safe notification DTO.
   */
  async createNotification(data) {
    const notification = await Notification.create(data);
    return notification.toSafeNotification();
  }

  /**
   * Internal helper: Batch-persists multiple notification documents.
   * Strictly intended for broadcast fan-out (e.g. society notices, emergency alerts).
   *
   * @param {Array<Object>} items - Array of notification payloads.
   * @returns {Promise<Array<Object>>} Safe notification DTOs.
   */
  async createManyNotifications(items) {
    if (!items || !items.length) {
      return [];
    }
    const notifications = await Notification.insertMany(items);
    return notifications.map((n) => n.toSafeNotification());
  }
}

// =====================  SINGLETON EXPORT  ==================
export const notificationsService = new NotificationsService();
export default notificationsService;
