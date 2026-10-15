import { test } from "node:test";
import assert from "node:assert/strict";
import { checkVariants } from "../src/utils/variantRules.js";
import {ValidationError, ConflictError} from "../src/utils/error.js";

const attrs = ["Colour", "Size"];

function variant(sku, colour, size) {
    return { sku, options: [{ name: "Colour", value: colour }, { name: "Size", value: size }] };
}

test("valid variants pass", () => {
    assert.doesNotThrow(() => checkVariants(attrs, [variant("A", "Red", "S"), variant("B", "Red", "L")]));
});

test("duplicate combination is rejected, even with different case", () => {
    assert.throws(
        () => checkVariants(attrs, [variant("A", "Red", "S"), variant("B", "red", "s")]),
        ConflictError
    );
});

test("duplicate sku is rejected, even with different case", () => {
    assert.throws(
        () => checkVariants(attrs, [variant("abc", "Red", "S"), variant("ABC", "Blue", "S")]),
        ConflictError
    );
});

test("variant missing an attribute is rejected", () => {
    const missing = { sku: "A", options: [{ name: "Colour", value: "Red" }] };
    assert.throws(() => checkVariants(attrs, [missing]), ValidationError);
});

test("variant with an extra attribute is rejected", () => {
    const extra = { sku: "A", options: [...variant("A", "Red", "S").options, { name: "Material", value: "Silk" }] };
    assert.throws(() => checkVariants(attrs, [extra]), ValidationError);
});

test("product without attributes allows only one variant", () => {
    assert.doesNotThrow(() => checkVariants([], [{ sku: "A", options: [] }]));
    assert.throws(() => checkVariants([], [{ sku: "A", options: [] }, { sku: "B", options: [] }]), ConflictError);
});
