
import {
  ChangeEvent,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import toast from "react-hot-toast";
import orderApi from "../api/orderApi";
import statsApi from "../api/statsApi";
import { OrderResponse, OrderSummary, PaginatedResponse, RevenueStat } from "../types";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";

type OrdersFilters = {
  code: string;
  from: string;
  to: string;
  size: number;
};

type RevenueFilters = {
  from: string;
  to: string;
};

interface BucketRange {
  start: Date;
  end: Date;
  apiFrom: string;
  apiTo: string;
  label: string;
  displayRange: string;
}

type ChartDatum = RevenueStat & {
  bucketLabel: string;
  displayRange: string;
  range?: BucketRange;
};

const STATUS_LABELS: Record<OrderSummary["status"], string> = {
  CREATED: "Cho thanh toan",
  PAID: "Da thanh toan",
  CANCELED: "Da huy"
};

const STATUS_CLASSES: Record<OrderSummary["status"], string> = {
  CREATED: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-rose-100 text-rose-700"
};

const pad = (value: number) => value.toString().padStart(2, "0");

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} d`;

// Format date to ISO string that the backend can parse correctly (YYYY-MM-DDThh:mm:ss)
const formatLocalDateTime = (date: Date) => {
  // Ensure consistent formatting that backend Java's LocalDateTime.parse() can handle
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // Format matches what the OrderController.parseDateTime method expects
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const parseBucketDate = (bucket: string) => {
  // Parse date without timezone manipulation
  // Format can be YYYY-MM-DD or other date format
  if (bucket.includes('-')) {
    // Handle ISO format YYYY-MM-DD
    const parts = bucket.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }

  // Handle other formats by replacing space with T for datetime strings
  const dateStr = bucket.replace(" ", "T");
  // Create date in local timezone without UTC conversion
  return new Date(dateStr);
};

const addInterval = (date: Date) => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + 1);
  return result;
};

const formatBucketLabel = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);

const formatBucketDisplay = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);

const buildBucketRange = (bucket: string): BucketRange | undefined => {
  const start = parseBucketDate(bucket);
  if (Number.isNaN(start.getTime())) {
    return undefined;
  }

  // Create start date at beginning of day (00:00:00)
  const startOfDay = new Date(start);
  startOfDay.setHours(0, 0, 0, 0);

  // Create end date at end of day (23:59:59)
  const endOfDay = new Date(start);
  endOfDay.setHours(23, 59, 59, 999);

  // Log for debugging
  console.log(`Building bucket range for ${bucket}:`);
  console.log(`- Start: ${startOfDay.toISOString()}`);
  console.log(`- End: ${endOfDay.toISOString()}`);
  console.log(`- API From: ${formatLocalDateTime(startOfDay)}`);
  console.log(`- API To: ${formatLocalDateTime(endOfDay)}`);

  return {
    start: startOfDay,
    end: endOfDay,
    apiFrom: formatLocalDateTime(startOfDay),
    apiTo: formatLocalDateTime(endOfDay),
    label: formatBucketLabel(start),
    displayRange: formatBucketDisplay(start)
  };
};
const createDefaultOrderFilters = (): OrdersFilters => {
  const today = new Date();
  const weekAgo = new Date(today.getTime());
  weekAgo.setDate(today.getDate() - 7);
  return {
    code: "",
    from: toDateInputValue(weekAgo),
    to: toDateInputValue(today),
    size: 10
  };
};

const createDefaultRevenueFilters = (): RevenueFilters => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: toDateInputValue(startOfMonth),
    to: toDateInputValue(today)
  };
};

const ensureOrderFilterRange = (filters: OrdersFilters): OrdersFilters => {
  if (filters.from && filters.to && filters.from > filters.to) {
    return {
      ...filters,
      from: filters.to,
      to: filters.from
    };
  }
  return filters;
};

const ensureRevenueFilterRange = (filters: RevenueFilters): RevenueFilters => {
  if (filters.from && filters.to && filters.from > filters.to) {
    return {
      ...filters,
      from: filters.to,
      to: filters.from
    };
  }
  return filters;
};

const formatOrderDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

const formatYAxisTick = (value: number) => {
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}tr`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(value);
};
const StatsPage = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "revenue">("revenue");
  const [ordersData, setOrdersData] = useState<PaginatedResponse<OrderSummary> | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueStat[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [bucketPreview, setBucketPreview] = useState<{
    title: string;
    rangeText: string;
    orders: OrderSummary[];
    loading: boolean;
  } | null>(null);
  const [orderPreview, setOrderPreview] = useState<{
    loading: boolean;
    order?: OrderResponse;
  } | null>(null);

  const [orderFiltersState, setOrderFiltersState] = useState<OrdersFilters>(() =>
    createDefaultOrderFilters()
  );
  const [appliedOrderFiltersState, setAppliedOrderFiltersState] = useState<OrdersFilters>(() =>
    createDefaultOrderFilters()
  );
  const orderFiltersRef = useRef(orderFiltersState);
  const appliedOrderFiltersRef = useRef(appliedOrderFiltersState);

  const updateOrderFilters = (updater: SetStateAction<OrdersFilters>) => {
    setOrderFiltersState((previous) => {
      const next =
        typeof updater === "function"
          ? (updater as (value: OrdersFilters) => OrdersFilters)(previous)
          : updater;
      orderFiltersRef.current = next;
      return next;
    });
  };

  const updateAppliedOrderFilters = (filters: OrdersFilters) => {
    appliedOrderFiltersRef.current = filters;
    setAppliedOrderFiltersState(filters);
  };

  const [revenueFiltersState, setRevenueFiltersState] = useState<RevenueFilters>(() =>
    createDefaultRevenueFilters()
  );
  const [appliedRevenueFiltersState, setAppliedRevenueFiltersState] = useState<RevenueFilters>(() =>
    createDefaultRevenueFilters()
  );
  const revenueFiltersRef = useRef(revenueFiltersState);
  const appliedRevenueFiltersRef = useRef(appliedRevenueFiltersState);

  const updateRevenueFilters = (updater: SetStateAction<RevenueFilters>) => {
    setRevenueFiltersState((previous) => {
      const next =
        typeof updater === "function"
          ? (updater as (value: RevenueFilters) => RevenueFilters)(previous)
          : updater;
      revenueFiltersRef.current = next;
      return next;
    });
  };

  const updateAppliedRevenueFilters = (filters: RevenueFilters) => {
    appliedRevenueFiltersRef.current = filters;
    setAppliedRevenueFiltersState(filters);
  };
  const fetchOrders = useCallback(
    async (page: number, filters: OrdersFilters) => {
      setOrdersLoading(true);
      try {
        const sanitizedPage = Math.max(page, 0);
        const size = Math.max(1, filters.size);
        const params = {
          page: sanitizedPage,
          size,
          code: filters.code.trim() || undefined,
          from: filters.from ? `${filters.from}T00:00:00` : undefined,
          to: filters.to ? `${filters.to}T23:59:59` : undefined
        };
        const data = await orderApi.searchOrders(params);
        setOrdersData(data);
      } catch (error) {
        toast.error("Khong the tai danh sach don hang");
      } finally {
        setOrdersLoading(false);
      }
    },
    []
  );

  const fetchRevenue = useCallback(
    async (filters: RevenueFilters) => {
      setRevenueLoading(true);
      try {
        console.log('Fetching revenue with filters:', filters);

        // Ensure dates are in the correct format for backend
        // The StatisticsController expects ISO.DATE format (YYYY-MM-DD)
        const params = {
          from: filters.from || undefined,
          to: filters.to || undefined
        };

        console.log('Sending API params:', params);
        const data = await statsApi.getRevenue(params);
        console.log('Revenue data received:', data);

        if (data.length > 0) {
          console.log('Sample bucket data:', data[0]);
        }

        setRevenueData(data);
      } catch (error) {
        console.error('Error fetching revenue stats:', error);
        toast.error("Khong the tai thong ke doanh thu");
        setRevenueData([]);
      } finally {
        setRevenueLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders(0, appliedOrderFiltersRef.current);
  }, [fetchOrders]);

  useEffect(() => {
    fetchRevenue(appliedRevenueFiltersRef.current);
  }, [fetchRevenue]);

  const orderFilters = orderFiltersState;
  const appliedOrderFilters = appliedOrderFiltersState;
  const revenueFilters = revenueFiltersState;
  const appliedRevenueFilters = appliedRevenueFiltersState;
  const handleOrderFilterChange =
    (field: keyof OrdersFilters) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateOrderFilters((previous) => ({
        ...previous,
        [field]: value
      }));
    };

  const handleOrderSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters = ensureOrderFilterRange(orderFiltersRef.current);
    updateOrderFilters(nextFilters);
    updateAppliedOrderFilters(nextFilters);
    fetchOrders(0, nextFilters);
  };

  const handleOrderReset = () => {
    const defaults = createDefaultOrderFilters();
    updateOrderFilters(defaults);
    updateAppliedOrderFilters(defaults);
    fetchOrders(0, defaults);
  };

  const handleOrderPageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const size = Number(event.target.value);
    if (Number.isNaN(size)) {
      return;
    }
    const next = ensureOrderFilterRange({ ...orderFiltersRef.current, size });
    updateOrderFilters(next);
    updateAppliedOrderFilters(next);
    fetchOrders(0, next);
  };

  const handleOrderPageChange = (direction: "prev" | "next") => {
    if (!ordersData) {
      return;
    }
    const nextPage = direction === "prev" ? ordersData.page - 1 : ordersData.page + 1;
    if (nextPage < 0 || nextPage >= ordersData.totalPages) {
      return;
    }
    fetchOrders(nextPage, appliedOrderFiltersRef.current);
  };

  const handleRevenueFilterChange =
    (field: keyof RevenueFilters) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        updateRevenueFilters((previous) => ({
          ...previous,
          [field]: value
        }));
      };
  const handleRevenueSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = ensureRevenueFilterRange(revenueFiltersRef.current);
    updateRevenueFilters(next);
    updateAppliedRevenueFilters(next);
    fetchRevenue(next);
  };

  const handleRevenueReset = () => {
    const defaults = createDefaultRevenueFilters();
    updateRevenueFilters(defaults);
    updateAppliedRevenueFilters(defaults);
    fetchRevenue(defaults);
  };


  const chartData = useMemo(() => {
    const fromInput = appliedRevenueFilters.from;
    const toInput = appliedRevenueFilters.to;
    if (!fromInput || !toInput) {
      return revenueData.map((stat) => {
        const range = buildBucketRange(stat.bucket);
        return {
          ...stat,
          bucketLabel: range?.label ?? stat.bucket,
          displayRange: range?.displayRange ?? stat.bucket,
          range
        };
      });
    }

    const startDate = parseBucketDate(fromInput);
    const endDate = parseBucketDate(toInput);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return [];
    }

    const dataByBucket = new Map(revenueData.map((stat) => [stat.bucket.slice(0, 10), stat]));
    const rows: ChartDatum[] = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const boundary = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= boundary) {
      const key = toDateInputValue(cursor);
      const stat = dataByBucket.get(key);
      const range = buildBucketRange(key);
      rows.push({
        bucket: key,
        revenue: stat?.revenue ?? 0,
        orderCount: stat?.orderCount ?? 0,
        bucketLabel: range?.label ?? key,
        displayRange: range?.displayRange ?? key,
        range
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return rows;
  }, [appliedRevenueFilters.from, appliedRevenueFilters.to, revenueData]);

  const totalRevenue = useMemo(
    () => revenueData.reduce((sum, stat) => sum + stat.revenue, 0),
    [revenueData]
  );

  const totalOrdersInRevenue = useMemo(
    () => revenueData.reduce((sum, stat) => sum + stat.orderCount, 0),
    [revenueData]
  );

  const orders = ordersData?.content ?? [];
  const currentPage = ordersData?.page ?? 0;
  const totalPages = ordersData?.totalPages ?? 0;

  const renderRevenueTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const datum = payload[0].payload as ChartDatum;
    return (
      <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow">
        <p className="font-semibold text-slate-900">{datum.displayRange}</p>
        <p>Doanh thu: {formatCurrency(datum.revenue)}</p>
        <p>So don: {datum.orderCount}</p>
      </div>
    );
  };

  const handleShowOrderDetail = async (orderId: number) => {
    setOrderPreview({ loading: true });
    try {
      const detail = await orderApi.getOrder(orderId);
      console.log(detail);
      setOrderPreview({ loading: false, order: detail });
    } catch (error) {
      setOrderPreview(null);
      toast.error("Khong the tai chi tiet don hang");
    }
  };

  const handleOpenBucket = async (datum: ChartDatum) => {
    if (!datum.range || datum.orderCount === 0) {
      toast("Khong co don hang trong khoang thoi gian nay");
      return;
    }

    console.log("Opening bucket for date:", datum.bucket);
    console.log("Range data:", {
      displayRange: datum.range.displayRange,
      apiFrom: datum.range.apiFrom,
      apiTo: datum.range.apiTo,
      start: datum.range.start,
      end: datum.range.end
    });

    setBucketPreview({
      title: datum.range.label,
      rangeText: datum.range.displayRange,
      orders: [],
      loading: true
    });

    try {
      const size = Math.min(Math.max(20, datum.orderCount), 100);

      // Use the exact date string from the bucket to avoid timezone issues
      const bucketDate = datum.bucket.substring(0, 10); // Extract YYYY-MM-DD part
      console.log("Using bucket date string directly:", bucketDate);

      // Format YYYY-MM-DDT00:00:00 for start of day
      const fromDate = `${bucketDate}T00:00:00`;
      // Format YYYY-MM-DDT23:59:59 for end of day
      const toDate = `${bucketDate}T23:59:59`;

      console.log("Created date strings:", { fromDate, toDate });

      // Ensure the API parameters have the correct format for the backend
      const apiParams = {
        page: 0,
        size,
        from: fromDate,
        to: toDate
      };

      console.log("Sending API request with params:", apiParams);

      const response = await orderApi.searchOrders(apiParams);

      console.log("API response received:", {
        totalElements: response.totalElements,
        content: response.content
      });

      setBucketPreview((previous) =>
        previous
          ? {
            ...previous,
            loading: false,
            orders: response.content
          }
          : previous
      );

      if (response.content.length === 0) {
        console.warn("No orders found despite orderCount > 0");
        toast("Không tìm thấy đơn hàng nào trong khoảng thời gian này.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setBucketPreview(null);
      toast.error("Khong the tai don hang cho khoang thoi gian da chon");
    }
  };

  const closeBucketPreview = () => setBucketPreview(null);
  const closeOrderPreview = () => setOrderPreview(null);
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Bang thong ke</h1>
        <p className="text-sm text-slate-500">
          Quan ly don hang gan day va theo doi doanh thu theo khung thoi gian.
        </p>
      </header>

      <div className="flex gap-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${activeTab === "orders"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary"
            }`}
        >
          Don hang
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("revenue")}
          className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${activeTab === "revenue"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary"
            }`}
        >
          Doanh thu
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className="space-y-6">
          <form
            onSubmit={handleOrderSearch}
            className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
          >
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ma don hang
              <input
                type="text"
                placeholder="VD: ORD123"
                value={orderFilters.code}
                onChange={handleOrderFilterChange("code")}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tu ngay
              <input
                type="date"
                value={orderFilters.from}
                onChange={handleOrderFilterChange("from")}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Den ngay
              <input
                type="date"
                value={orderFilters.to}
                onChange={handleOrderFilterChange("to")}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end justify-end gap-3">
              <button
                type="button"
                onClick={handleOrderReset}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Dat lai
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Tim kiem
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>So luong moi trang</span>
              <select
                value={orderFilters.size}
                onChange={handleOrderPageSizeChange}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              >
                {[5, 10, 20, 30, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>
                Trang {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOrderPageChange("prev")}
                  disabled={!ordersData || currentPage === 0}
                  className="rounded border border-slate-300 px-3 py-1 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trang truoc
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderPageChange("next")}
                  disabled={!ordersData || currentPage >= totalPages - 1}
                  className="rounded border border-slate-300 px-3 py-1 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Khoang thoi gian ap dung: {appliedOrderFilters.from || "-"} {"->"} {appliedOrderFilters.to || "-"}
            {appliedOrderFilters.code && (
              <span className="ml-2">| Ma don: {appliedOrderFilters.code}</span>
            )}
          </p>
          {ordersLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Ma don</th>
                    <th className="px-4 py-3 text-left">Khach hang</th>
                    <th className="px-4 py-3 text-left">Ngay tao</th>
                    <th className="px-4 py-3 text-right">Tong tien</th>
                    <th className="px-4 py-3 text-center">San pham</th>
                    <th className="px-4 py-3 text-center">Trang thai</th>
                    <th className="px-4 py-3 text-center">Hanh dong</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{order.code}</td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3">{formatOrderDate(order.orderDate)}</td>
                      <td className="px-4 py-3 text-right font-medium text-primary">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">{order.itemCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[order.status]}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleShowOrderDetail(order.id)}
                          className="rounded-md border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                        >
                          Xem chi tiet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">
              Chua co don hang phu hop. Hay dieu chinh bo loc va thu lai.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={handleRevenueSubmit}
            className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3"
          >

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tu ngay
              <input
                type="date"
                value={revenueFilters.from}
                onChange={handleRevenueFilterChange("from")}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Den ngay
              <input
                type="date"
                value={revenueFilters.to}
                onChange={handleRevenueFilterChange("to")}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end justify-end gap-3">
              <button
                type="button"
                onClick={handleRevenueReset}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Dat lai
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Lay du lieu
              </button>
            </div>
          </form>

          <p className="text-xs text-slate-500">
            Khoang doanh thu ap dung: {appliedRevenueFilters.from || "-"} {"->"} {appliedRevenueFilters.to || "-"}
          </p>

          {revenueLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : revenueData.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tong doanh thu</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tong so don</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{totalOrdersInRevenue}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Doanh thu theo ngay
                </h2>
                <div className="mt-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="bucketLabel" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="revenue" tickFormatter={formatYAxisTick} />
                      <YAxis yAxisId="orders" orientation="right" tickFormatter={(value) => value.toString()} />
                      <Tooltip content={renderRevenueTooltip} />
                      <Line
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot
                      />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="orderCount"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Thoi gian</th>
                        <th className="px-4 py-3 text-right">Doanh thu</th>
                        <th className="px-4 py-3 text-center">So don</th>
                        <th className="px-4 py-3 text-center">Hanh dong</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {chartData.map((datum) => (
                        <tr key={datum.bucket} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{datum.displayRange}</td>
                          <td className="px-4 py-3 text-right font-medium text-primary">
                            {formatCurrency(datum.revenue)}
                          </td>
                          <td className="px-4 py-3 text-center">{datum.orderCount}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenBucket(datum)}
                              disabled={datum.orderCount === 0}
                              className="rounded-md border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                            >
                              Xem don
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-slate-500">
              Chua co du lieu doanh thu trong khoang da chon. Hay dieu chinh bo loc de thu lai.
            </p>
          )}
        </div>
      )}
      {bucketPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeBucketPreview}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{bucketPreview.title}</h3>
                <p className="text-sm text-slate-500">{bucketPreview.rangeText}</p>
              </div>
              <button
                type="button"
                onClick={closeBucketPreview}
                className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Dong
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {bucketPreview.loading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : bucketPreview.orders.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Ma don</th>
                      <th className="px-4 py-3 text-left">Khach hang</th>
                      <th className="px-4 py-3 text-left">Ngay tao</th>
                      <th className="px-4 py-3 text-right">Tong tien</th>
                      <th className="px-4 py-3 text-center">Trang thai</th>
                      <th className="px-4 py-3 text-center">Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bucketPreview.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{order.code}</td>
                        <td className="px-4 py-3">{order.customerName}</td>
                        <td className="px-4 py-3">{formatOrderDate(order.orderDate)}</td>
                        <td className="px-4 py-3 text-right text-primary">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[order.status]}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              closeBucketPreview();
                              handleShowOrderDetail(order.id);
                            }}
                            className="rounded-md border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                          >
                            Chi tiet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-sm text-slate-500">
                  Khong co don hang trong khoang thoi gian nay.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {orderPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeOrderPreview}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {orderPreview.order ? `Don hang #${orderPreview.order.code}` : "Dang tai don hang"}
                </h3>
                {orderPreview.order && (
                  <p className="text-sm text-slate-500">
                    Ngay tao:{" "}
                    {new Date(orderPreview.order.orderDate).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeOrderPreview}
                className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Dong
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              {orderPreview.loading && (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}
              {!orderPreview.loading && orderPreview.order && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Thong tin chung
                    </h4>
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-700">Trang thai:</span>{" "}
                        <span className="uppercase text-primary">{orderPreview.order.status}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Khach hang:</span>{" "}
                        {orderPreview.order.customerName}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">So dien thoai:</span>{" "}
                        {orderPreview.order.customerPhone}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Dia chi:</span>{" "}
                        {orderPreview.order.customerAddress}
                      </p>
                    </div>
                    {orderPreview.order.note && (
                      <p className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">Ghi chu:</span>{" "}
                        {orderPreview.order.note}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      San pham
                    </h4>
                    <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                      {orderPreview.order!.items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 p-4 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-xs text-slate-500">
                              Ma san pham: {item.productCode} • So luong: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right font-semibold text-primary">
                            {item.lineTotal.toLocaleString("vi-VN")} d
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                    <span>Tong thanh toan</span>
                    <span>{orderPreview.order.totalAmount.toLocaleString("vi-VN")} d</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                onClick={() => toast("Chuc nang dang duoc phat trien")}
              >
                Xuat file PDF
              </button>
              <button
                type="button"
                onClick={closeOrderPreview}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StatsPage;











