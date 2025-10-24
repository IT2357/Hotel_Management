import api from "./api";

const BASE_PATH = "/reports";

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

export const reportsAPI = {
  // Dashboard overview
  async getDashboardOverview(params = {}) {
    const response = await api.get(`${BASE_PATH}/dashboard-overview`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Manager overview
  async getManagerOverview(params = {}) {
    const response = await api.get(`${BASE_PATH}/manager/overview`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Booking reports
  async getBookingReports(params = {}) {
    const response = await api.get(`${BASE_PATH}/bookings`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Financial reports
  async getFinancialReports(params = {}) {
    const response = await api.get(`${BASE_PATH}/finance`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // KPI dashboard
  async getKPIDashboard(params = {}) {
    const response = await api.get(`${BASE_PATH}/kpis`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Forecasting
  async getForecast(params = {}) {
    const response = await api.get(`${BASE_PATH}/forecast`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Task reports
  async getTaskReports(params = {}) {
    const response = await api.get(`${BASE_PATH}/tasks`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Workload reports
  async getWorkloadReport(params = {}) {
    const response = await api.get(`${BASE_PATH}/workload`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Delayed tasks reports
  async getDelayedTasksReport(params = {}) {
    const response = await api.get(`${BASE_PATH}/delayed-tasks`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Export report
  async exportReport(data = {}) {
    const response = await api.get(`${BASE_PATH}/export`, {
      params: {
        type: data.reportType,
        format: data.format || 'json',
        startDate: data.startDate,
        endDate: data.endDate,
        includeCharts: data.includeCharts,
      },
    });
    return response.data;
  },

  // Get report configurations
  async getReportConfigs(params = {}) {
    const response = await api.get(`${BASE_PATH}/configs`, {
      params: sanitizeParams(params),
    });
    return response.data;
  },

  // Save report configuration
  async saveReportConfig(data = {}) {
    const response = await api.post(`${BASE_PATH}/configs`, data);
    return response.data;
  },

  // Schedule report
  async scheduleReport(configId, data = {}) {
    const response = await api.post(`${BASE_PATH}/configs/${configId}/schedule`, data);
    return response.data;
  },

  // Update KPIs
  async updateKPIs(params = {}) {
    const response = await api.post(`${BASE_PATH}/kpis/update`, {}, {
      params: sanitizeParams(params),
    });
    return response.data;
  }
};

export default reportsAPI;