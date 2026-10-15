export function canBuy(variant) {
    return Boolean(variant && variant.isAvailable && variant.stock > 0);
}

function valueOf(variant, attribute) {
    const option = variant.options.find((o) => o.name.toLowerCase() === attribute.toLowerCase());
    return option ? option.value : null;
}

// all values for each attribute, in the order they first appear
export function getAttributeValues(product) {
    const result = {};
    for (const attribute of product.attributes) {
        const values = product.variants.map((v) => valueOf(v, attribute)).filter(Boolean);
        result[attribute] = [...new Set(values)];
    }
    return result;
}

// selection looks like { Colour: "Red", Size: "Small" }
export function findVariant(product, selection) {
    return product.variants.find((variant) =>
        product.attributes.every((attribute) => valueOf(variant, attribute) === selection[attribute])
    ) || null;
}

export function getVariantSelection(product, variant) {
    const selection = {};
    for (const attribute of product.attributes) {
        selection[attribute] = valueOf(variant, attribute);
    }
    return selection;
}

// start on the first variant that can be bought, otherwise just the first one
export function getDefaultSelection(product) {
    const variant = product.variants.find(canBuy) || product.variants[0];
    return getVariantSelection(product, variant);
}

// would picking this value (keeping the other picks) give a variant that can be bought?
export function isValueBuyable(product, selection, attribute, value) {
    return canBuy(findVariant(product, { ...selection, [attribute]: value }));
}

export function formatPrice(amount) {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
}
