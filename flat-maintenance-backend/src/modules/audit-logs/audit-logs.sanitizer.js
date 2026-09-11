// =====================  IMPORTS  ==========================
import { SENSITIVE_SECRET_KEYS } from "./audit-logs.constants.js";

// =====================  SNAPSHOT SANITIZER  ================
/**
 * Recursively inspects and sanitizes beforeState and afterState snapshot payloads
 * before persistence into the immutable auditLogs collection.
 *
 * Security Invariants:
 * - Redacts raw passwords, password hashes, JWTs, refresh tokens, and API secrets.
 * - Strips binary buffers, circular references, and non-serializable objects.
 * - Retains essential business and state attributes (status, amounts, IDs, timestamps).
 * - Converts Mongoose Document instances to plain JSON-safe objects.
 *
 * @param {any} input - Raw state object or Mongoose document.
 * @param {WeakSet} [visited=new WeakSet()] - Circular reference tracking guard.
 * @returns {any} Plain, credential-free serializable snapshot.
 */
export const sanitizeAuditSnapshot = (input, visited = new WeakSet()) => {
  if (input === null || input === undefined) {
    return null;
  }

  // Handle primitives directly
  if (typeof input !== "object") {
    return input;
  }

  // Detect and prevent circular references
  if (visited.has(input)) {
    return "[CIRCULAR]";
  }

  // Handle Date objects cleanly
  if (input instanceof Date) {
    return input.toISOString();
  }

  // Handle Buffers (do not store raw binary payloads in audit snapshots)
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    return "[BINARY_BUFFER]";
  }

  // Convert Mongoose Documents or objects with toObject/toJSON methods
  let target = input;
  if (typeof target.toObject === "function") {
    target = target.toObject();
  } else if (typeof target.toJSON === "function" && !(target instanceof Date)) {
    target = target.toJSON();
  }

  // If conversion yielded a primitive
  if (target === null || typeof target !== "object") {
    return target;
  }

  // Handle Mongoose ObjectId instances
  if (
    target._bsontype === "ObjectID" ||
    target.constructor?.name === "ObjectId"
  ) {
    return target.toString();
  }

  visited.add(input);

  // Recursively sanitize arrays
  if (Array.isArray(target)) {
    return target.map((item) => sanitizeAuditSnapshot(item, visited));
  }

  // Recursively sanitize plain objects
  const sanitized = {};
  for (const [key, value] of Object.entries(target)) {
    // Exclude internal mongoose and private keys
    if (key.startsWith("$") || key === "__v") {
      continue;
    }

    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_SECRET_KEYS.has(normalizedKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "function") {
      continue;
    } else {
      sanitized[key] = sanitizeAuditSnapshot(value, visited);
    }
  }

  return sanitized;
};

// =====================  EXPORTS  ===========================
export default sanitizeAuditSnapshot;
