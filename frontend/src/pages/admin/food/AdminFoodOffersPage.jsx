import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  RefreshCw,
  ChefHat,
  Gift,
  TrendingUp
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import FoodBadge from '../../../components/food/FoodBadge';
import OfferCard from '../../../components/admin/OfferCard';
import OfferForm from '../../../components/admin/OfferForm';
import OfferAnalytics from '../../../components/admin/OfferAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/food/FoodDialog';
import offerService from '../../../services/offerService';

const AdminFoodOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [stats, setStats] = useState({
    totalOffers: 0,
    activeOffers: 0,
    totalRedemptions: 0,
    monthlyRedemptions: 0,
    revenueImpact: 0
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, statusFilter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await offerService.getAllOffers();
      
      const offersData = response.data || [];
      setOffers(offersData);
      
      // Calculate stats
      const activeCount = offersData.filter(o => o.isActive).length;
      const totalRedemptions = offersData.reduce((sum, o) => sum + (o.redemptions || 0), 0);
      const now = new Date();
      const thisMonth = offersData.filter(o => {
        const createdDate = new Date(o.createdAt);
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      });
      const monthlyRedemptions = thisMonth.reduce((sum, o) => sum + (o.redemptions || 0), 0);
      
      setStats({
        totalOffers: offersData.length,
        activeOffers: activeCount,
        totalRedemptions,
        monthlyRedemptions,
        revenueImpact: totalRedemptions * 500 // Estimated average discount
      });
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const filterOffers = () => {
    let filtered = [...offers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => 
        statusFilter === 'active' ? offer.isActive : !offer.isActive
      );
    }

    setFilteredOffers(filtered);
  };

  const handleCreateOffer = () => {
    setEditingOffer(null);
    setShowForm(true);
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      await offerService.deleteOffer(offerId);
      fetchOffers();
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert('Failed to delete offer');
    }
  };

  const handleDuplicateOffer = (offer) => {
    const duplicated = {
      ...offer,
      _id: undefined,
      title: `${offer.title} (Copy)`,
      code: offer.code ? `${offer.code}-COPY` : '',
      redemptions: 0,
      createdAt: undefined,
      updatedAt: undefined
    };
    setEditingOffer(duplicated);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingOffer && editingOffer._id) {
        await offerService.updateOffer(editingOffer._id, formData);
      } else {
        await offerService.createOffer(formData);
      }
      setShowForm(false);
      setEditingOffer(null);
      fetchOffers();
    } catch (err) {
      console.error('Error saving offer:', err);
      alert('Failed to save offer: ' + (err.response?.data?.message || err.message));
    }
  };

  const topOffers = [...offers]
    .sort((a, b) => (b.redemptions || 0) - (a.redemptions || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offers Management</h1>
              <p className="text-gray-600">Create and manage promotional offers</p>
            </div>
          </div>

          <div className="flex gap-3">
            <FoodButton
              onClick={fetchOffers}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </FoodButton>
            <FoodButton
              onClick={handleCreateOffer}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
            </FoodButton>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <OfferAnalytics stats={stats} topOffers={topOffers} />
      </div>

      {/* Filters and View Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <FoodButton
                key={status}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? 'default' : 'outline'}
                className={statusFilter === status ? 'bg-orange-500 text-white' : ''}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </FoodButton>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 border-l pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
        </div>
      </div>

      {/* Offers Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading offers...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{error}</h3>
          <FoodButton onClick={fetchOffers} className="bg-orange-500 hover:bg-orange-600 text-white">
            Try Again
          </FoodButton>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <Gift className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first offer'}
          </p>
          <FoodButton
            onClick={handleCreateOffer}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Offer
          </FoodButton>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          <AnimatePresence>
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer._id}
                offer={offer}
                onEdit={handleEditOffer}
                onDelete={handleDeleteOffer}
                onDuplicate={handleDuplicateOffer}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Offer Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingOffer && editingOffer._id ? 'Edit Offer' : 'Create New Offer'}
            </DialogTitle>
          </DialogHeader>
          <OfferForm
            offer={editingOffer}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingOffer(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFoodOffersPage;

