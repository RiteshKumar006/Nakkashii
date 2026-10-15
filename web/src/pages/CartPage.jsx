import { useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/variants";

function optionText(variant) {
    return variant.options.map((o) => `${o.name}: ${o.value}`).join(", ");
}

export default function CartPage() {
    const { token } = useAuth();
    const { items, removeItem } = useCart();
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState(false);

    const total = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

    // stock can run out between add to cart and checkout,
    // so each item is bought separately and failures stay in the cart
    async function checkout() {
        setBusy(true);
        const messages = [];

        for (const item of items) {
            const path = `/products/${item.product._id}/variants/${item.variant._id}/purchase`;
            try {
                await api(path, { method: "POST", body: { quantity: item.quantity }, token });
                messages.push({ ok: true, text: `${item.product.name} (${item.variant.sku}): ordered` });
                removeItem(item.variant._id);
            } catch (err) {
                messages.push({ ok: false, text: `${item.product.name} (${item.variant.sku}): ${err.message}` });
            }
        }

        setResults(messages);
        setBusy(false);
    }

    return (
        <div>
            <h1>Cart</h1>

            {results.length > 0 && (
                <ul className="results">
                    {results.map((r, i) => (
                        <li key={i} className={r.ok ? "success" : "error-text"}>{r.text}</li>
                    ))}
                </ul>
            )}

            {items.length === 0 ? (
                <p className="muted">Your cart is empty. <Link to="/">Continue shopping</Link></p>
            ) : (
                <>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variant</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.variant._id}>
                                    <td>{item.product.name}</td>
                                    <td>{optionText(item.variant) || item.variant.sku}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatPrice(item.variant.price * item.quantity)}</td>
                                    <td>
                                        <button type="button" className="link-danger" onClick={() => removeItem(item.variant._id)}>
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p className="price">Total: {formatPrice(total)}</p>

                    {token ? (
                        <button type="button" className="primary" disabled={busy} onClick={checkout}>
                            {busy ? "Placing order..." : "Place order"}
                        </button>
                    ) : (
                        <p className="muted">Log in from the menu at the top to place the order.</p>
                    )}
                </>
            )}
        </div>
    );
}
