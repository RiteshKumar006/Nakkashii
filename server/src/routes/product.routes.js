import express from "express";
import { listProducts, getProduct, purchase } from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { purchaseSchema } from "../validators/product.validator.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/:id/variants/:variantId/purchase", authMiddleware, validate(purchaseSchema), purchase);

export default router;
