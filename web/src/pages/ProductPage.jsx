import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { canBuy, findVariant, formatPrice, getDefaultSelection } from "../utils/variants";
import VariantPicker from "../components/VariantPicker";
import ImageGallery from "../components/ImageGallery";
import StockBadge from "../components/StockBadge";
import ErrorMessage from "../components/ErrorMessage";

export default function ProductPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const { addItem } = useCart();
    const [product, setProduct] = useState(null);
    const [selection, setSelection] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        api(`/products/${id}`)
            .then((data) => {
                setProduct(data);
                setSelection(getDefaultSelection(data));
            })
            .catch(setError);
    }, [id]);

    if (error) return <ErrorMessage error={error} />;
    if (!product) return <p>Loading...</p>;

    const variant = findVariant(product, selection);
    const buyable = canBuy(variant);
    const allSoldOut = !product.variants.some(canBuy);
    const maxQty = buyable ? Math.min(variant.stock, 20) : 1;
    const isOwner = user?.role === "seller" && user.id === product.sellerId;

    function changeSelection(next) {
        setSelection(next);
        setQuantity(1);
        setAdded(false);
    }

    function addToCart() {
        if (!buyable) return;
        addItem(product, variant, Math.min(quantity, maxQty));
        setAdded(true);
    }

    return (
        <div className="product-page">
            <ImageGallery key={variant?._id} images={variant?.imageUrls} alt={product.name} />

            <div className="product-info">
                <p className="muted">{product.category}</p>
                <h1>{product.name}</h1>
                <p>{product.description}</p>

                {isOwner && (
                    <div className="owner-bar">
                        <span>You are the seller of this product</span>
                        {variant && (
                            <Link to={`/seller/products/${product._id}?variant=${variant._id}`} className="button primary">
                                Edit this variant
                            </Link>
                        )}
                        <Link to={`/seller/products/${product._id}`} className="button">Edit product</Link>
                    </div>
                )}

                {allSoldOut && (
                    <div className="notice">Sorry, every option of this product is sold out right now.</div>
                )}

                {product.attributes.length > 0 && (
                    <VariantPicker product={product} selection={selection} onChange={changeSelection} />
                )}

                {variant ? (
                    <div className="price-row">
                        <span className="price">{formatPrice(variant.price)}</span>
                        <StockBadge variant={variant} />
                    </div>
                ) : (
                    <div className="notice">
                        This combination isn't available. Try a different {product.attributes.join(" / ").toLowerCase()}.
                    </div>
                )}

                <div className="buy-row">
                    <input
                        type="number"
                        min="1"
                        max={maxQty}
                        value={quantity}
                        disabled={!buyable}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    />
                    <button type="button" className="primary" disabled={!buyable} onClick={addToCart}>
                        {buyable ? "Add to cart" : "Can't add to cart"}
                    </button>
                </div>

                {added && (
                    <p className="success">
                        Added to cart. <Link to="/cart">Go to cart</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
