import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import VariantFields from "./VariantFields";
import { toVariantBody } from "../utils/variantForm";
import StockBadge from "./StockBadge";
import ErrorMessage from "./ErrorMessage";

function toForm(variant) {
    const options = {};
    variant.options.forEach((o) => (options[o.name] = o.value));
    return { sku: variant.sku, options, price: variant.price, stock: variant.stock, isAvailable: variant.isAvailable };
}

// edit one existing variant: details, stock and images
export default function VariantEditor({ product, variant, onUpdated, highlighted }) {
    const { token } = useAuth();
    const boxRef = useRef(null);
    const [form, setForm] = useState(() => toForm(variant));
    const [stockChange, setStockChange] = useState(1);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const base = `/seller/products/${product._id}/variants/${variant._id}`;

    useEffect(() => {
        if (highlighted) {
            boxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [highlighted]);

    async function run(request) {
        setBusy(true);
        setError(null);
        try {
            const updated = await request();
            if (updated) onUpdated(updated);
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    function saveDetails(e) {
        e.preventDefault();
        const body = toVariantBody(product.attributes, form);
        delete body.stock; // stock goes through its own endpoint
        run(() => api(base, { method: "PATCH", body, token }));
    }

    function changeStock(sign) {
        const change = sign * Math.abs(parseInt(stockChange, 10) || 0);
        if (change === 0) return;
        run(() => api(`${base}/stock`, { method: "PATCH", body: { change }, token }));
    }

    function uploadImages(e) {
        const files = [...e.target.files];
        e.target.value = "";
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));
        run(() => api(`${base}/images`, { method: "POST", body: formData, token }));
    }

    function removeImage(imageId) {
        run(() => api(`${base}/images/${imageId}`, { method: "DELETE", token }));
    }

    function deleteVariant() {
        if (!confirm(`Delete variant ${variant.sku}?`)) return;
        run(() => api(base, { method: "DELETE", token }));
    }

    return (
        <div ref={boxRef} className={`variant-editor ${highlighted ? "highlighted" : ""}`}>
            <div className="variant-editor-head">
                <strong>{variant.sku}</strong>
                <StockBadge variant={variant} />
            </div>

            <form onSubmit={saveDetails}>
                <VariantFields attributes={product.attributes} value={form} onChange={setForm} showStock={false} />
                <button type="submit" disabled={busy}>Save details</button>
            </form>

            <div className="stock-row">
                <span>Stock: <strong>{variant.stock}</strong></span>
                <input
                    type="number"
                    min="1"
                    value={stockChange}
                    onChange={(e) => setStockChange(e.target.value)}
                />
                <button type="button" disabled={busy} onClick={() => changeStock(1)}>+ Add</button>
                <button type="button" disabled={busy || variant.stock === 0} onClick={() => changeStock(-1)}>- Remove</button>
            </div>

            <div className="images-row">
                {variant.imageUrls.map((img) => (
                    <div key={img._id} className="thumb">
                        <img src={img.url} alt="" />
                        <button type="button" disabled={busy} onClick={() => removeImage(img._id)} title="Remove image">×</button>
                    </div>
                ))}
                <label className="upload">
                    + Images
                    <input type="file" accept="image/*" multiple hidden onChange={uploadImages} disabled={busy} />
                </label>
            </div>

            <ErrorMessage error={error} />

            <button type="button" className="link-danger" disabled={busy} onClick={deleteVariant}>
                Delete variant
            </button>
        </div>
    );
}
