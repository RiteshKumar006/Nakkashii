import { test } from "node:test";
import assert from "node:assert/strict";
import {
    canBuy,
    findVariant,
    getAttributeValues,
    getDefaultSelection,
    isValueBuyable,
} from "./variants.js";

function variant(sku, colour, size, stock, isAvailable = true) {
    return {
        _id: sku,
        sku,
        options: [{ name: "Colour", value: colour }, { name: "Size", value: size }],
        price: 100,
        stock,
        isAvailable,
    };
}

// Green / Large doesn't exist, Blue / Small is out of stock
const scarf = {
    attributes: ["Colour", "Size"],
    variants: [
        variant("RED-S", "Red", "Small", 5),
        variant("RED-L", "Red", "Large", 2),
        variant("BLUE-S", "Blue", "Small", 0),
        variant("BLUE-L", "Blue", "Large", 3),
        variant("GREEN-S", "Green", "Small", 1),
    ],
};

test("finds the variant for a selection", () => {
    assert.equal(findVariant(scarf, { Colour: "Blue", Size: "Large" }).sku, "BLUE-L");
});

test("missing combination resolves to null", () => {
    assert.equal(findVariant(scarf, { Colour: "Green", Size: "Large" }), null);
});

test("partial selection resolves to null", () => {
    assert.equal(findVariant(scarf, { Colour: "Red" }), null);
});

test("canBuy needs stock and the available flag", () => {
    assert.equal(canBuy(variant("A", "Red", "S", 3)), true);
    assert.equal(canBuy(variant("A", "Red", "S", 0)), false);
    assert.equal(canBuy(variant("A", "Red", "S", 3, false)), false);
    assert.equal(canBuy(null), false);
});

test("lists values per attribute without duplicates", () => {
    assert.deepEqual(getAttributeValues(scarf), {
        Colour: ["Red", "Blue", "Green"],
        Size: ["Small", "Large"],
    });
});

test("default selection skips out of stock variants", () => {
    const product = { ...scarf, variants: [scarf.variants[2], scarf.variants[3]] };
    assert.deepEqual(getDefaultSelection(product), { Colour: "Blue", Size: "Large" });
});

test("default selection falls back to first variant when all are sold out", () => {
    const product = { attributes: ["Colour", "Size"], variants: [variant("X", "Red", "Small", 0)] };
    assert.deepEqual(getDefaultSelection(product), { Colour: "Red", Size: "Small" });
});

test("marks values that can't be bought with the current selection", () => {
    const selection = { Colour: "Green", Size: "Small" };
    assert.equal(isValueBuyable(scarf, selection, "Size", "Large"), false); // doesn't exist
    assert.equal(isValueBuyable(scarf, selection, "Colour", "Blue"), false); // out of stock
    assert.equal(isValueBuyable(scarf, selection, "Colour", "Red"), true);
});

test("product without attributes resolves to its only variant", () => {
    const planter = { attributes: [], variants: [{ ...variant("P", "", "", 4), options: [] }] };
    assert.equal(findVariant(planter, {}).sku, "P");
});
