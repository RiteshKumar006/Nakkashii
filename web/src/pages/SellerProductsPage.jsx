import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";

export default function SellerProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api("/seller/products", { token }).then(setProducts).catch(setError);
    }, [token]);

    async function deleteProduct(product) {
        if (!confirm(`Delete "${product.name}" and all its variants?`)) return;
        try {
            await api(`/seller/products/${product._id}`, { method: "DELETE", token });
            setProducts((prev) => prev.filter((p) => p._id !== product._id));
        } catch (err) {
            setError(err);
        }
    }

    if (error) return <ErrorMessage error={error} />;
    if (!products) return <p>Loading...</p>;

    return (
        <div>
            <div className="page-head">
                <h1>My products</h1>
                <Link to="/seller/new" className="button primary">+ New product</Link>
            </div>

            {products.length === 0 ? (
                <p className="muted">You haven't added any products yet.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Variants</th>
                            <th>Total stock</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => {
                            const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                            const outOfStock = p.variants.filter((v) => v.stock === 0).length;
                            return (
                                <tr key={p._id}>
                                    <td>{p.name}</td>
                                    <td>{p.category}</td>
                                    <td>{p.variants.length}</td>
                                    <td>
                                        {totalStock}
                                        {outOfStock > 0 && <span className="badge badge-red">{outOfStock} out of stock</span>}
                                    </td>
                                    <td className="actions">
                                        <Link to={`/seller/products/${p._id}`}>Edit</Link>
                                        <button type="button" className="link-danger" onClick={() => deleteProduct(p)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
