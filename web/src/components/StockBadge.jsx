export default function StockBadge({ variant }) {
    if (!variant) {
        return <span className="badge badge-grey">Not available</span>;
    }
    if (!variant.isAvailable) {
        return <span className="badge badge-grey">Unavailable</span>;
    }
    if (variant.stock === 0) {
        return <span className="badge badge-red">Out of stock</span>;
    }
    if (variant.stock <= 5) {
        return <span className="badge badge-orange">Only {variant.stock} left</span>;
    }
    return <span className="badge badge-green">In stock</span>;
}
