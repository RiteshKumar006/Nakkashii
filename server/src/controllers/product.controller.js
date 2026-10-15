import * as productService from "../services/product.service.js";

function send(res, data, status = 200) {
    res.status(status).json({ success: true, data });
}

export async function listProducts(req, res) {
    send(res, await productService.listProducts());
}

export async function getProduct(req, res) {
    send(res, await productService.getProduct(req.params.id));
}

export async function purchase(req, res) {
    const { id, variantId } = req.params;
    send(res, await productService.purchase(id, variantId, req.body.quantity));
}

export async function listMyProducts(req, res) {
    send(res, await productService.listSellerProducts(req.user.sub));
}

export async function getMyProduct(req, res) {
    send(res, await productService.getOwnedProduct(req.params.id, req.user.sub));
}

export async function createProduct(req, res) {
    send(res, await productService.createProduct(req.user.sub, req.body), 201);
}

export async function updateProduct(req, res) {
    send(res, await productService.updateProduct(req.params.id, req.user.sub, req.body));
}

export async function deleteProduct(req, res) {
    await productService.deleteProduct(req.params.id, req.user.sub);
    res.status(204).end();
}

export async function addVariant(req, res) {
    send(res, await productService.addVariant(req.params.id, req.user.sub, req.body), 201);
}

export async function updateVariant(req, res) {
    const { id, variantId } = req.params;
    send(res, await productService.updateVariant(id, variantId, req.user.sub, req.body));
}

export async function deleteVariant(req, res) {
    const { id, variantId } = req.params;
    send(res, await productService.deleteVariant(id, variantId, req.user.sub));
}

export async function adjustStock(req, res) {
    const { id, variantId } = req.params;
    send(res, await productService.adjustStock(id, variantId, req.user.sub, req.body.change));
}

export async function addImages(req, res) {
    const { id, variantId } = req.params;
    send(res, await productService.addImages(id, variantId, req.user.sub, req.files), 201);
}

export async function removeImage(req, res) {
    const { id, variantId, imageId } = req.params;
    send(res, await productService.removeImage(id, variantId, imageId, req.user.sub));
}
