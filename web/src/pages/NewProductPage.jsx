import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import VariantFields from "../components/VariantFields";
import { emptyVariant, toVariantBody } from "../utils/variantForm";
import ErrorMessage from "../components/ErrorMessage";

export default function NewProductPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [details, setDetails] = useState({ name: "", description: "", category: "" });
    const [attributesText, setAttributesText] = useState("Colour, Size");
    const [variants, setVariants] = useState([emptyVariant()]);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const attributes = attributesText.split(",").map((a) => a.trim()).filter(Boolean);

    function updateVariant(index, value) {
        setVariants((prev) => prev.map((v, i) => (i === index ? value : v)));
    }

    function removeVariant(index) {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);

        try {
            const body = {
                ...details,
                attributes,
                variants: variants.map((v) => toVariantBody(attributes, v)),
            };
            const product = await api("/seller/products", { method: "POST", body, token });
            // go to edit page so images can be added
            navigate(`/seller/products/${product._id}`);
        } catch (err) {
            setError(err);
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="form">
            <h1>New product</h1>

            <label>
                Name
                <input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} required />
            </label>
            <label>
                Description
                <textarea
                    value={details.description}
                    onChange={(e) => setDetails({ ...details, description: e.target.value })}
                    required
                />
            </label>
            <label>
                Category
                <input value={details.category} onChange={(e) => setDetails({ ...details, category: e.target.value })} required />
            </label>
            <label>
                Attributes (comma separated, leave empty for a single variant product)
                <input value={attributesText} onChange={(e) => setAttributesText(e.target.value)} />
            </label>

            <h2>Variants</h2>
            {variants.map((variant, index) => (
                <div key={index} className="variant-box">
                    <VariantFields attributes={attributes} value={variant} onChange={(v) => updateVariant(index, v)} />
                    {variants.length > 1 && (
                        <button type="button" className="link-danger" onClick={() => removeVariant(index)}>
                            Remove
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={() => setVariants([...variants, emptyVariant()])}>
                + Add variant
            </button>

            <p className="muted">You can add images after the product is created.</p>

            <ErrorMessage error={error} />

            <button type="submit" className="primary" disabled={busy}>
                {busy ? "Saving..." : "Create product"}
            </button>
        </form>
    );
}
