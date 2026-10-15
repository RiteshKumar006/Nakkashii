import Product from "../models/Product.js";
import {NotFoundError, ForbiddenError, ConflictError, ValidationError} from "../utils/error.js";
import { checkVariants } from "../utils/variantRules.js";
import { removeFile } from "../config/upload.js";

export async function listProducts() {
    return Product.find().sort({ createdAt: -1 });
}

export async function getProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError("Product not found");
    }
    return product;
}

// used before every seller write, sellerId always comes from the token
export async function getOwnedProduct(productId, sellerId) {
    const product = await getProduct(productId);
    if (product.sellerId.toString() !== sellerId) {
        throw new ForbiddenError("You don't own this product");
    }
    return product;
}

function getVariant(product, variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) {
        throw new NotFoundError("Variant not found");
    }
    return variant;
}

export async function listSellerProducts(sellerId) {
    return Product.find({ sellerId }).sort({ createdAt: -1 });
}

export async function createProduct(sellerId, data) {
    checkVariants(data.attributes, data.variants);
    return Product.create({ ...data, sellerId });
}

export async function updateProduct(productId, sellerId, data) {
    const product = await getOwnedProduct(productId, sellerId);
    Object.assign(product, data);
    return product.save();
}

export async function deleteProduct(productId, sellerId) {
    const product = await getOwnedProduct(productId, sellerId);
    await product.deleteOne();

    for (const variant of product.variants) {
        variant.imageUrls.forEach((img) => removeFile(img.filename));
    }
}

export async function addVariant(productId, sellerId, data) {
    const product = await getOwnedProduct(productId, sellerId);
    product.variants.push(data);
    checkVariants(product.attributes, product.variants);
    return product.save();
}

export async function updateVariant(productId, variantId, sellerId, data) {
    const product = await getOwnedProduct(productId, sellerId);
    const variant = getVariant(product, variantId);

    Object.assign(variant, data);
    checkVariants(product.attributes, product.variants);
    return product.save();
}

export async function deleteVariant(productId, variantId, sellerId) {
    const product = await getOwnedProduct(productId, sellerId);
    const variant = getVariant(product, variantId);

    if (product.variants.length === 1) {
        throw new ValidationError("A product needs at least one variant, delete the product instead");
    }

    const images = variant.imageUrls.map((img) => img.filename);
    variant.deleteOne();
    await product.save();
    images.forEach(removeFile);
    return product;
}

// Stock is changed with one conditional $inc, never read-then-save.
// The filter only matches if stock + change stays >= 0, so two requests
// racing on the same variant can't oversell or overwrite each other.
export async function adjustStock(productId, variantId, sellerId, change) {
    const updated = await Product.findOneAndUpdate(
        {
            _id: productId,
            sellerId,
            variants: { $elemMatch: { _id: variantId, stock: { $gte: -change } } },
        },
        { $inc: { "variants.$.stock": change } },
        { new: true },
    );

    if (updated) {
        return updated;
    }

    // nothing matched, find out why so we can send the right error
    const product = await getOwnedProduct(productId, sellerId);
    getVariant(product, variantId);
    throw new ConflictError("Not enough stock for this change");
}

export async function purchase(productId, variantId, quantity) {
    const updated = await Product.findOneAndUpdate(
        {
            _id: productId,
            variants: { $elemMatch: { _id: variantId, isAvailable: true, stock: { $gte: quantity } } },
        },
        { $inc: { "variants.$.stock": -quantity } },
        { new: true },
    );

    if (updated) {
        return updated;
    }

    const product = await getProduct(productId);
    const variant = getVariant(product, variantId);
    if (!variant.isAvailable || variant.stock === 0) {
        throw new ConflictError("This variant is out of stock");
    }
    throw new ConflictError(`Only ${variant.stock} left in stock`);
}

export async function addImages(productId, variantId, sellerId, files) {
    try{
        if (!files || files.length === 0) {
            throw new ValidationError("No images uploaded");
        }

        const product = await getOwnedProduct(productId, sellerId);
        const variant = getVariant(product, variantId);

        for (const file of files) {
            variant.imageUrls.push({ url: `/uploads/${file.filename}`, filename: file.filename });
        }
        return await product.save();
    }catch(err){
        // don't leave files on disk if the request failed
        (files || []).forEach((file) => removeFile(file.filename));
        throw err;
    }
}

export async function removeImage(productId, variantId, imageId, sellerId) {
    const product = await getOwnedProduct(productId, sellerId);
    const variant = getVariant(product, variantId);
    const image = variant.imageUrls.id(imageId);

    if (!image) {
        throw new NotFoundError("Image not found");
    }

    const filename = image.filename;
    image.deleteOne();
    await product.save();
    removeFile(filename);
    return product;
}
