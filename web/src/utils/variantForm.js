export function emptyVariant() {
    return { sku: "", options: {}, price: "", stock: 0, isAvailable: true };
}

// form state -> api body
export function toVariantBody(attributes, variant) {
    return {
        sku: variant.sku,
        options: attributes.map((name) => ({ name, value: variant.options[name] || "" })),
        price: Number(variant.price),
        stock: Number(variant.stock),
        isAvailable: variant.isAvailable,
    };
}
