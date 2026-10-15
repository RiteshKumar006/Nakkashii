// inputs for one variant, used by the create form and the add variant form
export default function VariantFields({ attributes, value, onChange, showStock = true }) {
    function set(field, fieldValue) {
        onChange({ ...value, [field]: fieldValue });
    }

    function setOption(attribute, optionValue) {
        onChange({ ...value, options: { ...value.options, [attribute]: optionValue } });
    }

    return (
        <div className="variant-fields">
            {attributes.map((attribute) => (
                <label key={attribute}>
                    {attribute}
                    <input
                        value={value.options[attribute] || ""}
                        onChange={(e) => setOption(attribute, e.target.value)}
                        required
                    />
                </label>
            ))}
            <label>
                SKU
                <input value={value.sku} onChange={(e) => set("sku", e.target.value)} required />
            </label>
            <label>
                Price (₹)
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value.price}
                    onChange={(e) => set("price", e.target.value)}
                    required
                />
            </label>
            {showStock && (
                <label>
                    Stock
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={value.stock}
                        onChange={(e) => set("stock", e.target.value)}
                        required
                    />
                </label>
            )}
            <label className="checkbox">
                <input
                    type="checkbox"
                    checked={value.isAvailable}
                    onChange={(e) => set("isAvailable", e.target.checked)}
                />
                Available
            </label>
        </div>
    );
}
