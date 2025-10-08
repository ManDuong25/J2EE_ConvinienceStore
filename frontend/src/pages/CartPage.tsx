import { Link } from "react-router-dom";
import useCartStore from "../store/cartStore";

const CartPage = () => {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Gio hang</h1>
        <Link
          to="/products"
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          Tiep tuc mua sam
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Gio hang trong. Hay them san pham de tiep tuc.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.product.name}</h3>
                  <p className="text-sm text-slate-500">
                    {item.product.price.toLocaleString("vi-VN")} d ? Con {item.product.stockQty} san pham
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="h-8 w-8 rounded border border-slate-300"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={item.product.stockQty}
                      onChange={(event) =>
                        updateQuantity(item.product.id, Number(event.target.value))
                      }
                      className="h-8 w-16 rounded border border-slate-300 text-center text-sm"
                    />
                    <button
                      className="h-8 w-8 rounded border border-slate-300"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-sm text-rose-500"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    Xoa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Thong tin don hang</h2>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Tong san pham</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-800">
              <span>Tong tien</span>
              <span>{total.toLocaleString("vi-VN")} d</span>
            </div>
            <Link
              to="/checkout"
              className="mt-4 block rounded-md bg-primary py-2 text-center text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Dat hang & Thanh toan
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CartPage;
