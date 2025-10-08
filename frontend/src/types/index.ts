export interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  price: number;
  stockQty: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface OrderItemPayload {
  productId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  items: OrderItemPayload[];
}

export interface OrderSummary {
  id: number;
  code: string;
  status: "CREATED" | "PAID" | "CANCELED";
  customerName: string;
  totalAmount: number;
  orderDate: string;
  itemCount: number;
}

export interface OrderResponse {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderDate: string;
  status: "CREATED" | "PAID" | "CANCELED";
  totalAmount: number;
  note?: string;
  items: Array<{
    id: number;
    productId: number;
    productCode: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  payments: Array<{
    id: number;
    provider: "VNPAY";
    txnRef: string;
    amount: number;
    currency: string;
    status: "PENDING" | "PAID" | "FAILED" | "CANCELED";
    bankCode?: string;
    payDate?: string;
  }>;
}

export interface PaymentUrlResponse {
  paymentUrl: string;
}

export interface RevenueStat {
  bucket: string;
  revenue: number;
  orderCount: number;
}

export interface TopProductStat {
  productId: number;
  name: string;
  soldQuantity: number;
  revenue: number;
}

export interface UserSummary {
  id: number;
  name: string;
  phone: string;
  address: string;
  point: number;
}


