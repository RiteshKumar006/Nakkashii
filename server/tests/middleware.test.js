import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../src/middleware/auth.js";
import { requireRole } from "../src/middleware/requireRole.js";
import {UnauthorizedError, ForbiddenError} from "../src/utils/error.js";

process.env.JWT_SECRET = "test-secret";

// runs a middleware and returns what it passed to next()
function run(middleware, req) {
    let result;
    middleware(req, {}, (err) => (result = err));
    return result;
}

test("auth: valid token sets req.user", () => {
    const token = jwt.sign({ sub: "user1", role: "seller" }, "test-secret");
    const req = { headers: { authorization: `Bearer ${token}` } };

    assert.equal(run(authMiddleware, req), undefined);
    assert.equal(req.user.sub, "user1");
    assert.equal(req.user.role, "seller");
});

test("auth: missing header is 401", () => {
    assert.ok(run(authMiddleware, { headers: {} }) instanceof UnauthorizedError);
});

test("auth: token signed with another secret is 401", () => {
    const token = jwt.sign({ sub: "user1", role: "seller" }, "wrong-secret");
    const err = run(authMiddleware, { headers: { authorization: `Bearer ${token}` } });
    assert.ok(err instanceof UnauthorizedError);
});

test("auth: unsigned token (alg none) is 401", () => {
    const token = jwt.sign({ sub: "user1", role: "seller" }, null, { algorithm: "none" });
    const err = run(authMiddleware, { headers: { authorization: `Bearer ${token}` } });
    assert.ok(err instanceof UnauthorizedError);
});

test("requireRole: buyer can't use seller routes", () => {
    const err = run(requireRole("seller"), { user: { role: "buyer" } });
    assert.ok(err instanceof ForbiddenError);
});

test("requireRole: seller passes", () => {
    assert.equal(run(requireRole("seller"), { user: { role: "seller" } }), undefined);
});
