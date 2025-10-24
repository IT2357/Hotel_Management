import api from './api';

// Maintain active controllers so we can cancel pending requests when needed
const activeControllers = new Set();

function createAbortController(timeoutMs = 15000) {
  const controller = new AbortController();
  const timedOut = { value: false };
  const timeoutId = setTimeout(() => {
    timedOut.value = true;
    try { controller.abort(); } catch {}
  }, timeoutMs);
  activeControllers.add(controller);
  const cleanup = () => {
    clearTimeout(timeoutId);
    activeControllers.delete(controller);
  };
  return { controller, cleanup, timedOut };
}

const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || /canceled/i.test(err?.message || '');

const guestServiceApi = {
  // Get all service requests with optional status filter and extra params
  async getServiceRequests(status = 'all', options = {}) {
  const params = { ...(options.params || {}) };
  if (options.limit && !params.limit) params.limit = options.limit;
    // Only include status if it's a real filter (not 'all' or empty)
    if (status && status !== 'all') {
      params.status = status;
    }
    const { controller, cleanup, timedOut } = createAbortController(options.timeoutMs || 15000);
    try {
      const response = await api.get('/guest-services', {
        params,
        signal: controller.signal,
      });
      return response.data;
    } finally {
      cleanup();
    }
  },

  // Get request details by ID
  async getRequestDetails(id, options = {}) {
    const { controller, cleanup, timedOut } = createAbortController(options.timeoutMs || 15000);
    try {
      const response = await api.get(`/guest-services/${id}`, {
        signal: controller.signal,
      });
      return response.data;
    } finally {
      cleanup();
    }
  },

  // Update request status
  async updateRequestStatus(id, status, assignedTo = undefined, options = {}) {
    const { controller, cleanup, timedOut } = createAbortController(options.timeoutMs || 15000);
    try {
      const payload = assignedTo ? { status, assignedTo } : { status };
      const response = await api.patch(
        `/guest-services/${id}/status`,
        payload,
        {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          timeout: options.timeoutMs || 15000,
        }
      );
      return response.data;
    } catch (error) {
      if (isCanceled(error)) {
        if (timedOut.value) {
          throw new Error('Request timed out. Please try again.');
        }
        // Treat non-timeout cancellations as retryable network interruptions
        throw new Error('Network request interrupted. Please try again.');
      }
      // Axios timeout can surface as ETIMEDOUT or generic network error depending on adapter
      if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
        throw new Error('Request timed out. Please try again.');
      }
      // Bubble up server message when present
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      if (serverMsg) {
        throw new Error(serverMsg);
      }
      throw error;
    } finally {
      cleanup();
    }
  },

  // Add notes to a request
  async addRequestNotes(id, content, options = {}) {
    const { controller, cleanup, timedOut } = createAbortController(options.timeoutMs || 15000);
    try {
      const response = await api.post(
        `/guest-services/${id}/notes`,
        { content },
        { signal: controller.signal, timeout: options.timeoutMs || 15000 }
      );
      return response.data;
    } finally {
      cleanup();
    }
  },

  // Cancel all pending requests
  cancelPendingRequests() {
    for (const c of Array.from(activeControllers)) {
      try { c.abort(); } catch {}
      activeControllers.delete(c);
    }
  }
};

export default guestServiceApi;
