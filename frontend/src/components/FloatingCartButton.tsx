import { useMemo } from "react";
import useCartStore from "../store/cartStore";

const FloatingCartButton = () => {
  const toggleSidebar = useCartStore((state) => state.toggleSidebar);
  const isSidebarOpen = useCartStore((state) => state.isSidebarOpen);
  const totalQuantity = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  const badge = useMemo(() => totalQuantity, [totalQuantity]);

  if (isSidebarOpen) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => toggleSidebar(true)}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/40"
      aria-label="Mo gio hang"
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6l-1-3H2" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
          {badge}
        </span>
      )}
    </button>
  );
};

export default FloatingCartButton;
