import {ValidationError, ConflictError} from "./error.js";
import { buildCombinationKey } from "./combinationKey.js";


export function checkVariants(attributes, variants) {
    const expected = attributes.map((a) => a.toLowerCase()).sort().join(",");
    const keys = new Set();
    const skus = new Set();

    for (const variant of variants) {
        const names = variant.options.map((o) => o.name.toLowerCase()).sort().join(",");
        if (names !== expected) {
            throw new ValidationError(`Variant ${variant.sku} must have one value for each attribute (${attributes.join(", ") || "none"})`);
        }

        const key = buildCombinationKey(variant.options);
        if (keys.has(key)) {
            throw new ConflictError(`Duplicate variant: ${key || "default"}`);
        }
        keys.add(key);

        const sku = variant.sku.toUpperCase();
        if (skus.has(sku)) {
            throw new ConflictError(`Duplicate SKU: ${sku}`);
        }
        skus.add(sku);
    }
}
