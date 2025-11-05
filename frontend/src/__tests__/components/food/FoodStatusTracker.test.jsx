// 📁 frontend/src/__tests__/components/food/FoodStatusTracker.test.jsx
// Unit tests for FoodStatusTracker component
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FoodStatusTracker from '../../../components/food/FoodStatusTracker';

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
    getItem: jest.fn(() => 'test-token'),
    setItem: jest.fn(),
  },
  writable: true,
});

describe('FoodStatusTracker', () => {
  const mockOrder = {
    _id: 'test-order-id',
    status: 'Pending',
    kitchenStatus: 'pending',
    taskHistory: [
      {
        status: 'Pending',
        updatedAt: new Date().toISOString(),
        note: 'Order placed'
      }
    ]
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fetch for timeline endpoint
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            timeline: mockOrder.taskHistory,
            status: mockOrder.status,
            kitchenStatus: mockOrder.kitchenStatus,
            currentETA: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
          }
        })
      })
    );
  });

  test('renders without crashing', () => {
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={mockOrder} />);
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
  });

  test('displays correct status steps', () => {
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={mockOrder} />);
    
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Assigned to Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Being Prepared')).toBeInTheDocument();
    expect(screen.getByText('Ready for Delivery')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  test('shows ETA banner when eta is provided', () => {
    const orderWithETA = {
      ...mockOrder,
      status: 'Preparing'
    };
    
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={orderWithETA} />);
    
    // Wait for the component to update with ETA
    waitFor(() => {
      expect(screen.getByText(/minutes/)).toBeInTheDocument();
    });
  });

  test('displays timeline entries', () => {
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={mockOrder} />);
    
    expect(screen.getByText('Order placed')).toBeInTheDocument();
  });

  test('handles cancelled orders', () => {
    const cancelledOrder = {
      ...mockOrder,
      status: 'Cancelled'
    };
    
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={cancelledOrder} />);
    
    expect(screen.getByText('Order Cancelled')).toBeInTheDocument();
  });

  test('handles delivered orders', () => {
    const deliveredOrder = {
      ...mockOrder,
      status: 'Delivered'
    };
    
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={deliveredOrder} />);
    
    expect(screen.getByText('Order Delivered!')).toBeInTheDocument();
  });

  test('fetches timeline on mount', async () => {
    render(<FoodStatusTracker orderId="test-order-id" initialOrder={mockOrder} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/food/workflow/timeline/test-order-id'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });
});
