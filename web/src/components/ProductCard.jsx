import { Link } from "react-router";
import { canBuy, formatPrice } from "../utils/variants";

export default function ProductCard({ product }) {
    const prices = product.variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const image = product.variants.flatMap((v) => v.imageUrls)[0];
    const soldOut = !product.variants.some(canBuy);

    return (
        <Link to={`/products/${product._id}`} className="card">
            {image ? <img src={image.url} alt={product.name} /> : <div className="card-noimg">No image</div>}
            <div className="card-body">
                <h3>{product.name}</h3>
                <p className="muted">{product.category}</p>
                <p>
                    {new Set(prices).size > 1 ? "From " : ""}
                    {formatPrice(minPrice)}
                </p>
                {soldOut && <span className="badge badge-red">Sold out</span>}
            </div>
        </Link>
    );
}
