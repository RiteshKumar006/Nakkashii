import {ForbiddenError} from "../utils/error.js";

export function requireRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return next(new ForbiddenError(`Only ${role}s can do this`));
        }
        next();
    };
}
