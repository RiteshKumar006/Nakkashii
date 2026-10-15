import { Link, NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// stub login, these users come from `npm run seed` in the server
const DEMO_USERS = [
    { email: "buyer@nakkashii.test", label: "Buyer" },
    { email: "seller1@nakkashii.test", label: "Seller 1 (Asha Weaves)" },
    { email: "seller2@nakkashii.test", label: "Seller 2 (Kiran Crafts)" },
];

export default function Header() {
    const { user, loginAs, logout } = useAuth();
    const { count } = useCart();

    async function handleChange(e) {
        const email = e.target.value;
        if (email) {
            await loginAs(email);
        } else {
            logout();
        }
    }

    return (
        <header className="header">
            <Link to="/" className="logo">Nakkashii</Link>

            <nav>
                <NavLink to="/" end>Shop</NavLink>
                {user?.role === "seller" && <NavLink to="/seller">My products</NavLink>}
                <NavLink to="/cart">Cart ({count})</NavLink>
            </nav>

            <select value={user?.email || ""} onChange={handleChange} title="Demo login">
                <option value="">Not logged in</option>
                {DEMO_USERS.map((u) => (
                    <option key={u.email} value={u.email}>{u.label}</option>
                ))}
            </select>
        </header>
    );
}
