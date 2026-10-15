import { Routes, Route } from "react-router";
import Header from "./components/Header";
import RequireSeller from "./components/RequireSeller";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import SellerProductsPage from "./pages/SellerProductsPage";
import NewProductPage from "./pages/NewProductPage";
import EditProductPage from "./pages/EditProductPage";

function App() {
    return (
        <>
            <Header />
            <main className="container">
                <Routes>
                    <Route path="/" element={<ShopPage />} />
                    <Route path="/products/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/seller" element={<RequireSeller><SellerProductsPage /></RequireSeller>} />
                    <Route path="/seller/new" element={<RequireSeller><NewProductPage /></RequireSeller>} />
                    <Route path="/seller/products/:id" element={<RequireSeller><EditProductPage /></RequireSeller>} />
                    <Route path="*" element={<p>Page not found.</p>} />
                </Routes>
            </main>
        </>
    );
}

export default App;
