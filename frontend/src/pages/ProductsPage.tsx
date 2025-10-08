import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import productApi, { ProductQuery } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import { Product } from "../types";
import toast from "react-hot-toast";

type FilterForm = {
  q: string;
  categoryId: string;
};

const defaultFormValues: FilterForm = {
  q: "",
  categoryId: ""
};

const normalizeCategoryId = (value: string | number | undefined) => {
  if (value === undefined || value === "") {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
};

type ProductQueryOverrides = Partial<ProductQuery> & {
  categoryId?: string | number;
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const { register, watch, handleSubmit, reset } = useForm<FilterForm>({
    defaultValues: defaultFormValues
  });

  const onSubmit = (data: FilterForm) => {
    setPage(0);
    fetchProducts({
      page: 0,
      q: data.q,
      categoryId: normalizeCategoryId(data.categoryId)
    });
  };

  const fetchProducts = async (overrides: ProductQueryOverrides = {}) => {
    try {
      setLoading(true);
      const params: ProductQuery = {
        q: overrides.q ?? watch("q"),
        categoryId: normalizeCategoryId(overrides.categoryId ?? watch("categoryId")),
        page: overrides.page ?? page,
        size: 12,
        sort: "createdAt,desc"
      };
      const response = await productApi.getProducts(params);
      setProducts(response.content);
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Khong the tai danh sach san pham");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const unique = new Map<number, string>();
    products.forEach((product) => {
      if (!unique.has(product.categoryId)) {
        unique.set(product.categoryId, product.categoryName);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages) return;
    fetchProducts({ page: nextPage });
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">San pham</h1>
        <button
          className="text-sm text-primary"
          onClick={() => {
            reset(defaultFormValues);
            fetchProducts({ q: "", categoryId: undefined, page: 0 });
          }}
        >
          Xoa bo loc
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tim kiem
            <input
              type="text"
              placeholder="Ten hoac ma san pham"
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              {...register("q")}
            />
          </label>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Danh muc
            <select
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              {...register("categoryId")}
            >
              <option value="">Tat ca</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-end justify-end">
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark md:w-auto"
          >
            Loc san pham
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {products.length === 0 && (
            <p className="text-center text-sm text-slate-500">Khong tim thay san pham phu hop.</p>
          )}
        </>
      )}

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 0 || loading}
        >
          Trang truoc
        </button>
        <span className="text-sm text-slate-600">
          Trang {page + 1} / {totalPages || 1}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page >= totalPages - 1 || loading}
        >
          Trang sau
        </button>
      </div>
    </section>
  );
};

export default ProductsPage;
