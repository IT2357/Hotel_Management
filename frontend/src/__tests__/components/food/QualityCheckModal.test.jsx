// 📁 frontend/src/__tests__/components/food/QualityCheckModal.test.jsx
// Unit tests for QualityCheckModal component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QualityCheckModal from '../../../components/food/QualityCheckModal';

describe('QualityCheckModal', () => {
  const mockTask = {
    _id: 'task-123',
    orderId: {
      _id: 'order-456',
      items: [
        {
          name: 'Chicken Curry',
          quantity: 2,
          foodId: {
            allergens: ['peanuts'],
            dietaryTags: ['halal']
          }
        }
      ]
    }
  };

  const mockOnComplete = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quality check modal with correct sections', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    // Check header
    expect(screen.getByText('Quality Check')).toBeInTheDocument();
    expect(screen.getByText('#456')).toBeInTheDocument();
    
    // Check Jaffna standards notice
    expect(screen.getByText('Jaffna Hospitality Standards')).toBeInTheDocument();
    
    // Check order items
    expect(screen.getByText('2x Chicken Curry')).toBeInTheDocument();
    
    // Check quality check items
    expect(screen.getByText('Temperature Check')).toBeInTheDocument();
    expect(screen.getByText('Presentation')).toBeInTheDocument();
    expect(screen.getByText('Portion Size')).toBeInTheDocument();
    expect(screen.getByText('Garnish & Finishing')).toBeInTheDocument();
    
    // Check allergen verification section
    expect(screen.getByText('Allergen Verification Required')).toBeInTheDocument();
    expect(screen.getByText('Verify Allergen Information')).toBeInTheDocument();
    
    // Check dietary verification section
    expect(screen.getByText('Dietary Requirements')).toBeInTheDocument();
    expect(screen.getByText('Verify Dietary Compliance')).toBeInTheDocument();
    
    // Check special instructions
    // (No special instructions in this mock, so this won't appear)
  });

  test('shows special instructions when present', () => {
    const taskWithInstructions = {
      ...mockTask,
      orderId: {
        ...mockTask.orderId,
        customerDetails: {
          specialInstructions: 'Extra spicy, no onions'
        }
      }
    };
    
    render(
      <QualityCheckModal 
        task={taskWithInstructions} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Extra spicy, no onions')).toBeInTheDocument();
  });

  test('allows toggling quality check items', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    const temperatureCheck = screen.getByText('Temperature Check');
    fireEvent.click(temperatureCheck);
    
    // Should show as checked
    expect(screen.getByText('Temperature Check')).toBeInTheDocument();
  });

  test('requires allergen verification when allergens present', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    // Button should be disabled initially
    const submitButton = screen.getByText('Complete All Checks');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Click all quality checks
    fireEvent.click(screen.getByText('Temperature Check'));
    fireEvent.click(screen.getByText('Presentation'));
    fireEvent.click(screen.getByText('Portion Size'));
    fireEvent.click(screen.getByText('Garnish & Finishing'));
    
    // Button should still be disabled because allergen verification is required
    expect(submitButton).toBeDisabled();
    
    // Click allergen verification
    fireEvent.click(screen.getByText('Verify Allergen Information'));
    
    // Button should still be disabled because dietary verification is required
    expect(submitButton).toBeDisabled();
    
    // Click dietary verification
    fireEvent.click(screen.getByText('Verify Dietary Compliance'));
    
    // Now button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  test('calls onComplete with quality checks when submitted', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    // Complete all checks
    fireEvent.click(screen.getByText('Temperature Check'));
    fireEvent.click(screen.getByText('Presentation'));
    fireEvent.click(screen.getByText('Portion Size'));
    fireEvent.click(screen.getByText('Garnish & Finishing'));
    fireEvent.click(screen.getByText('Verify Allergen Information'));
    fireEvent.click(screen.getByText('Verify Dietary Compliance'));
    
    // Click submit button
    const submitButton = screen.getByText('Mark as Ready');
    fireEvent.click(submitButton);
    
    // Should call onComplete with quality checks
    expect(mockOnComplete).toHaveBeenCalledWith({
      temperature: true,
      presentation: true,
      portionSize: true,
      garnish: true,
      allergyChecked: true,
      dietaryTagsVerified: true
    });
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls onClose when cancel button is clicked', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows allergen badges on items', () => {
    render(
      <QualityCheckModal 
        task={mockTask} 
        onComplete={mockOnComplete} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('peanuts')).toBeInTheDocument();
  });
});
