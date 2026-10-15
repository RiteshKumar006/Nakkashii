// sorted + lowercase so "Size XL, Colour Red" and "colour red, size xl" give same key
export function buildCombinationKey(options = []) {
    const parts = options.map((opt) => {
        return `${opt.name.trim().toLowerCase()}:${opt.value.trim().toLowerCase()}`;
    });

    return parts.sort().join("|");
}
