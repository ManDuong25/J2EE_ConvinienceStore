import axiosClient from "./axiosClient";

const reportApi = {
  async downloadInvoice(orderId: number) {
    const response = await axiosClient.get(`/reports/invoices/${orderId}.pdf`, {
      responseType: "blob"
    });
    return response.data;
  }
};

export default reportApi;
