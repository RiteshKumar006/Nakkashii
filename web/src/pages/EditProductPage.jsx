import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import VariantEditor from "../components/VariantEditor";
import VariantFields from "../components/VariantFields";
import { emptyVariant, toVariantBody } from "../utils/variantForm";
import ErrorMessage from "../components/ErrorMessage";

export default function EditProductPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const focusVariantId = searchParams.get("variant"); // set by the edit button on the product page
    const { token } = useAuth();
    const [product, setProduct] = useState(null);
    const [details, setDetails] = useState(null);
    const [newVariant, setNewVariant] = useState(emptyVariant());
    const [loadError, setLoadError] = useState(null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        api(`/seller/products/${id}`, { token })
            .then((data) => {
                setProduct(data);
                setDetails({ name: data.name, description: data.description, category: data.category });
            })
            .catch(setLoadError);
    }, [id, token]);

    if (loadError) return <ErrorMessage error={loadError} />;
    if (!product) return <p>Loading...</p>;

    async function saveDetails(e) {
        e.preventDefault();
        setError(null);
        setSaved(false);
        try {
            setProduct(await api(`/seller/products/${id}`, { method: "PATCH", body: details, token }));
            setSaved(true);
        } catch (err) {
            setError(err);
        }
    }

    async function addVariant(e) {
        e.preventDefault();
        setError(null);
        try {
            const body = toVariantBody(product.attributes, newVariant);
            setProduct(await api(`/seller/products/${id}/variants`, { method: "POST", body, token }));
            setNewVariant(emptyVariant());
        } catch (err) {
            setError(err);
        }
    }

    return (
        <div>
            <Link to="/seller">← My products</Link>
            {" · "}
            <Link to={`/products/${product._id}`}>View in shop</Link>

            <form onSubmit={saveDetails} className="form">
                <h1>Edit product</h1>
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
                    <input
                        value={details.category}
                        onChange={(e) => setDetails({ ...details, category: e.target.value })}
                        required
                    />
                </label>
                <p className="muted">
                    Attributes: {product.attributes.join(", ") || "none (single variant)"}
                </p>
                <button type="submit" className="primary">Save details</button>
                {saved && <span className="success"> Saved</span>}
            </form>

            <ErrorMessage error={error} />

            <h2>Variants</h2>
            {product.variants.map((variant) => (
                <VariantEditor
                    key={variant._id}
                    product={product}
                    variant={variant}
                    onUpdated={setProduct}
                    highlighted={variant._id === focusVariantId}
                />
            ))}

            {product.attributes.length > 0 && (
                <form onSubmit={addVariant} className="variant-box">
                    <h3>Add variant</h3>
                    <VariantFields attributes={product.attributes} value={newVariant} onChange={setNewVariant} />
                    <button type="submit">Add variant</button>
                </form>
            )}
        </div>
    );
}
