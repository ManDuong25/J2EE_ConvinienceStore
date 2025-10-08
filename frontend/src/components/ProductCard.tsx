import useCartStore from "../store/cartStore";
import { Product } from "../types";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const addToCart = useCartStore((state) => state.addToCart);

  const disabled = product.status !== "ACTIVE" || product.stockQty === 0;

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow">
      <div className="h-40 w-full bg-gradient-to-br from-slate-100 to-slate-200" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {product.categoryName}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-primary">
              {product.price.toLocaleString("vi-VN")}
              <span className="ml-1 text-sm">d</span>
            </p>
            <p className="text-xs text-slate-500">Ton kho: {product.stockQty}</p>
          </div>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={disabled}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {disabled ? "Het hang" : "Them vao gio"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
