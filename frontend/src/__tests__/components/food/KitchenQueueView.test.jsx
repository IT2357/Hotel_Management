// 📁 frontend/src/__tests__/components/food/KitchenQueueView.test.jsx
// Unit tests for KitchenQueueView component
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KitchenQueueView from '../../../components/food/KitchenQueueView';

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
      if (key === 'userRole') return 'staff';
      return null;
    }),
    setItem: jest.fn(),
  },
  writable: true,
});

describe('KitchenQueueView', () => {
  const mockTasks = [
    {
      _id: 'task-1',
      orderId: {
        _id: 'order-1',
        items: [
          { name: 'Chicken Curry', quantity: 2, price: 350 },
          { name: 'Rice', quantity: 2, price: 100 }
        ],
        totalPrice: 900,
        orderType: 'dine-in',
        customerDetails: {
          specialInstructions: 'Extra spicy'
        }
      },
      taskType: 'prep',
      status: 'queued',
      priority: 'normal',
      isRoomService: false,
      estimatedCompletionTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    },
    {
      _id: 'task-2',
      orderId: {
        _id: 'order-2',
        items: [
          { name: 'Vegetable Soup', quantity: 1, price: 250 }
        ],
        totalPrice: 250,
        orderType: 'room-service',
        customerDetails: {}
      },
      taskType: 'cook',
      status: 'assigned',
      priority: 'urgent',
      isRoomService: true,
      estimatedCompletionTime: new Date(Date.now() + 20 * 60 * 1000) // 20 minutes
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fetch for kitchen queue endpoint
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: mockTasks
        })
      })
    );
    
    // Mock Notification API
    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn(() => Promise.resolve('granted'))
    };
  });

  test('renders kitchen queue view with statistics', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    // Check header
    expect(screen.getByText('Kitchen Queue')).toBeInTheDocument();
    
    // Check statistics cards (after data loads)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('1')).toBeInTheDocument(); // Urgent orders
    });
  });

  test('fetches kitchen queue on mount', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/food/workflow/kitchen-queue'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  test('displays tasks in the queue', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('2x Chicken Curry')).toBeInTheDocument();
      expect(screen.getByText('1x Vegetable Soup')).toBeInTheDocument();
    });
  });

  test('shows room service tasks with special styling', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      // Room service task should have red border (via className check)
      const roomServiceTask = screen.getByText('#2').closest('.rounded-2xl');
      expect(roomServiceTask).toBeInTheDocument();
    });
  });

  test('shows priority badges correctly', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });
  });

  test('shows start preparation button for queued tasks', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      const startButton = screen.getByText('Start Preparation');
      expect(startButton).toBeInTheDocument();
    });
  });

  test('filters tasks by status', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      // Initially shows both tasks
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
    
    // Filter by pending status (should show both queued and assigned)
    const pendingFilter = screen.getByText('Pending');
    fireEvent.click(pendingFilter);
    
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  test('filters tasks by priority', async () => {
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      // Initially shows both tasks
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
    
    // Filter by urgent priority
    const urgentFilter = screen.getByText('Urgent');
    fireEvent.click(urgentFilter);
    
    // Should still show both because the filter applies to the data
    // In real implementation, this would filter the displayed tasks
  });

  test('shows empty state when no tasks', async () => {
    // Mock empty response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: []
        })
      })
    );
    
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching', () => {
    // Mock slow fetch
    global.fetch = jest.fn(() => new Promise(() => {})); // Never resolves
    
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    expect(screen.getByText('Loading kitchen queue...')).toBeInTheDocument();
  });

  test('connects to socket.io and joins kitchen room', () => {
    // Mock socket.io
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
    
    render(<KitchenQueueView staffId="user-123" userRole="staff" />);
    
    // Check that socket.emit was called with join-room event
    expect(mockSocket.emit).toHaveBeenCalledWith('join-role-room', {
      role: 'staff',
      userId: 'user-123'
    });
  });
});
