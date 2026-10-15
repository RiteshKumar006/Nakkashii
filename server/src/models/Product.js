import mongoose from "mongoose";
import { buildCombinationKey } from "../utils/combinationKey.js";
const { Schema } = mongoose;

const variantSchema = new Schema({
  sku: { type: String, required: true, trim: true, uppercase: true },
  options: [
    {
      _id: false,
      name: { type: String, required: true, trim: true },
      value: { type: String, required: true, trim: true },
    },
  ],
  combinationKey: { type: String, default: "" }, // "" when product has no attributes
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  isAvailable: { type: Boolean, default: true },
  imageUrls: [
    {
      url: { type: String, required: true },
      filename: { type: String, required: true },
    },
  ],
});

const productSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    attributes: { type: [String], default: [] },
    variants: [variantSchema],
  },
  { timestamps: true, optimisticConcurrency: true },
);

// build combinationKey from options before saving
productSchema.pre("validate", function () {
  for (const variant of this.variants) {
    variant.combinationKey = buildCombinationKey(variant.options);
  }
});

productSchema.index(
  { "variants.sku": 1 },
  {
    unique: true,
    partialFilterExpression: { "variants.sku": { $exists: true } },
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
