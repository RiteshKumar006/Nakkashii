import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startDB, stopDB, clearDB, createUsers, scarfData } from "./helpers.js";
import * as productService from "../src/services/product.service.js";
import {ForbiddenError, ConflictError, NotFoundError} from "../src/utils/error.js";

let users;
let product;

before(startDB);
after(stopDB);

beforeEach(async () => {
    await clearDB();
    users = await createUsers();
    product = await productService.createProduct(users.seller1._id.toString(), scarfData());
});

function redVariant() {
    return product.variants.find((v) => v.sku === "SC-RED-S");
}

test("purchase lowers stock", async () => {
    const updated = await productService.purchase(product._id, redVariant()._id, 3);
    assert.equal(updated.variants.id(redVariant()._id).stock, 7);
});

test("purchase of out of stock variant is rejected", async () => {
    const blue = product.variants.find((v) => v.sku === "SC-BLUE-S");
    await assert.rejects(productService.purchase(product._id, blue._id, 1), ConflictError);
});

test("purchase of more than stock is rejected and stock is unchanged", async () => {
    await assert.rejects(productService.purchase(product._id, redVariant()._id, 11), ConflictError);
    const fresh = await productService.getProduct(product._id);
    assert.equal(fresh.variants.id(redVariant()._id).stock, 10);
});

test("unavailable variant can't be bought even with stock", async () => {
    const sellerId = users.seller1._id.toString();
    await productService.updateVariant(product._id, redVariant()._id, sellerId, { isAvailable: false });
    await assert.rejects(productService.purchase(product._id, redVariant()._id, 1), ConflictError);
});

test("concurrent purchases never oversell", async () => {
    // stock is 10, 25 buyers try to buy 1 at the same time
    const attempts = Array.from({ length: 25 }, () =>
        productService.purchase(product._id, redVariant()._id, 1)
    );
    const results = await Promise.allSettled(attempts);

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fresh = await productService.getProduct(product._id);

    assert.equal(ok, 10);
    assert.equal(fresh.variants.id(redVariant()._id).stock, 0);
});

test("concurrent stock adjustments don't lose updates", async () => {
    const sellerId = users.seller1._id.toString();
    const adds = Array.from({ length: 20 }, () =>
        productService.adjustStock(product._id, redVariant()._id, sellerId, 5)
    );
    await Promise.all(adds);

    const fresh = await productService.getProduct(product._id);
    assert.equal(fresh.variants.id(redVariant()._id).stock, 10 + 20 * 5);
});

test("stock can't go below zero", async () => {
    const sellerId = users.seller1._id.toString();
    await assert.rejects(productService.adjustStock(product._id, redVariant()._id, sellerId, -11), ConflictError);
});

test("another seller can't read or change the product", async () => {
    const otherSeller = users.seller2._id.toString();

    await assert.rejects(productService.getOwnedProduct(product._id, otherSeller), ForbiddenError);
    await assert.rejects(productService.updateProduct(product._id, otherSeller, { name: "x" }), ForbiddenError);
    await assert.rejects(productService.adjustStock(product._id, redVariant()._id, otherSeller, 5), ForbiddenError);
    await assert.rejects(productService.deleteVariant(product._id, redVariant()._id, otherSeller), ForbiddenError);
    await assert.rejects(productService.deleteProduct(product._id, otherSeller), ForbiddenError);

    const fresh = await productService.getProduct(product._id);
    assert.equal(fresh.name, "Scarf");
    assert.equal(fresh.variants.id(redVariant()._id).stock, 10);
});

test("unknown variant is 404", async () => {
    const sellerId = users.seller1._id.toString();
    await assert.rejects(
        productService.adjustStock(product._id, users.buyer._id, sellerId, 1),
        NotFoundError
    );
});

test("adding a duplicate combination is rejected", async () => {
    const sellerId = users.seller1._id.toString();
    const dup = {
        sku: "NEW",
        options: [{ name: "size", value: "s" }, { name: "colour", value: "RED" }],
        price: 1,
        stock: 1,
        isAvailable: true,
    };
    await assert.rejects(productService.addVariant(product._id, sellerId, dup), ConflictError);
});
