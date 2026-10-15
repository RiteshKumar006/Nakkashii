import {UnauthorizedError} from "../utils/error.js";
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || "";
 
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new UnauthorizedError("Missing or invalid authorization header"));
    }


    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        req.user = decoded;
        next();
    }catch(err){
        return next(new UnauthorizedError("Invalid authorization token"));
    }
}