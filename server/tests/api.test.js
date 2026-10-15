import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startDB, stopDB, createUsers, scarfData } from "./helpers.js";
import app from "../src/app.js";

const tokens = {};

before(async () => {
    await startDB();
    await createUsers();

    for (const name of ["seller1", "seller2", "buyer"]) {
        const res = await request(app).post("/api/auth/dev-login").send({ email: `${name}@test.com` });
        tokens[name] = res.body.data.token;
    }
});

after(stopDB);

const auth = (name) => ({ Authorization: `Bearer ${tokens[name]}` });

// one full flow through the real routes, middleware, validation and db
test("seller creates a product, buyer buys it, other seller is blocked", async () => {
    // sellerId in the body must be ignored
    const created = await request(app)
        .post("/api/seller/products")
        .set(auth("seller1"))
        .send({ ...scarfData(), sellerId: "000000000000000000000000" });

    assert.equal(created.status, 201);
    const product = created.body.data;
    const red = product.variants.find((v) => v.sku === "SC-RED-S");
    assert.equal(red.combinationKey, "colour:red|size:s");
    assert.notEqual(product.sellerId, "000000000000000000000000");

    // public read
    const read = await request(app).get(`/api/products/${product._id}`);
    assert.equal(read.status, 200);
    assert.equal(read.body.data.variants.length, 2);

    // buyer can't use seller routes
    const buyerTry = await request(app).get("/api/seller/products").set(auth("buyer"));
    assert.equal(buyerTry.status, 403);

    // other seller can't edit
    const steal = await request(app)
        .patch(`/api/seller/products/${product._id}`)
        .set(auth("seller2"))
        .send({ name: "Mine now" });
    assert.equal(steal.status, 403);
    assert.equal(steal.body.code, "FORBIDDEN");

    // duplicate combination
    const dup = await request(app)
        .post(`/api/seller/products/${product._id}/variants`)
        .set(auth("seller1"))
        .send({ sku: "OTHER", options: red.options, price: 1 });
    assert.equal(dup.status, 409);

    // duplicate sku
    const dupSku = await request(app)
        .post(`/api/seller/products/${product._id}/variants`)
        .set(auth("seller1"))
        .send({
            sku: "sc-red-s",
            options: [{ name: "Colour", value: "Green" }, { name: "Size", value: "S" }],
            price: 1,
        });
    assert.equal(dupSku.status, 409);

    // stock can only change through the stock endpoint
    const sneaky = await request(app)
        .patch(`/api/seller/products/${product._id}/variants/${red._id}`)
        .set(auth("seller1"))
        .send({ stock: 999 });
    assert.equal(sneaky.status, 422);

    // buy, then try to buy more than is left
    const buy = await request(app)
        .post(`/api/products/${product._id}/variants/${red._id}/purchase`)
        .set(auth("buyer"))
        .send({ quantity: 4 });
    assert.equal(buy.status, 200);
    assert.equal(buy.body.data.variants.find((v) => v._id === red._id).stock, 6);

    const tooMany = await request(app)
        .post(`/api/products/${product._id}/variants/${red._id}/purchase`)
        .set(auth("buyer"))
        .send({ quantity: 7 });
    assert.equal(tooMany.status, 409);
    assert.equal(tooMany.body.success, false);

    // seller restocks
    const restock = await request(app)
        .patch(`/api/seller/products/${product._id}/variants/${red._id}/stock`)
        .set(auth("seller1"))
        .send({ change: 4 });
    assert.equal(restock.status, 200);
    assert.equal(restock.body.data.variants.find((v) => v._id === red._id).stock, 10);
});

test("errors have the same shape", async () => {
    const cases = [
        await request(app).get("/api/seller/products"),
        await request(app).get("/api/products/not-an-id"),
        await request(app).post("/api/auth/dev-login").send({ email: "bad" }),
        await request(app).get("/api/nothing-here"),
    ];

    assert.deepEqual(cases.map((r) => r.status), [401, 400, 422, 404]);
    for (const res of cases) {
        assert.equal(res.body.success, false);
        assert.ok(res.body.message);
        assert.ok(res.body.code);
        assert.ok("details" in res.body);
    }
});
