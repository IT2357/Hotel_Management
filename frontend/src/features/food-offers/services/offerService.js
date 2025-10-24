import api from '../../../services/api';

class OfferService {
  // Admin endpoints
  async createOffer(offerData) {
    const response = await api.post('/offers', offerData);
    return response.data;
  }

  async getAllOffers(params = {}) {
    const response = await api.get('/offers', { params });
    return response.data;
  }

  async getOfferById(id) {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  }

  async updateOffer(id, offerData) {
    const response = await api.put(`/offers/${id}`, offerData);
    return response.data;
  }

  async deleteOffer(id) {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  }

  // User endpoints
  async getPersonalizedOffers() {
    const response = await api.get('/offers/personalized');
    return response.data;
  }

  async applyOffer(offerData) {
    const response = await api.post('/offers/apply', offerData);
    return response.data;
  }
}

export default new OfferService();