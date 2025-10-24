// Example of how to wrap your App with the FavoritesProvider
// Add this to your main App.js or App.jsx file

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FavoritesProvider } from './contexts/FavoritesContext';
import YourMainAppComponent from './YourMainAppComponent';

function App() {
  return (
    <BrowserRouter>
      <FavoritesProvider>
        <YourMainAppComponent />
      </FavoritesProvider>
    </BrowserRouter>
  );
}

export default App;

/* 
Usage in components:

import { useFavorites } from '../contexts/FavoritesContext';

function SomeComponent() {
  const { 
    favorites, 
    favoritesCount, 
    isFavorite, 
    addToFavorites, 
    removeFromFavorites, 
    toggleFavorite 
  } = useFavorites();

  // Now you can use these functions and state
}
*/