import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import Checkout from '../../components/food/Checkout';

// Mock the useCart hook
const mockUseCart = {
  items: [
    {
      _id: '1',
      name: 'Jaffna Crab Curry',
      price: 1200,
      quantity: 1,
      category: 'Rice'
    },
    {
      _id: '2',
      name: 'Hoppers',
      price: 80,
      quantity: 2,
      category: 'Bread'
    }
  ],
  getTotal: () => 1360,
  getSubtotal: () => 1360,
  getLkrAdjustment: () => 68,
  getTax: () => 129.2,
  getServiceFee: () => 64.6,
  clearCart: jest.fn()
};

jest.mock('../../context/CartContext', () => ({
  useCart: () => mockUseCart,
  CartProvider: ({ children }) => <div>{children}</div>
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <CartProvider>
        {component}
      </CartProvider>
    </BrowserRouter>
  );
};

describe('Checkout Component', () => {
  const mockOnClose = jest.fn();
  const mockOnOrderComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders checkout form with all steps', () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Check if all steps are rendered
    expect(screen.getByText('Guest Details')).toBeInTheDocument();
    expect(screen.getByText('Order Type')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('starts with step 1 (Guest Details)', () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    expect(screen.getByText('Guest Information')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument();
  });

  it('validates required fields in step 1', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Try to go to next step without filling required fields
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    const emailInput = screen.getByLabelText('Email Address *');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('navigates to step 2 (Order Type) after valid step 1', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnOrderComplete} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
      expect(screen.getByText('Dine-in')).toBeInTheDocument();
      expect(screen.getByText('Takeaway')).toBeInTheDocument();
    });
  });

  it('shows table selection for dine-in orders', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill step 1 and go to step 2
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });

    // Select dine-in
    const dineInOption = screen.getByText('Dine-in');
    fireEvent.click(dineInOption);

    // Should show table selection
    await waitFor(() => {
      expect(screen.getByText('Table Number *')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select a table')).toBeInTheDocument();
    });
  });

  it('shows pickup time selection for takeaway orders', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill step 1 and go to step 2
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });

    // Select takeaway
    const takeawayOption = screen.getByText('Takeaway');
    fireEvent.click(takeawayOption);

    // Should show pickup time selection
    await waitFor(() => {
      expect(screen.getByText('Pickup Time *')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select pickup time')).toBeInTheDocument();
    });
  });

  it('navigates to step 3 (Payment) after valid step 2', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill step 1
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    // Fill step 2
    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Dine-in'));
    fireEvent.change(screen.getByDisplayValue('Select a table'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Next'));

    // Should go to step 3
    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Pay at Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    });
  });

  it('navigates to step 4 (Review) after valid step 3', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill step 1
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    // Fill step 2
    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Dine-in'));
    fireEvent.change(screen.getByDisplayValue('Select a table'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Next'));

    // Fill step 3
    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Pay at Restaurant'));
    fireEvent.click(screen.getByText('Next'));

    // Should go to step 4
    await waitFor(() => {
      expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Jaffna Crab Curry')).toBeInTheDocument();
      expect(screen.getByText('Hoppers')).toBeInTheDocument();
    });
  });

  it('displays order summary correctly in step 4', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Navigate to step 4
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Dine-in'));
    fireEvent.change(screen.getByDisplayValue('Select a table'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Pay at Restaurant'));
    fireEvent.click(screen.getByText('Next'));

    // Check order summary
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Jaffna Crab Curry')).toBeInTheDocument();
      expect(screen.getByText('Hoppers')).toBeInTheDocument();
      expect(screen.getByText('LKR 1,360.00')).toBeInTheDocument();
      expect(screen.getByText('Guest Information')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('allows going back to previous steps', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill step 1 and go to step 2
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });

    // Go back to step 1
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Guest Information')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });
  });

  it('submits order successfully', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Fill all steps
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+94771234567' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Choose Order Type')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Dine-in'));
    fireEvent.change(screen.getByDisplayValue('Select a table'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Pay at Restaurant'));
    fireEvent.click(screen.getByText('Next'));

    // Submit order
    await waitFor(() => {
      expect(screen.getByText('Review Your Order')).toBeInTheDocument();
    });
    
    const placeOrderButton = screen.getByText('Place Order');
    fireEvent.click(placeOrderButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Placing Order...')).toBeInTheDocument();
    });

    // Should call onOrderComplete after successful submission
    await waitFor(() => {
      expect(mockOnOrderComplete).toHaveBeenCalled();
    });
  });

  it('handles form validation errors gracefully', async () => {
    renderWithProviders(
      <Checkout onClose={mockOnClose} onOrderComplete={mockOnOrderComplete} />
    );

    // Try to submit with invalid data
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'Jo' } }); // Too short
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '123' } }); // Invalid phone
    fireEvent.click(screen.getByText('Next'));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Item name must be at least 3 characters')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });
});
