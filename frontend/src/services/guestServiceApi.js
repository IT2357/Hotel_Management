import api from './api';
import { CancelToken } from 'axios';

// Create a new cancel token source
const createCancelTokenSource = () => ({
  token: CancelToken.source().token,
  cancel: CancelToken.source().cancel,
  source: CancelToken.source()
});

const guestServiceApi = {
  // Initialize with a cancel token source
  source: createCancelTokenSource(),

  // Get all service requests with optional status filter
  getServiceRequests: async (status = '') => {
    const url = status ? `/guest-services?status=${status}` : '/guest-services';
    const response = await api.get(url, {
      cancelToken: guestServiceApi.source.token
    });
    return response.data;
  },

  // Get request details by ID
  getRequestDetails: async (id) => {
    const response = await api.get(`/guest-services/${id}`, {
      cancelToken: guestServiceApi.source.token
    });
    return response.data;
  },

  // Update request status
  updateRequestStatus: async (id, status, assignedTo = null) => {
    try {
      const response = await api.patch(
        `/guest-services/${id}/status`,
        { status, assignedTo },
        { 
          cancelToken: guestServiceApi.source.token,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  // Add notes to a request
  addRequestNotes: async (id, content) => {
    const response = await api.post(
      `/guest-services/${id}/notes`,
      { content },
      { cancelToken: guestServiceApi.source.token }
    );
    return response.data;
  },

  // Cancel all pending requests
  cancelPendingRequests: () => {
    guestServiceApi.source.cancel('Operation canceled by the user.');
    // Create new token for future requests
    guestServiceApi.source = createCancelTokenSource();
  }
};

export default guestServiceApi;
