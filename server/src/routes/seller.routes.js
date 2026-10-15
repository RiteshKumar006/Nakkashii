import express from "express";
import * as product from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../config/upload.js";
import {
    createProductSchema,
    updateProductSchema,
    variantSchema,
    updateVariantSchema,
    stockSchema,
} from "../validators/product.validator.js";

const router = express.Router();

// every seller route needs a logged in seller
router.use(authMiddleware, requireRole("seller"));

router.get("/products", product.listMyProducts);
router.post("/products", validate(createProductSchema), product.createProduct);
router.get("/products/:id", product.getMyProduct);
router.patch("/products/:id", validate(updateProductSchema), product.updateProduct);
router.delete("/products/:id", product.deleteProduct);

router.post("/products/:id/variants", validate(variantSchema), product.addVariant);
router.patch("/products/:id/variants/:variantId", validate(updateVariantSchema), product.updateVariant);
router.delete("/products/:id/variants/:variantId", product.deleteVariant);
router.patch("/products/:id/variants/:variantId/stock", validate(stockSchema), product.adjustStock);

router.post("/products/:id/variants/:variantId/images", upload.array("images", 5), product.addImages);
router.delete("/products/:id/variants/:variantId/images/:imageId", product.removeImage);

export default router;
