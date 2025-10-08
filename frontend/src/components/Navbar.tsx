import { NavLink, useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";

const navItems = [
  { to: "/products", label: "San pham" },
  { to: "/stats", label: "Thong ke" }
];

const Navbar = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => navigate("/products")}
        >
          <span className="text-2xl font-semibold text-primary">Convenience Store</span>
        </div>
        <nav className="hidden gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-slate-600 hover:text-primary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex" />
      </div>
    </header>
  );
};

export default Navbar;
