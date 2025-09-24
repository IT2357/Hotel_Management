import React, { useState, useEffect } from 'react';
import useTitle from '../../hooks/useTitle';
import { useSnackbar } from 'notistack';
import Modal from '../../components/ui/Modal';
import { 
  listKeyCards, 
  createKeyCard, 
  activateKeyCard, 
  deactivateKeyCard,
  updateKeyCardStatus,
  getKeyCardDetails
} from '../../services/keyCardService';

const KeyCardManagementPage = () => {
  useTitle('Key Card Management');
  const { enqueueSnackbar } = useSnackbar();

  const [keyCards, setKeyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');

  useEffect(() => {
    fetchKeyCards();
  }, []);

  const fetchKeyCards = async () => {
    try {
      setLoading(true);
      const cards = await listKeyCards();
      setKeyCards(cards);
      setError(null);
    } catch (err) {
      setError('Failed to load key cards');
      console.error('Error fetching key cards:', err);
      enqueueSnackbar('Failed to load key cards', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeyCard = async () => {
    if (!newCardNumber.trim()) {
      enqueueSnackbar('Please enter a card number', { variant: 'warning' });
      return;
    }

    try {
      setCreating(true);
      await createKeyCard(newCardNumber.trim());
      enqueueSnackbar('Key card created successfully', { variant: 'success' });
      setNewCardNumber('');
      setShowCreateModal(false);
      fetchKeyCards();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create key card', { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateCard = async (cardId) => {
    try {
      await deactivateKeyCard(cardId);
      enqueueSnackbar('Key card deactivated', { variant: 'info' });
      fetchKeyCards();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to deactivate key card', { variant: 'error' });
    }
  };

  const handleMarkAsLost = async (cardId) => {
    const card = keyCards.find(c => c._id === cardId);
    if (card) {
      setStatusChangeData({ cardId, newStatus: 'lost', card });
      setStatusChangeReason('');
      setShowStatusChangeModal(true);
    }
  };

  const handleMarkAsDamaged = async (cardId) => {
    const card = keyCards.find(c => c._id === cardId);
    if (card) {
      setStatusChangeData({ cardId, newStatus: 'damaged', card });
      setStatusChangeReason('');
      setShowStatusChangeModal(true);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusChangeData) return;

    try {
      await updateKeyCardStatus(statusChangeData.cardId, statusChangeData.newStatus, statusChangeReason);
      enqueueSnackbar(`Key card marked as ${statusChangeData.newStatus}`, { variant: 'warning' });
      fetchKeyCards();
      setShowStatusChangeModal(false);
      setStatusChangeData(null);
      setStatusChangeReason('');
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || `Failed to mark key card as ${statusChangeData.newStatus}`, { variant: 'error' });
    }
  };

  const handleViewDetails = async (card) => {
    setSelectedCard(card);
    setShowDetailsModal(true);
    setLoadingDetails(true);

    try {
      const details = await getKeyCardDetails(card._id);
      setCardDetails(details);
    } catch (error) {
      enqueueSnackbar('Failed to load card details', { variant: 'error' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <span className="text-green-500">✅</span>;
      case 'inactive':
        return <span className="text-gray-500">⚪</span>;
      case 'lost':
        return <span className="text-red-500">❌</span>;
      case 'damaged':
        return <span className="text-orange-500">🔧</span>;
      case 'expired':
        return <span className="text-yellow-500">⚠️</span>;
      default:
        return <span className="text-gray-500">❓</span>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'damaged':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: keyCards.length,
    active: keyCards.filter(k => k.status === 'active').length,
    inactive: keyCards.filter(k => k.status === 'inactive').length,
    lost: keyCards.filter(k => k.status === 'lost').length,
    damaged: keyCards.filter(k => k.status === 'damaged').length,
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Key Card Management</h1>
              <p className="text-gray-600">Monitor and manage hotel key card assignments</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <span className="mr-2">➕</span>
                Add Key Card
              </button>
              <button 
                onClick={fetchKeyCards} 
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="text-2xl text-blue-600 mr-3">🔑</div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="text-2xl text-green-600 mr-3">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="text-2xl text-gray-600 mr-3">⚪</div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="text-2xl text-red-600 mr-3">❌</div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
              <div className="text-sm text-gray-600">Lost</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="text-2xl text-orange-600 mr-3">🔧</div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.damaged}</div>
              <div className="text-sm text-gray-600">Damaged</div>
            </div>
          </div>
        </div>

        {/* Key Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {keyCards.map((card) => (
            <div 
              key={card._id} 
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewDetails(card)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Card {card.cardNumber}</h3>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card.status)}`}>
                    {card.status}
                  </div>
                </div>
                {getStatusIcon(card.status)}
              </div>

              {card.assignedTo && (
                <div className="mb-3">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <span className="mr-1">👤</span>
                    {card.assignedTo.firstName} {card.assignedTo.lastName}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-1">🏠</span>
                    Room {card.assignedRoom?.number}
                  </div>
                </div>
              )}

              {card.expirationDate && (
                <div className="text-xs text-gray-500">
                  Expires: {new Date(card.expirationDate).toLocaleDateString()}
                </div>
              )}
              
              <div className="mt-3 text-xs text-blue-600 font-medium">
                Click for details →
              </div>
              
              {/* Action Buttons */}
              <div className="mt-3 flex space-x-2">
                {card.status === 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivateCard(card._id);
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Deactivate
                  </button>
                )}
                {card.status !== 'lost' && card.status !== 'damaged' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsLost(card._id);
                      }}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Mark Lost
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsDamaged(card._id);
                      }}
                      className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                    >
                      Mark Damaged
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Key Card System</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Key cards are automatically assigned during check-in</li>
            <li>• Cards expire automatically at check-out time</li>
            <li>• Lost or damaged cards should be marked appropriately</li>
            <li>• Only inactive cards are available for new assignments</li>
          </ul>
        </div>

        {/* Key Card Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCard(null);
            setCardDetails(null);
          }}
          title={`Key Card Details - Card ${selectedCard?.cardNumber}`}
          size="lg"
        >
          {loadingDetails ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3">Loading details...</span>
            </div>
          ) : cardDetails ? (
            <div className="space-y-6">
              {/* Basic Card Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Card Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Card Number:</span>
                      <span className="font-medium">{cardDetails.cardNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cardDetails.status)}`}>
                        {cardDetails.status}
                      </span>
                    </div>
                    {cardDetails.activationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Activated:</span>
                        <span className="font-medium">{new Date(cardDetails.activationDate).toLocaleString()}</span>
                      </div>
                    )}
                    {cardDetails.expirationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium">{new Date(cardDetails.expirationDate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment Information */}
                {cardDetails.assignedTo && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">Current Assignment</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Guest:</span>
                        <span className="font-medium">{cardDetails.assignedTo.firstName} {cardDetails.assignedTo.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Email:</span>
                        <span className="font-medium">{cardDetails.assignedTo.email}</span>
                      </div>
                      {cardDetails.assignedRoom && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Room:</span>
                          <span className="font-medium">{cardDetails.assignedRoom.number} ({cardDetails.assignedRoom.type})</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Check-in Details */}
              {cardDetails.checkInDetails && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">Stay Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-green-700">Check-in Time:</span>
                        <span className="font-medium">{new Date(cardDetails.checkInDetails.checkInTime).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-green-700">Status:</span>
                        <span className="font-medium capitalize">{cardDetails.checkInDetails.status.replace('_', ' ')}</span>
                      </div>
                      {cardDetails.checkInDetails.booking && (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-green-700">Check-in Date:</span>
                            <span className="font-medium">{new Date(cardDetails.checkInDetails.booking.checkInDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Check-out Date:</span>
                            <span className="font-medium">{new Date(cardDetails.checkInDetails.booking.checkOutDate).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      {cardDetails.checkInDetails.preferences && (
                        <div className="mb-3">
                          <span className="text-green-700 font-medium">Preferences:</span>
                          <div className="mt-1 text-xs space-y-1">
                            {cardDetails.checkInDetails.preferences.roomService && (
                              <div>• Room Service</div>
                            )}
                            {cardDetails.checkInDetails.preferences.housekeeping && (
                              <div>• Housekeeping: {cardDetails.checkInDetails.preferences.housekeeping}</div>
                            )}
                            {cardDetails.checkInDetails.preferences.doNotDisturb && (
                              <div>• Do Not Disturb</div>
                            )}
                            {cardDetails.checkInDetails.preferences.specialRequests && (
                              <div>• Special: {cardDetails.checkInDetails.preferences.specialRequests}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History/Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Card Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">🕐</span>
                    <span>Created: {new Date(cardDetails.createdAt).toLocaleString()}</span>
                  </div>
                  {cardDetails.updatedAt !== cardDetails.createdAt && (
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-500">🔄</span>
                      <span>Last Updated: {new Date(cardDetails.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {cardDetails.activationDate && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Activated: {new Date(cardDetails.activationDate).toLocaleString()}</span>
                    </div>
                  )}
                  {cardDetails.statusChangedAt && (
                    <div className="flex items-center space-x-2">
                      <span className={cardDetails.status === 'lost' ? 'text-red-500' : cardDetails.status === 'damaged' ? 'text-orange-500' : 'text-gray-500'}>
                        {cardDetails.status === 'lost' ? '❌' : cardDetails.status === 'damaged' ? '🔧' : '📝'}
                      </span>
                      <div>
                        <span>Status changed to <strong>{cardDetails.status}</strong></span>
                        {cardDetails.previousStatus && (
                          <span className="text-gray-500"> (from {cardDetails.previousStatus})</span>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          By {cardDetails.statusChangedBy?.firstName} {cardDetails.statusChangedBy?.lastName} on {new Date(cardDetails.statusChangedAt).toLocaleString()}
                          {cardDetails.statusChangeReason && (
                            <div className="mt-1 italic">Reason: {cardDetails.statusChangeReason}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load card details
            </div>
          )}
        </Modal>

        {/* Create Key Card Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Key Card" size="md">
          <div className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card Number</label>
              <input
                id="cardNumber"
                type="text"
                placeholder="Enter card number (e.g., 001, 002)"
                value={newCardNumber}
                onChange={(e) => setNewCardNumber(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={() => setShowCreateModal(false)} 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateKeyCard} 
              disabled={creating}
              className={`px-4 py-2 rounded-md transition-colors ${
                creating ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {creating ? 'Creating...' : 'Create Key Card'}
            </button>
          </div>
        </Modal>

        {/* Status Change Confirmation Modal */}
        <Modal 
          isOpen={showStatusChangeModal} 
          onClose={() => {
            setShowStatusChangeModal(false);
            setStatusChangeData(null);
            setStatusChangeReason('');
          }} 
          title={`Confirm Status Change - Card ${statusChangeData?.card?.cardNumber}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Mark Card as {statusChangeData?.newStatus === 'lost' ? 'Lost' : 'Damaged'}
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      This will change the status of card <strong>{statusChangeData?.card?.cardNumber}</strong> from{' '}
                      <span className="font-medium">{statusChangeData?.card?.status}</span> to{' '}
                      <span className="font-medium">{statusChangeData?.newStatus}</span>.
                    </p>
                    {statusChangeData?.card?.assignedTo && (
                      <p className="mt-2">
                        <strong>Warning:</strong> This card is currently assigned to{' '}
                        {statusChangeData.card.assignedTo.firstName} {statusChangeData.card.assignedTo.lastName}. 
                        Marking it as {statusChangeData?.newStatus} will clear the assignment.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="statusChangeReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for status change (optional)
              </label>
              <textarea
                id="statusChangeReason"
                rows={3}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Please provide a reason for this status change..."
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => {
                setShowStatusChangeModal(false);
                setStatusChangeData(null);
                setStatusChangeReason('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmStatusChange}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusChangeData?.newStatus === 'lost'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              Confirm {statusChangeData?.newStatus === 'lost' ? 'Lost' : 'Damaged'}
            </button>
          </div>
        </Modal>
    </div>
  );
};

export default KeyCardManagementPage;