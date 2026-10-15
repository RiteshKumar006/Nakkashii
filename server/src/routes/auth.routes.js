import express from "express";
import { login, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { devLoginSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/dev-login", validate(devLoginSchema), login);
router.get("/me", authMiddleware, getMe);

export default router;
