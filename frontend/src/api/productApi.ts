import axiosClient from "./axiosClient";
import { PaginatedResponse, Product } from "../types";

export interface ProductQuery {
  q?: string;
  categoryId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

const productApi = {
  async getProducts(params: ProductQuery) {
    const response = await axiosClient.get<PaginatedResponse<Product>>("/products", {
      params
    });
    return response.data;
  },
  async getProduct(id: number) {
    const response = await axiosClient.get<Product>(`/products/${id}`);
    return response.data;
  }
};

export default productApi;
