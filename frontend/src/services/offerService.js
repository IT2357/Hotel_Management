import api from './api.js';

/**
 * Offer Service
 * Handles food offer/promotion related API calls
 */
class OfferService {
  // Get all active offers (public - no auth required)
  async getActiveOffers(params = {}) {
    try {
      const response = await api.get('/food/offers/active', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching active offers:', error);
      // Return empty array if API fails
      return {
        success: true,
        data: []
      };
    }
  }

  // Get all offers (admin only)
  async getAllOffers(params = {}) {
    try {
      const response = await api.get('/food/offers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offers');
    }
  }

  // Get personalized offers for current user
  async getPersonalizedOffers() {
    try {
      const response = await api.get('/food/offers/personalized');
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized offers:', error);
      // Return mock data if API not implemented yet
      return {
        success: true,
        data: [
          {
            _id: 'offer-1',
            title: '5% Jaffna Special Discount',
            description: 'Enjoy our traditional discount on all menu items',
            type: 'percentage',
            discountValue: 5,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true
          }
        ]
      };
    }
  }

  // Apply offer to cart
  async applyOffer(offerId) {
    try {
      const response = await api.post(`/food/offers/${offerId}/apply`);
      return response.data;
    } catch (error) {
      console.error('Error applying offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to apply offer');
    }
  }

  // Remove offer from cart
  async removeOffer(offerId) {
    try {
      const response = await api.post(`/food/offers/${offerId}/remove`);
      return response.data;
    } catch (error) {
      console.error('Error removing offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove offer');
    }
  }

  // Admin: Create new offer
  async createOffer(offerData) {
    try {
      const response = await api.post('/food/offers', offerData);
      return response.data;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to create offer');
    }
  }

  // Admin: Update offer
  async updateOffer(offerId, offerData) {
    try {
      const response = await api.put(`/food/offers/${offerId}`, offerData);
      return response.data;
    } catch (error) {
      console.error('Error updating offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to update offer');
    }
  }

  // Admin: Delete offer
  async deleteOffer(offerId) {
    try {
      const response = await api.delete(`/food/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete offer');
    }
  }
}

const offerService = new OfferService();
export default offerService;

