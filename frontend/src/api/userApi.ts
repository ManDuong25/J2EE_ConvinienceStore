import axiosClient from "./axiosClient";
import { UserSummary } from "../types";

const userApi = {
  async findByPhone(phone: string) {
    const response = await axiosClient.get<UserSummary>("/users/search", {
      params: { phone }
    });
    return response.data;
  }
};

export default userApi;
