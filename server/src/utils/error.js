export class AppError extends Error {
    constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends AppError{
     constructor(message = "Invalid input", details) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
     constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError  extends AppError {
    constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class ForbiddenError  extends AppError {
    constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class UnauthorizedError  extends AppError {
    constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}