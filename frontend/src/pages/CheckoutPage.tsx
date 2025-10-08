import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import orderApi from "../api/orderApi";
import userApi from "../api/userApi";
import useCartStore from "../store/cartStore";
import { CreateOrderPayload, UserSummary } from "../types";

const schema = yup.object({
  customerName: yup.string().max(150).optional(),
  customerPhone: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .matches(/^[0-9]{9,11}$/g, { message: "So dien thoai khong hop le", excludeEmptyString: true })
    .optional(),
  customerAddress: yup.string().max(255).optional(),
  note: yup.string().optional().default("")
});

type FormValues = yup.InferType<typeof schema>;

type PaymentMethod = "VNPAY" | "CASH";

type ModalMode = "existing" | "new";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, clearCart, setLastOrderId } = useCartStore();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [loadedUser, setLoadedUser] = useState<UserSummary | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean; mode: ModalMode }>({
    open: false,
    mode: "new"
  });
  const [requestedMethod, setRequestedMethod] = useState<PaymentMethod | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setFocus,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      note: ""
    }
  });

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate("/products", { replace: true });
    }
  }, [items.length, orderPlaced, navigate]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const phoneValue = watch("customerPhone");
  const formValues = watch();

  const closeModal = () => {
    setModalState({ open: false, mode: "new" });
    setRequestedMethod(null);
  };

  const openModal = (mode: ModalMode, method: PaymentMethod | null) => {
    setModalState({ open: true, mode });
    setRequestedMethod(method);
    if (mode === "new") {
      setTimeout(() => setFocus("customerName"), 0);
    }
  };

  const prepareUserContext = async (): Promise<ModalMode | null> => {
    const phone = (phoneValue || "").trim();
    if (!phone) {
      setLoadedUser(null);
      setValue("customerName", formValues.customerName ?? "");
      setValue("customerAddress", formValues.customerAddress ?? "");
      return "new";
    }
    setLookupLoading(true);
    try {
      const user = await userApi.findByPhone(phone);
      setLoadedUser(user);
      setValue("customerName", user.name ?? "");
      setValue("customerAddress", user.address ?? "");
      return "existing";
    } catch (error) {
      setLoadedUser(null);
      setValue("customerName", "");
      setValue("customerAddress", "");
      const shouldCreate = window.confirm(
        "Khong tim thay khach hang voi so dien thoai nay. Ban co muon tao moi?"
      );
      if (!shouldCreate) {
        return null;
      }
      return "new";
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCheckCustomer = async () => {
    const mode = await prepareUserContext();
    if (!mode) {
      return;
    }
    openModal(mode, null);
  };

  const handleInitiatePayment = async (method: PaymentMethod) => {
    const mode = await prepareUserContext();
    if (!mode) {
      return;
    }
    openModal(mode, method);
  };

  const processOrder = async (data: FormValues, method: PaymentMethod) => {
    if (items.length === 0) {
      toast.error("Gio hang dang trong");
      return;
    }
    setPaymentProcessing(true);
    try {
      const sanitizedPhone = data.customerPhone?.trim();
      const payload: CreateOrderPayload = {
        customerName: (data.customerName ?? "").trim(),
        customerAddress: (data.customerAddress ?? "").trim(),
        note: data.note,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };
      if (sanitizedPhone && sanitizedPhone.length > 0) {
        payload.customerPhone = sanitizedPhone;
      }
      const order = await orderApi.createOrder(payload);

      setLastOrderId(order.id);
      setOrderPlaced(true);
      clearCart();
      setLoadedUser(null);
      setRequestedMethod(null);
      closeModal();

      if (method === "VNPAY") {
        toast.success("Dang chuyen den cong thanh toan VNPAY");
        const { paymentUrl } = await orderApi.initiateVnpayPayment(order.id);
        window.location.href = paymentUrl;
        return;
      }

      toast.success("Thanh toan thanh cong!");
      navigate(`/invoice/${order.id}`);
    } catch (error) {
      toast.error("Khong the tao don hang hoac thanh toan");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSelectPayment = async (method: PaymentMethod) => {
    setRequestedMethod(method);
    const sanitizedPhone = formValues.customerPhone?.trim();
    if (modalState.mode === "new" && sanitizedPhone && sanitizedPhone.length > 0) {
      if (!formValues.customerName?.trim() || !formValues.customerAddress?.trim()) {
        toast.error("Vui long nhap ten va dia chi khach hang");
        return;
      }
    }
    const isValid = await trigger();
    if (!isValid) {
      return;
    }
    handleSubmit((formData) => processOrder(formData, method))();
  };

  const isReadOnly = modalState.mode === "existing";

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Thong tin thanh toan</h1>
        <p className="text-sm text-slate-500">
          Nhap so dien thoai de kiem tra thong tin khach hang va chon phuong thuc thanh toan.
        </p>
      </header>

      <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          So dien thoai
          <input
            type="tel"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            {...register("customerPhone")}
          />
          {errors.customerPhone && (
            <p className="mt-1 text-xs text-rose-500">{errors.customerPhone.message}</p>
          )}
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCheckCustomer}
            disabled={lookupLoading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {lookupLoading ? "Dang kiem tra..." : "Kiem tra khach hang"}
          </button>
          <button
            type="button"
            onClick={() => handleInitiatePayment("VNPAY")}
            disabled={lookupLoading || paymentProcessing}
            className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thanh toan VNPay
          </button>
          <button
            type="button"
            onClick={() => handleInitiatePayment("CASH")}
            disabled={lookupLoading || paymentProcessing}
            className="rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thanh toan tien mat
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Tong tien hien tai</p>
          <p className="text-2xl font-semibold text-primary">
            {totalAmount.toLocaleString("vi-VN")} d
          </p>
        </div>
      </div>

      {modalState.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modalState.mode === "existing"
                    ? "Khach hang hien co"
                    : "Tao moi khach hang"}
                </h2>
                <p className="text-xs text-slate-500">
                  So dien thoai: <span className="font-semibold">{phoneValue}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Dong
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
              {modalState.mode === "existing" && loadedUser && (
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Diem tich luy:</span>{" "}
                    {loadedUser.point ?? 0}
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Ho ten
                  <input
                    type="text"
                    className={`mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm ${
                      isReadOnly ? "bg-slate-100 text-slate-600" : ""
                    }`}
                    {...register("customerName")}
                    readOnly={isReadOnly}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-rose-500">{errors.customerName.message}</p>
                  )}
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Dia chi giao hang
                  <input
                    type="text"
                    className={`mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm ${
                      isReadOnly ? "bg-slate-100 text-slate-600" : ""
                    }`}
                    {...register("customerAddress")}
                    readOnly={isReadOnly}
                  />
                  {errors.customerAddress && (
                    <p className="mt-1 text-xs text-rose-500">{errors.customerAddress.message}</p>
                  )}
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Ghi chu (tuy chon)
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  {...register("note")}
                />
              </label>
              <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Tong thanh toan</p>
                <p className="text-lg font-bold text-primary">
                  {totalAmount.toLocaleString("vi-VN")} d
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <span className="text-sm text-slate-600">
                Chon phuong thuc thanh toan sau khi xac nhan thong tin khach hang
              </span>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPayment("VNPAY")}
                  disabled={paymentProcessing}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    requestedMethod === "VNPAY"
                      ? "border-primary bg-primary text-white"
                      : "border-primary text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  Thanh toan VNPay
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPayment("CASH")}
                  disabled={paymentProcessing}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    requestedMethod === "CASH"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                  }`}
                >
                  Thanh toan tien mat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CheckoutPage;


