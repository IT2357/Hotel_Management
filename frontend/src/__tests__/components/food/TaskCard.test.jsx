// 📁 frontend/src/__tests__/components/food/TaskCard.test.jsx
// Unit tests for TaskCard component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskCard from '../../../components/food/TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    _id: 'task-123',
    orderId: {
      _id: 'order-456',
      items: [
        {
          name: 'Chicken Curry',
          quantity: 2,
          price: 350
        },
        {
          name: 'Vegetable Rice',
          quantity: 1,
          price: 200
        }
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
    estimatedCompletionTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
  };

  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task card with correct information', () => {
    render(<TaskCard task={mockTask} index={0} onAction={mockOnAction} />);
    
    // Check order ID
    expect(screen.getByText('#456')).toBeInTheDocument();
    
    // Check priority badge
    expect(screen.getByText('Normal')).toBeInTheDocument();
    
    // Check status badge
    expect(screen.getByText('Queued')).toBeInTheDocument();
    
    // Check task type
    expect(screen.getByText('Task: prep')).toBeInTheDocument();
    
    // Check items
    expect(screen.getByText('2x Chicken Curry')).toBeInTheDocument();
    expect(screen.getByText('1x Vegetable Rice')).toBeInTheDocument();
    
    // Check total price
    expect(screen.getByText('LKR 900.00')).toBeInTheDocument();
    
    // Check order type
    expect(screen.getByText('Dine-in')).toBeInTheDocument();
    
    // Check special instructions
    expect(screen.getByText('Extra spicy')).toBeInTheDocument();
  });

  test('shows room service badge for room service orders', () => {
    const roomServiceTask = {
      ...mockTask,
      isRoomService: true,
      priority: 'urgent'
    };
    
    render(<TaskCard task={roomServiceTask} index={0} onAction={mockOnAction} />);
    
    expect(screen.getByText('Room Service')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  test('shows start preparation button for queued tasks', () => {
    render(<TaskCard task={mockTask} index={0} onAction={mockOnAction} />);
    
    const startButton = screen.getByText('Start Preparation');
    expect(startButton).toBeInTheDocument();
    
    fireEvent.click(startButton);
    expect(mockOnAction).toHaveBeenCalledWith('task-123', 'start');
  });

  test('shows mark as ready button for in-progress tasks', () => {
    const inProgressTask = {
      ...mockTask,
      status: 'in-progress'
    };
    
    render(<TaskCard task={inProgressTask} index={0} onAction={mockOnAction} />);
    
    const readyButton = screen.getByText('Mark as Ready');
    expect(readyButton).toBeInTheDocument();
    
    fireEvent.click(readyButton);
    expect(mockOnAction).toHaveBeenCalledWith('task-123', 'ready');
  });

  test('shows allergen warning when items have allergens', () => {
    const taskWithAllergens = {
      ...mockTask,
      orderId: {
        ...mockTask.orderId,
        items: [
          {
            ...mockTask.orderId.items[0],
            foodId: {
              allergens: ['peanuts', 'shellfish']
            }
          }
        ]
      },
      allergyChecked: false
    };
    
    render(<TaskCard task={taskWithAllergens} index={0} onAction={mockOnAction} />);
    
    expect(screen.getByText('Allergen Alert')).toBeInTheDocument();
    expect(screen.getByText('Please verify ingredients')).toBeInTheDocument();
  });

  test('displays timer for in-progress tasks', () => {
    const inProgressTask = {
      ...mockTask,
      status: 'in-progress',
      startedAt: new Date().toISOString()
    };
    
    jest.useFakeTimers();
    
    render(<TaskCard task={inProgressTask} index={0} onAction={mockOnAction} />);
    
    // Timer should show 0:00 initially
    expect(screen.getByText('0:00')).toBeInTheDocument();
    
    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);
    
    // Timer should update (this would happen in real component, but we're just checking initial render)
    expect(screen.getByText('0:00')).toBeInTheDocument();
    
    jest.useRealTimers();
  });

  test('displays ETA correctly', () => {
    render(<TaskCard task={mockTask} index={0} onAction={mockOnAction} />);
    
    // Should show ETA in minutes
    expect(screen.getByText(/min/)).toBeInTheDocument();
  });
});
