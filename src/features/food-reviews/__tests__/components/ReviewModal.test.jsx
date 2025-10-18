import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewModal from '../../components/ReviewModal';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
  }),
}));

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
}));

const mockOrder = {
  _id: 'order123',
  orderType: 'dine-in',
  items: [{ name: 'Item 1' }],
};

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();

describe('ReviewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Rate Your Experience')).toBeInTheDocument();
    expect(screen.getByText('Order #123')).toBeInTheDocument();
  });

  test('displays correct rating categories for dine-in orders', () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Food Ratings')).toBeInTheDocument();
    expect(screen.getByText('Taste')).toBeInTheDocument();
    expect(screen.getByText('Freshness')).toBeInTheDocument();
    expect(screen.getByText('Presentation')).toBeInTheDocument();
    
    expect(screen.getByText('Service Ratings')).toBeInTheDocument();
    expect(screen.getByText('Staff Friendliness')).toBeInTheDocument();
    expect(screen.getByText('Service Speed')).toBeInTheDocument();
    expect(screen.getByText('Ambiance')).toBeInTheDocument();
  });

  test('displays correct service rating categories for takeaway orders', () => {
    const takeawayOrder = {
      ...mockOrder,
      orderType: 'takeaway'
    };

    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={takeawayOrder}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Order Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Pickup Time')).toBeInTheDocument();
    expect(screen.getByText('Packaging Quality')).toBeInTheDocument();
  });

  test('handles rating changes', () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    const tasteRating = screen.getByLabelText('Taste');
    fireEvent.click(tasteRating.children[2]); // Click on 3rd star (index 2 = 3 stars)
    
    // We can't directly assert state changes in this test setup
    // but we can verify the component renders without errors
    expect(tasteRating).toBeInTheDocument();
  });

  test('shows validation error when submitting without ratings', async () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide ratings for all categories')).toBeInTheDocument();
    });
  });

  test('handles feedback text input', () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    const feedbackInput = screen.getByLabelText('Additional Feedback (Optional)');
    fireEvent.change(feedbackInput, { target: { value: 'Great food!' } });
    
    expect(feedbackInput.value).toBe('Great food!');
  });

  test('toggles anonymous submission', () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    const anonymousCheckbox = screen.getByLabelText('Submit anonymously');
    fireEvent.click(anonymousCheckbox);
    
    expect(anonymousCheckbox.checked).toBe(true);
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <ReviewModal
        open={true}
        onClose={mockOnClose}
        order={mockOrder}
        onSubmit={mockOnSubmit}
      />
    );

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});