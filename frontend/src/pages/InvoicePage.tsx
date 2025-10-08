import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import orderApi from "../api/orderApi";
import reportApi from "../api/reportApi";
import { OrderResponse } from "../types";

const InvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadOrder = async () => {
      try {
        setLoading(true);
        const response = await orderApi.getOrder(Number(id));
        setOrder(response);
      } catch (error) {
        toast.error("Khong the tai thong tin don hang");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      const blob = await reportApi.downloadInvoice(Number(id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Dang tai hoa don");
    } catch (error) {
      toast.error("Khong the tai hoa don PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-slate-500">Khong tim thay don hang.</p>;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hoa don #{order.code}</h1>
          <p className="text-sm text-slate-500">Ngay: {new Date(order.orderDate).toLocaleString("vi-VN")}</p>
        </div>
        <button
          onClick={handleDownload}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Tai PDF
        </button>
      </header>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Thong tin khach hang</h2>
        <p className="text-sm text-slate-600">{order.customerName}</p>
        <p className="text-sm text-slate-600">{order.customerPhone}</p>
        <p className="text-sm text-slate-600">{order.customerAddress}</p>
        {order.note && <p className="text-sm text-slate-500">Ghi chu: {order.note}</p>}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Chi tiet san pham</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-slate-800">{item.productName}</p>
                <p className="text-xs text-slate-500">x{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {(item.unitPrice * item.quantity).toLocaleString("vi-VN")} d
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-4 text-sm font-semibold text-slate-800">
          <span>Tong thanh toan</span>
          <span>{order.totalAmount.toLocaleString("vi-VN")} d</span>
        </div>
        <div className="text-sm text-slate-500">
          Trang thai: <span className="font-semibold text-primary">{order.status}</span>
        </div>
      </div>
    </section>
  );
};

export default InvoicePage;
