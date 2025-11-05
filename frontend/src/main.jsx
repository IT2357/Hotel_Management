import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <App />
);

// Note: StrictMode removed to reduce duplicate renders in development
// Re-enable for production builds if needed
