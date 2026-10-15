import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

function loadSaved(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

// every user gets their own cart in the browser, so switching account switches cart.
// checkout calls the purchase api per item
export function CartProvider({ children }) {
    const { user } = useAuth();
    const key = `cart:${user?.id || "guest"}`;
    const [cart, setCart] = useState(() => ({ key, items: loadSaved(key) }));

    // user changed, load that user's cart
    if (cart.key !== key) {
        setCart({ key, items: loadSaved(key) });
    }

    useEffect(() => {
        localStorage.setItem(cart.key, JSON.stringify(cart.items));
    }, [cart]);

    function setItems(update) {
        setCart((prev) => ({ ...prev, items: update(prev.items) }));
    }

    function addItem(product, variant, quantity) {
        setItems((prev) => {
            const existing = prev.find((item) => item.variant._id === variant._id);
            if (existing) {
                return prev.map((item) =>
                    item === existing ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prev, { product, variant, quantity }];
        });
    }

    function removeItem(variantId) {
        setItems((prev) => prev.filter((item) => item.variant._id !== variantId));
    }

    function clear() {
        setItems(() => []);
    }

    const items = cart.items;
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, count, addItem, removeItem, clear }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
