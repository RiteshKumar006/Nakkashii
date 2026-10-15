import {AppError} from "../utils/error.js";

export function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            details: err.details || null,
        });
    }

    if (err.code === 11000){
        return res.status(409).json({
            success: false,
            message: "Duplicate key error",
            code: "DUPLICATE_KEY_ERROR",
            details: err.keyValue || null,
        });
    }

    if(err.name === "CastError" ){
        return res.status(400).json({
            success: false,
            message: "Invalid ID format",
            code: "INVALID_ID_FORMAT",
            details: err.value || null,
        });
    }


    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
        });
    }

    // two saves on the same product at the same time, second one loses
    if (err.name === "VersionError") {
        return res.status(409).json({
            success: false,
            message: "Product was changed by another request, reload and try again",
            code: "CONFLICT",
            details: null,
        });
    }

    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: err.message,
            code: "UPLOAD_ERROR",
            details: null,
        });
    }

    // errors from express itself like bad json body
    if (err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({
            success: false,
            message: err.expose ? err.message : "Bad request",
            code: "BAD_REQUEST",
            details: null,
        });
    }

    console.error("Unexpected error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        details: null,
    });
}