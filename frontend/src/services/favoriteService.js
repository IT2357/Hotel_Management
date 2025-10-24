class FavoriteService {
  constructor() {
    this.storageKey = 'hotel_favorites';
  }

  // Get all favorite rooms from localStorage
  getFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Add a room to favorites
  addToFavorites(room) {
    try {
      const favorites = this.getFavorites();
      
      // Check if room already exists in favorites
      const existingIndex = favorites.findIndex(fav => fav.id === room.id);
      
      if (existingIndex === -1) {
        // Add room with timestamp
        const favoriteRoom = {
          ...room,
          addedAt: new Date().toISOString()
        };
        favorites.push(favoriteRoom);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        return { success: true, message: 'Room added to favorites' };
      } else {
        return { success: false, message: 'Room already in favorites' };
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return { success: false, message: 'Failed to add to favorites' };
    }
  }

  // Remove a room from favorites
  removeFromFavorites(roomId) {
    try {
      const favorites = this.getFavorites();
      const filteredFavorites = favorites.filter(fav => fav.id !== roomId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredFavorites));
      return { success: true, message: 'Room removed from favorites' };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return { success: false, message: 'Failed to remove from favorites' };
    }
  }

  // Check if a room is in favorites
  isFavorite(roomId) {
    try {
      const favorites = this.getFavorites();
      return favorites.some(fav => fav.id === roomId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // Toggle favorite status
  toggleFavorite(room) {
    try {
      console.log('🔧 FavoriteService toggleFavorite called with room:', room);
      const isCurrentlyFavorite = this.isFavorite(room.id);
      console.log('🔧 Is currently favorite:', isCurrentlyFavorite);
      
      if (isCurrentlyFavorite) {
        console.log('🔧 Removing from favorites...');
        return this.removeFromFavorites(room.id);
      } else {
        console.log('🔧 Adding to favorites...');
        return this.addToFavorites(room);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return { success: false, message: 'Failed to toggle favorite' };
    }
  }

  // Clear all favorites
  clearFavorites() {
    try {
      localStorage.removeItem(this.storageKey);
      return { success: true, message: 'All favorites cleared' };
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return { success: false, message: 'Failed to clear favorites' };
    }
  }

  // Get favorites count
  getFavoritesCount() {
    return this.getFavorites().length;
  }

  // Get favorite room by ID
  getFavoriteById(roomId) {
    const favorites = this.getFavorites();
    return favorites.find(fav => fav.id === roomId) || null;
  }
}

// Create and export a singleton instance
const favoriteService = new FavoriteService();
export default favoriteService;