import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCombinationKey } from "../src/utils/combinationKey.js";

test("same options in any order or case give the same key", () => {
    const a = buildCombinationKey([{ name: "Size", value: "XL" }, { name: "Colour", value: "Red" }]);
    const b = buildCombinationKey([{ name: " colour", value: "red " }, { name: "size", value: "xl" }]);

    assert.equal(a, "colour:red|size:xl");
    assert.equal(a, b);
});

test("no options gives an empty key", () => {
    assert.equal(buildCombinationKey([]), "");
});
