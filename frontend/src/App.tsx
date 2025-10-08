import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import InvoicePage from "./pages/InvoicePage";
import StatsPage from "./pages/StatsPage";
import CartSidebar from "./components/CartSidebar";
import FloatingCartButton from "./components/FloatingCartButton";
import useCartStore from "./store/cartStore";

function App() {
  const isSidebarOpen = useCartStore((state) => state.isSidebarOpen);
  const toggleSidebar = useCartStore((state) => state.toggleSidebar);

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="pb-24">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/invoice/:id" element={<InvoicePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
      </div>
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Dong gio hang"
          className="fixed inset-0 z-30 bg-black/40 transition-opacity"
          onClick={() => toggleSidebar(false)}
        />
      )}
      <CartSidebar isOpen={isSidebarOpen} />
      <FloatingCartButton />
    </div>
  );
}

export default App;
