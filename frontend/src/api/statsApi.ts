import axiosClient from "./axiosClient";
import { RevenueStat, TopProductStat } from "../types";

const statsApi = {
  async getRevenue(params?: { from?: string; to?: string }) {
    const response = await axiosClient.get<RevenueStat[]>("/stats/revenue", { params });
    return response.data;
  },
  async getTopProducts(params: { from: string; to: string; limit?: number }) {
    const response = await axiosClient.get<TopProductStat[]>("/stats/top-products", { params });
    return response.data;
  }
};

export default statsApi;
