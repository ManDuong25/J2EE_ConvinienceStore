import { useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";

interface Props {
  isOpen: boolean;
}

const CartSidebar = ({ isOpen }: Props) => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const toggleSidebar = useCartStore((state) => state.toggleSidebar);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasItems = items.length > 0;

  const handleCheckout = () => {
    if (!hasItems) {
      return;
    }
    toggleSidebar(false);
    navigate("/checkout");
  };

  return (
    <aside
      className={`flex flex-col fixed right-0 top-0 z-40 h-full w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
        }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold">Gio hang</h2>
        <button
          onClick={() => toggleSidebar(false)}
          className="rounded-full p-2 text-sm text-slate-500 hover:bg-slate-100"
          aria-label="Dong gio hang"
        >
          X
        </button>
      </div>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {hasItems ? (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex items-start justify-between rounded-md border border-slate-200 p-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.product.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.product.price.toLocaleString("vi-VN")} d
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="h-8 w-8 rounded border border-slate-300"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Giam so luong"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={item.product.stockQty}
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(item.product.id, Number(event.target.value))
                        }
                        className="h-8 w-16 rounded border border-slate-300 px-2 text-center text-sm"
                      />
                      <button
                        className="h-8 w-8 rounded border border-slate-300"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Tang so luong"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="text-xs text-rose-500 hover:underline"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    Xoa
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Chua co san pham nao trong gio hang.</p>
          )}
        </div>
        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Tong</span>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">
                {total.toLocaleString("vi-VN")} d
              </p>
              {hasItems && (
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} san pham
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!hasItems}
            className={`mt-4 w-full rounded-md py-2 text-center text-sm font-semibold transition ${hasItems
              ? "bg-primary text-white hover:bg-primary-dark"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
          >
            Thanh toan
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CartSidebar;


