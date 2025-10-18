describe('Food Ordering E2E Tests', () => {
  beforeEach(() => {
    // Visit the food ordering page
    cy.visit('/food-ordering');
    
    // Wait for the page to load
    cy.get('[data-testid="food-ordering-page"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Menu Browsing', () => {
    it('should display menu items with Jaffna theme', () => {
      // Check if the page loads with correct theme colors
      cy.get('[data-testid="menu-header"]').should('have.class', 'bg-gradient-to-r from-[#FF9933] to-[#FFFFFF]');
      
      // Check if menu items are displayed
      cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);
      
      // Check if each menu item has the correct styling
      cy.get('[data-testid="menu-item"]').first().should('have.class', 'border-l-4 border-[#FF9933]');
    });

    it('should filter menu items by category', () => {
      // Click on a category filter
      cy.get('[data-testid="category-filter"]').contains('Rice').click();
      
      // Wait for filtered results
      cy.get('[data-testid="menu-item"]').should('be.visible');
      
      // Verify that only items from the selected category are shown
      cy.get('[data-testid="menu-item"]').each(($item) => {
        cy.wrap($item).should('contain.text', 'Rice');
      });
    });

    it('should search menu items', () => {
      // Type in search box
      cy.get('[data-testid="search-input"]').type('crab');
      
      // Wait for search results
      cy.get('[data-testid="menu-item"]').should('be.visible');
      
      // Verify search results contain the search term
      cy.get('[data-testid="menu-item"]').should('contain.text', 'crab');
    });

    it('should display loading skeleton while loading', () => {
      // Intercept the API call to delay response
      cy.intercept('GET', '/api/food/menu', { delay: 1000 }).as('getMenu');
      
      // Reload the page
      cy.reload();
      
      // Check if loading skeleton is displayed
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      
      // Wait for the API call to complete
      cy.wait('@getMenu');
      
      // Check if menu items are displayed after loading
      cy.get('[data-testid="menu-item"]').should('be.visible');
    });
  });

  describe('Cart Functionality', () => {
    it('should add items to cart', () => {
      // Click add to cart on first item
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      
      // Check if cart counter updates
      cy.get('[data-testid="cart-counter"]').should('contain.text', '1');
      
      // Add another item
      cy.get('[data-testid="menu-item"]').eq(1).find('[data-testid="add-to-cart"]').click();
      
      // Check if cart counter updates to 2
      cy.get('[data-testid="cart-counter"]').should('contain.text', '2');
    });

    it('should open cart dialog', () => {
      // Add item to cart
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      
      // Click cart button
      cy.get('[data-testid="cart-button"]').click();
      
      // Check if cart dialog opens
      cy.get('[data-testid="cart-dialog"]').should('be.visible');
      cy.get('[data-testid="cart-dialog"]').should('contain.text', 'Your Order');
    });

    it('should update item quantities in cart', () => {
      // Add item to cart
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      
      // Open cart
      cy.get('[data-testid="cart-button"]').click();
      
      // Increase quantity
      cy.get('[data-testid="quantity-increase"]').click();
      
      // Check if quantity updates
      cy.get('[data-testid="quantity-display"]').should('contain.text', '2');
      
      // Decrease quantity
      cy.get('[data-testid="quantity-decrease"]').click();
      
      // Check if quantity updates back to 1
      cy.get('[data-testid="quantity-display"]').should('contain.text', '1');
    });

    it('should remove items from cart', () => {
      // Add item to cart
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      
      // Open cart
      cy.get('[data-testid="cart-button"]').click();
      
      // Remove item
      cy.get('[data-testid="remove-item"]').click();
      
      // Check if cart is empty
      cy.get('[data-testid="empty-cart"]').should('be.visible');
    });

    it('should display correct totals with LKR adjustment', () => {
      // Add items to cart
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      cy.get('[data-testid="menu-item"]').eq(1).find('[data-testid="add-to-cart"]').click();
      
      // Open cart
      cy.get('[data-testid="cart-button"]').click();
      
      // Check if totals are displayed correctly
      cy.get('[data-testid="subtotal"]').should('be.visible');
      cy.get('[data-testid="lkr-adjustment"]').should('contain.text', '-5%');
      cy.get('[data-testid="tax"]').should('be.visible');
      cy.get('[data-testid="service-fee"]').should('be.visible');
      cy.get('[data-testid="total"]').should('be.visible');
    });
  });

  describe('Checkout Flow', () => {
    beforeEach(() => {
      // Add items to cart
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      
      // Open cart and proceed to checkout
      cy.get('[data-testid="cart-button"]').click();
      cy.get('[data-testid="proceed-checkout"]').click();
    });

    it('should complete dine-in checkout flow', () => {
      // Step 1: Fill guest details
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').type('Doe');
      cy.get('[data-testid="email"]').type('john@example.com');
      cy.get('[data-testid="phone"]').type('+94771234567');
      cy.get('[data-testid="next-button"]').click();
      
      // Step 2: Select dine-in
      cy.get('[data-testid="dine-in-option"]').click();
      cy.get('[data-testid="table-select"]').select('1');
      cy.get('[data-testid="next-button"]').click();
      
      // Step 3: Select payment method
      cy.get('[data-testid="cash-payment"]').click();
      cy.get('[data-testid="next-button"]').click();
      
      // Step 4: Review order
      cy.get('[data-testid="review-order"]').should('be.visible');
      cy.get('[data-testid="order-summary"]').should('contain.text', 'Jaffna Crab Curry');
      cy.get('[data-testid="guest-info"]').should('contain.text', 'John Doe');
      cy.get('[data-testid="order-details"]').should('contain.text', 'Dine-in');
      
      // Submit order
      cy.get('[data-testid="place-order"]').click();
      
      // Check if order completion dialog appears
      cy.get('[data-testid="order-complete"]', { timeout: 10000 }).should('be.visible');
    });

    it('should complete takeaway checkout flow', () => {
      // Step 1: Fill guest details
      cy.get('[data-testid="first-name"]').type('Jane');
      cy.get('[data-testid="last-name"]').type('Smith');
      cy.get('[data-testid="email"]').type('jane@example.com');
      cy.get('[data-testid="phone"]').type('+94771234568');
      cy.get('[data-testid="next-button"]').click();
      
      // Step 2: Select takeaway
      cy.get('[data-testid="takeaway-option"]').click();
      cy.get('[data-testid="pickup-time"]').select('30');
      cy.get('[data-testid="next-button"]').click();
      
      // Step 3: Select payment method
      cy.get('[data-testid="card-payment"]').click();
      cy.get('[data-testid="next-button"]').click();
      
      // Step 4: Review order
      cy.get('[data-testid="review-order"]').should('be.visible');
      cy.get('[data-testid="order-details"]').should('contain.text', 'Takeaway');
      cy.get('[data-testid="order-details"]').should('contain.text', '30 minutes');
      
      // Submit order
      cy.get('[data-testid="place-order"]').click();
      
      // Check if order completion dialog appears
      cy.get('[data-testid="order-complete"]', { timeout: 10000 }).should('be.visible');
    });

    it('should validate required fields', () => {
      // Try to proceed without filling required fields
      cy.get('[data-testid="next-button"]').click();
      
      // Check if validation errors appear
      cy.get('[data-testid="validation-error"]').should('be.visible');
      cy.get('[data-testid="validation-error"]').should('contain.text', 'First name is required');
      cy.get('[data-testid="validation-error"]').should('contain.text', 'Last name is required');
      cy.get('[data-testid="validation-error"]').should('contain.text', 'Email is required');
      cy.get('[data-testid="validation-error"]').should('contain.text', 'Phone number is required');
    });

    it('should validate email format', () => {
      // Fill in details with invalid email
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').type('Doe');
      cy.get('[data-testid="email"]').type('invalid-email');
      cy.get('[data-testid="phone"]').type('+94771234567');
      cy.get('[data-testid="next-button"]').click();
      
      // Check if email validation error appears
      cy.get('[data-testid="validation-error"]').should('contain.text', 'Please enter a valid email address');
    });

    it('should allow going back to previous steps', () => {
      // Fill step 1 and go to step 2
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').type('Doe');
      cy.get('[data-testid="email"]').type('john@example.com');
      cy.get('[data-testid="phone"]').type('+94771234567');
      cy.get('[data-testid="next-button"]').click();
      
      // Go back to step 1
      cy.get('[data-testid="previous-button"]').click();
      
      // Check if we're back to step 1
      cy.get('[data-testid="guest-details"]').should('be.visible');
      cy.get('[data-testid="first-name"]').should('have.value', 'John');
    });
  });

  describe('Order Tracking', () => {
    it('should display order tracking after completion', () => {
      // Complete a checkout flow
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      cy.get('[data-testid="cart-button"]').click();
      cy.get('[data-testid="proceed-checkout"]').click();
      
      // Fill checkout form
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').type('Doe');
      cy.get('[data-testid="email"]').type('john@example.com');
      cy.get('[data-testid="phone"]').type('+94771234567');
      cy.get('[data-testid="next-button"]').click();
      
      cy.get('[data-testid="dine-in-option"]').click();
      cy.get('[data-testid="table-select"]').select('1');
      cy.get('[data-testid="next-button"]').click();
      
      cy.get('[data-testid="cash-payment"]').click();
      cy.get('[data-testid="next-button"]').click();
      
      cy.get('[data-testid="place-order"]').click();
      
      // Check if order tracking is displayed
      cy.get('[data-testid="order-tracking"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="order-status"]').should('contain.text', 'Order Received');
      cy.get('[data-testid="order-timeline"]').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      // Set mobile viewport
      cy.viewport('iphone-x');
      
      // Check if menu items are displayed in mobile layout
      cy.get('[data-testid="menu-item"]').should('be.visible');
      
      // Check if cart button is accessible
      cy.get('[data-testid="cart-button"]').should('be.visible');
      
      // Test mobile checkout flow
      cy.get('[data-testid="menu-item"]').first().find('[data-testid="add-to-cart"]').click();
      cy.get('[data-testid="cart-button"]').click();
      cy.get('[data-testid="proceed-checkout"]').click();
      
      // Check if checkout form is mobile-friendly
      cy.get('[data-testid="guest-details"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls and return error
      cy.intercept('GET', '/api/food/menu', { statusCode: 500 }).as('getMenuError');
      
      // Reload the page
      cy.reload();
      
      // Check if error message is displayed
      cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain.text', 'Failed to load menu');
    });

    it('should handle empty menu gracefully', () => {
      // Intercept API calls and return empty array
      cy.intercept('GET', '/api/food/menu', { body: [] }).as('getEmptyMenu');
      
      // Reload the page
      cy.reload();
      
      // Check if empty state is displayed
      cy.get('[data-testid="empty-menu"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="empty-menu"]').should('contain.text', 'No menu items found');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Check if important elements have ARIA labels
      cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="cart-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="menu-item"]').first().should('have.attr', 'role');
    });

    it('should be keyboard navigable', () => {
      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Test tab navigation through menu items
      cy.get('[data-testid="menu-item"]').first().focus();
      cy.focused().should('have.attr', 'data-testid', 'menu-item');
    });
  });
});
