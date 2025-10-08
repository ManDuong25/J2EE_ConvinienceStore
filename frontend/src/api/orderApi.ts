import axiosClient from "./axiosClient";
import {
  CreateOrderPayload,
  OrderResponse,
  OrderSummary,
  PaginatedResponse,
  PaymentUrlResponse
} from "../types";

const orderApi = {
  async searchOrders(params: {
    page?: number;
    size?: number;
    code?: string;
    from?: string;
    to?: string;
  }) {
    const response = await axiosClient.get<PaginatedResponse<OrderSummary>>("/orders", {
      params
    });
    return response.data;
  },
  async createOrder(payload: CreateOrderPayload) {
    const response = await axiosClient.post<OrderResponse>("/orders", payload);
    return response.data;
  },
  async getOrder(id: number) {
    const response = await axiosClient.get<OrderResponse>(`/orders/${id}`);
    return response.data;
  },
  async initiateVnpayPayment(orderId: number, clientIp?: string) {
    const response = await axiosClient.post<PaymentUrlResponse>(
      `/orders/${orderId}/payments/vnpay`,
      {},
      {
        headers: clientIp ? { "X-Forwarded-For": clientIp } : undefined
      }
    );
    return response.data;
  }
};

export default orderApi;
