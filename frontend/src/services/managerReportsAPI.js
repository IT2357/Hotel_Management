import api from "./api";

const BASE_PATH = "/reports/manager";

const sanitizeParams = (params = {}) => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === "string" && value.trim() === "") {
      return acc;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return acc;
      }
      acc[key] = value.join(",");
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

export const managerReportsAPI = {
  async getOverview(params = {}) {
    const token = localStorage.getItem("token"); // ✅ GET TOKEN
    const response = await api.get(`${BASE_PATH}/overview`, {
      params: sanitizeParams(params),
      headers: {
        Authorization: `Bearer ${token}`, // ✅ ATTACH TOKEN
      },
    });
    return response.data;
  },

  async getStaffPerformance(params = {}) {
    const token = localStorage.getItem("token");
    const response = await api.get(`${BASE_PATH}/overview`, {
      params: sanitizeParams(params),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default managerReportsAPI;
