import { devLogin } from "../services/auth.service.js";

export async function login(req, res) {
    const data = await devLogin(req.body.email);

    res.status(200).json({
        success: true,
        data,
    });
}

export function getMe(req, res) {
    res.status(200).json({
        success: true,
        data: req.user,
    });
}
