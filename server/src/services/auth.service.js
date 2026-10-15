import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {NotFoundError} from "../utils/error.js";

export function signToken(user) {
    const payload = { sub: user._id.toString(), role: user.role };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: "1d",
    });
}


export async function devLogin(email) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const token = signToken(user);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}
