// =====================  IMPORTS  ==========================
import { Document } from "./documents.model.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { Owner } from "../owners/owners.model.js";
import { Tenant } from "../tenants/tenants.model.js";
import {
  DOCUMENT_VISIBILITY,
  DOCUMENT_CONSTRAINTS,
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_SECURITY_EVENTS,
} from "./documents.constants.js";
import { emitDocumentSecurityEvent } from "./documents.events.js";
import { uploadBufferToCloudinary } from "../../utils/cloudinary.util.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ApiError } from "../../utils/ApiError.js";

// =====================  SERVICE IMPLEMENTATION  ============
class DocumentsService {
  /**
   * Uploads and registers a new society document into Cloudinary and the database repository.
   *
   * Enforces:
   * - In-memory RAM buffer streaming to Cloudinary edge nodes (zero container disk footprint).
   * - Strict MIME type and 10MB payload size enforcement.
   * - Server-side derivation of `uploadedById` from authenticated JWT principal.
   * - Multi-building isolation (buildingId must match caller's assigned scope).
   * - Flat-specific integrity (flat must exist in the target building complex).
   *
   * @param {Object} params
   * @param {Object} params.input - Validated request body parameters.
   * @param {Object} params.file - Multer memory storage file object.
   * @param {Object} params.actor - Authenticated JWT user principal.
   * @returns {Promise<Object>} Safe document DTO.
   */
  async createDocument({ input, file, actor }) {
    // 1. Validate File Upload Existence
    if (!file || !file.buffer) {
      throw new ApiError(
        400,
        "Document file upload is required",
        [{ field: "file", message: "Multipart file attachment missing" }],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 2. Validate MIME Type Allowlist
    if (!DOCUMENT_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ApiError(
        400,
        `Unsupported document format '${file.mimetype}'. Allowed: ${DOCUMENT_ALLOWED_MIME_TYPES.join(", ")}`,
        [{ field: "file", message: "Invalid file format" }],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Validate File Size Boundary (10MB)
    if (file.size > DOCUMENT_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
      throw new ApiError(
        400,
        `File size exceeds 10MB limit (received ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        [{ field: "file", message: "File exceeds 10MB" }],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Resolve and Validate Building Scope
    let targetBuildingId = input.buildingId;

    if (!targetBuildingId) {
      if (actor.role === ROLES.SUPER_ADMIN) {
        throw new ApiError(
          400,
          "Building ID is required for Super Admin document uploads",
          [{ field: "buildingId", message: "Required" }],
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      const assigned = actor.assignedBuildingIds || [];
      if (assigned.length === 1) {
        targetBuildingId = assigned[0];
      } else {
        throw new ApiError(
          400,
          "Building ID must be specified when assigned to multiple buildings",
          [{ field: "buildingId", message: "Ambiguous building scope" }],
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    } else if (actor.role !== ROLES.SUPER_ADMIN) {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assigned.includes(targetBuildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You are not authorized to upload documents for this building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    const building = await Building.findById(targetBuildingId);
    if (!building || building.isDeleted) {
      throw new ApiError(
        404,
        "Target building not found or is no longer active",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 5. Validate Flat Specific Invariants & Hierarchy Integrity
    let targetFlatId = input.flatId || null;

    if (input.visibility === DOCUMENT_VISIBILITY.FLAT_SPECIFIC) {
      if (!targetFlatId) {
        throw new ApiError(
          400,
          "Flat ID is required when document visibility is set to FLAT_SPECIFIC",
          [{ field: "flatId", message: "Missing flat identifier" }],
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const flat = await Flat.findById(targetFlatId);
      if (!flat || flat.isDeleted) {
        throw new ApiError(
          404,
          "Referenced flat not found or is no longer active",
          [],
          ERROR_CODES.NOT_FOUND
        );
      }

      if (flat.buildingId.toString() !== targetBuildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy mismatch: Referenced flat does not belong to the target building complex",
          [],
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    } else if (targetFlatId) {
      // Optional flat reference provided on general document — verify hierarchy
      const flat = await Flat.findById(targetFlatId);
      if (!flat || flat.isDeleted) {
        throw new ApiError(
          404,
          "Referenced flat not found or is no longer active",
          [],
          ERROR_CODES.NOT_FOUND
        );
      }
      if (flat.buildingId.toString() !== targetBuildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy mismatch: Referenced flat does not belong to the target building complex",
          [],
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // 6. Stream RAM Buffer to Cloudinary Edge Nodes
    let fileUrl;
    try {
      fileUrl = await uploadBufferToCloudinary(
        file.buffer,
        "documents",
        file.mimetype
      );
    } catch (uploadError) {
      throw new ApiError(
        500,
        "Failed to stream document asset to Cloudinary storage",
        [uploadError.message],
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    }

    // 7. Persist Document Record
    const uploaderId = actor._id || actor.id;
    const document = await Document.create({
      buildingId: targetBuildingId,
      flatId: targetFlatId,
      title: input.title.trim(),
      documentType: input.documentType,
      fileUrl,
      visibility: input.visibility,
      uploadedById: uploaderId,
      isDeleted: false,
      deletedAt: null,
    });

    // 8. Security Audit Telemetry
    emitDocumentSecurityEvent(DOCUMENT_SECURITY_EVENTS.DOCUMENT_UPLOADED, {
      documentId: document._id.toString(),
      buildingId: targetBuildingId.toString(),
      flatId: targetFlatId ? targetFlatId.toString() : null,
      documentType: document.documentType,
      visibility: document.visibility,
      uploadedById: uploaderId.toString(),
      fileUrl: document.fileUrl,
    });

    return document.toSafeObject();
  }

  /**
   * Queries society documents tailored strictly to caller's authoritative role,
   * building scope, and flat occupancy relationship.
   *
   * Visibility Model:
   * - SUPER_ADMIN: Unrestricted access across all buildings.
   * - BUILDING_ADMIN / MANAGER / ACCOUNTANT: Full document visibility within assigned buildings.
   * - OWNER: Same-building PUBLIC_ALL_RESIDENTS + OWNERS_ONLY + FLAT_SPECIFIC for owned flats.
   * - TENANT: Same-building PUBLIC_ALL_RESIDENTS + FLAT_SPECIFIC for active leased flat.
   *
   * @param {Object} params
   * @param {Object} params.query - Optional query filters (buildingId, documentType, visibility, flatId).
   * @param {Object} params.actor - Authenticated JWT user principal.
   * @returns {Promise<Array<Object>>} Safe document DTO array.
   */
  async listAuthorizedDocuments({ query = {}, actor }) {
    const filter = { isDeleted: false };

    if (query.documentType) {
      filter.documentType = query.documentType;
    }
    if (query.visibility) {
      filter.visibility = query.visibility;
    }
    if (query.flatId) {
      filter.flatId = query.flatId;
    }

    const actorUserId = (actor._id || actor.id).toString();

    // 1. SUPER_ADMIN: Global Platform Access
    if (actor.role === ROLES.SUPER_ADMIN) {
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
    }
    // 2. PRIVILEGED STAFF: BUILDING_ADMIN, MANAGER, ACCOUNTANT
    else if (
      [ROLES.BUILDING_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT].includes(
        actor.role
      )
    ) {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );

      if (query.buildingId) {
        if (!assigned.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You are not authorized for this building",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assigned };
      }
    }
    // 3. OWNER: Public + Owners Only + Owned Flats
    else if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });

      if (!owner) {
        return [];
      }

      const ownerBuildingId = owner.buildingId.toString();

      if (query.buildingId && query.buildingId.toString() !== ownerBuildingId) {
        throw new ApiError(
          403,
          "Access forbidden: You are not authorized for this building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      filter.buildingId = owner.buildingId;

      const ownerFlats = (owner.flatsOwned || []).map((f) => f.toString());

      filter.$or = [
        { visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS },
        { visibility: DOCUMENT_VISIBILITY.OWNERS_ONLY },
        {
          visibility: DOCUMENT_VISIBILITY.FLAT_SPECIFIC,
          flatId: { $in: ownerFlats },
        },
      ];
    }
    // 4. TENANT: Public + Leased Flat
    else if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: "ACTIVE",
        isDeleted: false,
      });

      if (!tenant) {
        return [];
      }

      const tenantBuildingId = tenant.buildingId.toString();

      if (
        query.buildingId &&
        query.buildingId.toString() !== tenantBuildingId
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You are not authorized for this building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      filter.buildingId = tenant.buildingId;

      filter.$or = [
        { visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS },
        {
          visibility: DOCUMENT_VISIBILITY.FLAT_SPECIFIC,
          flatId: tenant.flatId,
        },
      ];
    }
    // 5. OTHER ROLES: Fail closed unless specific permission applies
    else {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (query.buildingId) {
        if (!assigned.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You are not authorized for this building",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assigned };
      }
      filter.visibility = DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS;
    }

    // Execute indexed lean query
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Security Audit Telemetry
    emitDocumentSecurityEvent(DOCUMENT_SECURITY_EVENTS.DOCUMENT_READ_LIST, {
      actorId: actorUserId,
      role: actor.role,
      count: documents.length,
    });

    return documents.map((doc) => ({
      _id: doc._id,
      buildingId: doc.buildingId,
      flatId: doc.flatId,
      title: doc.title,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      visibility: doc.visibility,
      uploadedById: doc.uploadedById,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  /**
   * Soft-deletes a society document record within caller's authorized building scope.
   *
   * @param {Object} params
   * @param {string} params.documentId - Document ObjectId.
   * @param {Object} params.actor - Authenticated JWT user principal.
   * @returns {Promise<Object>} Safe updated document DTO.
   */
  async softDeleteDocument({ documentId, actor }) {
    const document = await Document.findOne({
      _id: documentId,
      isDeleted: false,
    });

    if (!document) {
      throw new ApiError(
        404,
        "Document not found or has already been deleted",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // Building OBAC Scope Enforcement
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assigned.includes(document.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You are not authorized to delete documents for this building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // Atomic Soft-Delete Mutation
    const deletedDocument = await Document.findOneAndUpdate(
      {
        _id: documentId,
        isDeleted: false,
        buildingId: document.buildingId,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!deletedDocument) {
      throw new ApiError(
        404,
        "Document not found or has already been deleted",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // Security Audit Telemetry
    emitDocumentSecurityEvent(DOCUMENT_SECURITY_EVENTS.DOCUMENT_DELETED, {
      documentId: deletedDocument._id.toString(),
      buildingId: deletedDocument.buildingId.toString(),
      deletedById: (actor._id || actor.id).toString(),
      deletedAt: deletedDocument.deletedAt.toISOString(),
    });

    return deletedDocument.toSafeObject();
  }
}

// =====================  SINGLETON EXPORT  ==================
export const documentsService = new DocumentsService();
export default documentsService;
