// =====================  IMPORTS  ==========================
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

// =====================  CLOUDINARY CONFIGURATION  ==========
/**
 * Ensure Cloudinary client is configured with environment credentials if present.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// =====================  URL VALIDATION  ====================
/**
 * Validates that an incoming URL string points to an authentic Cloudinary CDN resource.
 *
 * Security Invariant:
 * Prevents arbitrary SSRF or external URL injection where malicious actors attempt
 * to point identity proof fields or document URLs to attacker-controlled origins.
 *
 * @param {string} url - Target URL to inspect.
 * @returns {boolean} True if the URL is hosted on Cloudinary CDN.
 */
export const isCloudinaryUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "res.cloudinary.com" ||
        parsed.hostname.endsWith(".cloudinary.com"))
    );
  } catch {
    return false;
  }
};

// =====================  MEMORY STREAM PIPELINE  ============
/**
 * Streams an in-memory buffer directly to Cloudinary CDN edge nodes without local disk writes.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 68.
 *
 * Invariants:
 * - Direct RAM buffer streaming: zero persistent disk footprint.
 * - Allowed formats: jpg, png, webp, pdf.
 * - Enforces 10MB maximum file size limit.
 *
 * @param {Buffer} buffer - In-memory file buffer from Multer.
 * @param {string} folder - Target Cloudinary subdirectory (e.g., 'documents', 'id-proofs').
 * @param {string} mimeType - MIME type of the incoming asset (e.g. 'image/jpeg', 'application/pdf').
 * @returns {Promise<string>} Secure CDN URL of the uploaded asset.
 */
export const uploadBufferToCloudinary = (
  buffer,
  folder = "documents",
  mimeType = "image/jpeg"
) => {
  return new Promise((resolve, reject) => {
    const isPdf = typeof mimeType === "string" && mimeType.includes("pdf");

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `flat-maintenance/${folder}`,
        resource_type: isPdf ? "raw" : "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
        max_bytes: 10 * 1024 * 1024, // 10MB limit
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

export { cloudinary };
