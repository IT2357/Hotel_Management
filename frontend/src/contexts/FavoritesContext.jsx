import React, { createContext, useContext, useState, useEffect } from 'react';
import favoriteService from '../services/favoriteService';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const storedFavorites = favoriteService.getFavorites();
    setFavorites(storedFavorites);
    setFavoritesCount(storedFavorites.length);
  };

  const addToFavorites = (room) => {
    const result = favoriteService.addToFavorites(room);
    if (result.success) {
      loadFavorites(); // Refresh favorites
    }
    return result;
  };

  const removeFromFavorites = (roomId) => {
    const result = favoriteService.removeFromFavorites(roomId);
    if (result.success) {
      loadFavorites(); // Refresh favorites
    }
    return result;
  };

  const toggleFavorite = (room) => {
    console.log('🔧 FavoritesContext toggleFavorite called with:', room);
    const result = favoriteService.toggleFavorite(room);
    console.log('🔧 FavoritesContext toggleFavorite result:', result);
    if (result.success) {
      console.log('🔧 Refreshing favorites...');
      loadFavorites(); // Refresh favorites
    }
    return result;
  };

  const isFavorite = (roomId) => {
    return favorites.some(fav => fav.id === roomId);
  };

  const clearFavorites = () => {
    const result = favoriteService.clearFavorites();
    if (result.success) {
      loadFavorites(); // Refresh favorites
    }
    return result;
  };

  const getFavoriteById = (roomId) => {
    return favorites.find(fav => fav.id === roomId) || null;
  };

  const value = {
    favorites,
    favoritesCount,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    getFavoriteById,
    refreshFavorites: loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};