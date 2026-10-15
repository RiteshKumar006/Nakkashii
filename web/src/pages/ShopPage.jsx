import { useEffect, useState } from "react";
import { api } from "../api";
import ProductCard from "../components/ProductCard";
import ErrorMessage from "../components/ErrorMessage";

export default function ShopPage() {
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api("/products").then(setProducts).catch(setError);
    }, []);

    if (error) return <ErrorMessage error={error} />;
    if (!products) return <p>Loading...</p>;

    return (
        <div>
            <h1>Shop</h1>
            {products.length === 0 ? (
                <p className="muted">No products yet.</p>
            ) : (
                <div className="grid">
                    {products.map((p) => (
                        <ProductCard key={p._id} product={p} />
                    ))}
                </div>
            )}
        </div>
    );
}
