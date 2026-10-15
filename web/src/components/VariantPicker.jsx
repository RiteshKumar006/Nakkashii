import { getAttributeValues, isValueBuyable } from "../utils/variants";

export default function VariantPicker({ product, selection, onChange }) {
    const values = getAttributeValues(product);

    return (
        <div className="picker">
            {product.attributes.map((attribute) => (
                <div key={attribute} className="picker-row">
                    <p className="picker-label">
                        {attribute}: <strong>{selection[attribute]}</strong>
                    </p>
                    <div className="picker-options">
                        {values[attribute].map((value) => {
                            const selected = selection[attribute] === value;
                            const buyable = isValueBuyable(product, selection, attribute, value);
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    className={`option ${selected ? "selected" : ""} ${buyable ? "" : "crossed"}`}
                                    title={buyable ? "" : "Not available with your other choices"}
                                    onClick={() => onChange({ ...selection, [attribute]: value })}
                                >
                                    {value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
