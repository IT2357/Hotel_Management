import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MenuPage from './MenuPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Mock the foodService
jest.mock('../services/foodService', () => ({
  getMenuItems: jest.fn(),
  getCategories: jest.fn(),
}));

// Mock the CartContext
jest.mock('../context/CartContext', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
    getItemCount: () => 0,
  }),
}));

// Mock the SharedNavbar component
jest.mock('../components/shared/SharedNavbar', () => () => <div data-testid="shared-navbar">Navbar</div>);

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('MenuPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    require('../services/foodService').getMenuItems.mockResolvedValue({ data: [] });
    require('../services/foodService').getCategories.mockResolvedValue({ data: [] });

    render(<MenuPage />, { wrapper });

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('renders menu items when data is loaded', async () => {
    // Mock the API responses
    require('../services/foodService').getMenuItems.mockResolvedValue({
      data: [
        {
          _id: '1',
          name: 'Test Dish',
          description: 'A delicious test dish',
          price: 10.99,
          isAvailable: true,
        },
      ],
    });

    require('../services/foodService').getCategories.mockResolvedValue({
      data: [
        {
          _id: 'cat1',
          name: 'Test Category',
        },
      ],
    });

    render(<MenuPage />, { wrapper });

    // Wait for the loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    // Check if the menu item is rendered
    expect(screen.getByText('Test Dish')).toBeInTheDocument();
    expect(screen.getByText('A delicious test dish')).toBeInTheDocument();
  });
});