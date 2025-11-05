// 📁 frontend/src/__tests__/components/food/FoodOrderAlert.test.jsx
// Unit tests for FoodOrderAlert component
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import FoodOrderAlert from '../../../components/food/FoodOrderAlert';

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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('FoodOrderAlert', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Notification API
    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn(() => Promise.resolve('granted')),
      Notification: jest.fn()
    };
    
    // Mock Audio
    window.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      volume: 0.5
    }));
  });

  test('does not render for non-manager roles', () => {
    const { container } = render(
      <BrowserRouter>
        <FoodOrderAlert userRole="staff" userId="user-123" />
      </BrowserRouter>
    );
    
    // Should render nothing for staff
    expect(container.firstChild).toBeNull();
  });

  test('connects to socket.io for manager role', () => {
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
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Check that socket.emit was called with join-room event
    expect(mockSocket.emit).toHaveBeenCalledWith('join-role-room', {
      role: 'manager',
      userId: 'user-123'
    });
  });

  test('requests notification permission on mount', () => {
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    expect(Notification.requestPermission).toHaveBeenCalled();
  });

  test('shows notification when newFoodOrder event received', async () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'newFoodOrder') {
          // Simulate receiving a new order notification
          callback({
            orderId: 'order-123',
            totalPrice: 450,
            items: 3,
            priority: 'normal',
            isRoomService: false,
            timestamp: new Date().toISOString()
          });
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Wait for notification to appear
    await waitFor(() => {
      expect(screen.getByText('New Food Order!')).toBeInTheDocument();
    });
    
    // Check notification content
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('LKR 450.00')).toBeInTheDocument();
    expect(screen.getByText('3 items ordered')).toBeInTheDocument();
  });

  test('plays sound when new order notification received', async () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'newFoodOrder') {
          callback({
            orderId: 'order-123',
            totalPrice: 450,
            items: 3,
            priority: 'normal',
            isRoomService: false,
            timestamp: new Date().toISOString()
          });
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    const mockPlay = jest.fn().mockResolvedValue(undefined);
    window.Audio = jest.fn().mockImplementation(() => ({
      play: mockPlay,
      volume: 0.5
    }));
    
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Wait for notification
    await waitFor(() => {
      expect(screen.getByText('New Food Order!')).toBeInTheDocument();
    });
    
    // Check that sound was played
    expect(mockPlay).toHaveBeenCalled();
  });

  test('shows room service styling for room service orders', async () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'newFoodOrder') {
          callback({
            orderId: 'order-123',
            totalPrice: 450,
            items: 3,
            priority: 'urgent',
            isRoomService: true,
            timestamp: new Date().toISOString()
          });
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Wait for notification
    await waitFor(() => {
      expect(screen.getByText('New Food Order!')).toBeInTheDocument();
    });
    
    // Check for room service styling
    expect(screen.getByText('🏨 Room Service')).toBeInTheDocument();
  });

  test('navigates to order details when View Details clicked', async () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'newFoodOrder') {
          callback({
            orderId: 'order-123',
            totalPrice: 450,
            items: 3,
            priority: 'normal',
            isRoomService: false,
            timestamp: new Date().toISOString()
          });
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Wait for notification
    await waitFor(() => {
      expect(screen.getByText('New Food Order!')).toBeInTheDocument();
    });
    
    // Click View Details button
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/manager/food-orders/order-123');
  });

  test('dismisses notification when X button clicked', async () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'newFoodOrder') {
          callback({
            orderId: 'order-123',
            totalPrice: 450,
            items: 3,
            priority: 'normal',
            isRoomService: false,
            timestamp: new Date().toISOString()
          });
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Wait for notification
    await waitFor(() => {
      expect(screen.getByText('New Food Order!')).toBeInTheDocument();
    });
    
    // Click dismiss button
    const dismissButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(dismissButton);
    
    // Notification should be removed
    expect(screen.queryByText('New Food Order!')).not.toBeInTheDocument();
  });

  test('auto-dismisses notification after 10 seconds', async () => {
    jest.useFakeTimers();
    
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'newFoodOrder') {
          callback({
            orderId: 'order-123',
            totalPrice: 450,
            items: 3,
            priority: 'normal',
            isRoomService: false,
            timestamp: new Date().toISOString()
          });
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    // Re-mock socket.io
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(
      <BrowserRouter>
        <FoodOrderAlert userRole="manager" userId="user-123" />
      </BrowserRouter>
    );
    
    // Wait for notification
    await waitFor(() => {
      expect(screen.getByText('New Food Order!')).toBeInTheDocument();
    });
    
    // Fast-forward 10 seconds
    jest.advanceTimersByTime(10000);
    
    // Notification should be removed
    expect(screen.queryByText('New Food Order!')).not.toBeInTheDocument();
    
    jest.useRealTimers();
  });
});
