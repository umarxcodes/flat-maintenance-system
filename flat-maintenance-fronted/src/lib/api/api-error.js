// =====================  API ERROR NORMALIZER  ================
export class AppApiError extends Error {
  constructor(message, statusCode = 500, errorCode = "INTERNAL_SERVER_ERROR", errors = []) {
    super(message);
    this.name = "AppApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
  }

  static fromAxiosError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};

      let userFriendlyMessage = data.message || "An unexpected error occurred.";

      // Normalize common status codes to enterprise-grade descriptions
      if (status === 400 && !data.message) {
        userFriendlyMessage = "Invalid input data or malformed request.";
      } else if (status === 401) {
        userFriendlyMessage = "Your session has expired. Please log in again.";
      } else if (status === 403) {
        userFriendlyMessage = "You do not have permission to perform this action.";
      } else if (status === 404 && !data.message) {
        userFriendlyMessage = "The requested record was not found.";
      } else if (status === 409 && !data.message) {
        userFriendlyMessage = "A conflicting resource already exists.";
      } else if (status === 422 && !data.message) {
        userFriendlyMessage = "Validation failed. Please verify the provided fields.";
      } else if (status === 429) {
        userFriendlyMessage = "Too many requests. Please slow down and try again later.";
      } else if (status >= 500) {
        userFriendlyMessage = "A temporary server error occurred. Please try again later.";
      }

      return new AppApiError(
        userFriendlyMessage,
        status,
        data.errorCode || data.code || `HTTP_${status}`,
        data.errors || []
      );
    }

    if (error.request) {
      return new AppApiError(
        "Network connection lost. Please verify your internet connection.",
        0,
        "NETWORK_ERROR"
      );
    }

    return new AppApiError(
      error.message || "An unexpected error occurred",
      500,
      "CLIENT_ERROR"
    );
  }
}
