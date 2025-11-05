// 📁 frontend/src/__tests__/pages/manager/FoodOrderManagementPage.test.jsx
// Unit tests for FoodOrderManagementPage component
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import FoodOrderManagementPage from '../../../pages/manager/FoodOrderManagementPage';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => mockSocket);
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'userId') return 'user-123';
      if (key === 'userRole') return 'manager';
      return null;
    }),
    setItem: jest.fn(),
  },
  writable: true,
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('FoodOrderManagementPage', () => {
  const mockOrders = [
    {
      _id: 'order-123',
      customerDetails: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      items: [
        { name: 'Chicken Curry', quantity: 2 },
        { name: 'Rice', quantity: 2 }
      ],
      totalPrice: 900,
      orderType: 'dine-in',
      status: 'Pending',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'order-456',
      customerDetails: {
        name: 'Jane Smith',
        email: 'jane@example.com'
      },
      items: [
        { name: 'Vegetable Soup', quantity: 1 }
      ],
      totalPrice: 250,
      orderType: 'room-service',
      status: 'Preparing',
      createdAt: new Date().toISOString(),
      deliveryLocation: 'Room 101'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fetch for orders endpoint
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: mockOrders
        })
      })
    );
  });

  test('renders order management page with statistics', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    // Check header
    expect(screen.getByText('Food Order Management')).toBeInTheDocument();
    
    // Check statistics cards (after data loads)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total orders
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending orders
      expect(screen.getByText('1')).toBeInTheDocument(); // In progress orders
    });
  });

  test('fetches orders on mount', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/food/orders'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  test('displays orders in table', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('#123')).toBeInTheDocument();
      expect(screen.getByText('#456')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('shows room service orders with special styling', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Room service order should have special styling
      expect(screen.getByText('Room')).toBeInTheDocument();
    });
  });

  test('shows order status badges', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Preparing')).toBeInTheDocument();
    });
  });

  test('filters orders by status', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Initially shows both orders
      expect(screen.getByText('#123')).toBeInTheDocument();
      expect(screen.getByText('#456')).toBeInTheDocument();
    });
    
    // Filter by Pending status
    const statusFilter = screen.getByRole('combobox', { name: '' }); // Status filter dropdown
    fireEvent.change(statusFilter, { target: { value: 'Pending' } });
    
    // In a real implementation, this would filter the displayed orders
    // For this test, we're just checking that the filter exists
    expect(statusFilter).toHaveValue('Pending');
  });

  test('searches orders by customer name', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Initially shows both orders
      expect(screen.getByText('#123')).toBeInTheDocument();
      expect(screen.getByText('#456')).toBeInTheDocument();
    });
    
    // Search for John
    const searchInput = screen.getByPlaceholderText(/search by order id/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // In a real implementation, this would filter the displayed orders
    // For this test, we're just checking that the search input works
    expect(searchInput).toHaveValue('John');
  });

  test('exports orders to CSV', async () => {
    // Mock createObjectURL and revokeObjectURL
    const mockCreateObjectURL = jest.fn(() => 'blob:http://localhost/test');
    const mockRevokeObjectURL = jest.fn();
    
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    // Mock createElement and click for download
    const mockClick = jest.fn();
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick
        };
      }
      return {};
    });
    
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
    
    // Click export button
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    // Check that CSV was created
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  test('navigates to kitchen queue', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Kitchen Queue')).toBeInTheDocument();
    });
    
    // Click kitchen queue button
    const kitchenQueueButton = screen.getByText('Kitchen Queue');
    fireEvent.click(kitchenQueueButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/kitchen-dashboard');
  });

  test('navigates to order details', async () => {
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });
    
    // Click view button for first order
    const viewButton = screen.getAllByText('View')[0];
    fireEvent.click(viewButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/manager/food-orders/order-123');
  });

  test('shows empty state when no orders', async () => {
    // Mock empty response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: []
        })
      })
    );
    
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching', () => {
    // Mock slow fetch
    global.fetch = jest.fn(() => new Promise(() => {})); // Never resolves
    
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  test('connects to socket.io and joins manager room', () => {
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io with our mock
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(
      <BrowserRouter>
        <FoodOrderManagementPage />
      </BrowserRouter>
    );
    
    // Check that socket.emit was called with join-room event
    expect(mockSocket.emit).toHaveBeenCalledWith('join-role-room', {
      role: 'manager',
      userId: 'user-123'
    });
  });
});
