// 📁 frontend/cypress/e2e/valdor-guest-flow.cy.js
describe('Valdor Guest User Flow - Complete E2E Test Suite', () => {
  beforeEach(() => {
    // Reset application state before each test
    cy.visit('/')
  })

  describe('5.1 Menu Browsing & Category Filters', () => {
    it('should load Valdor menu page and display seeded foods', () => {
      // Navigate to Valdor menu
      cy.visit('/valdor-menu')

      // Verify page loads
      cy.contains('🍛 Valdor Restaurant').should('be.visible')
      cy.contains('Authentic Sri Lankan Cuisine').should('be.visible')

      // Verify foods are displayed
      cy.get('[data-cy=food-card]').should('have.length.greaterThan', 0)

      // Verify category navigation
      cy.get('[data-cy=category-list]').should('be.visible')
      cy.contains('Lunch').should('be.visible')
      cy.contains('Snacks').should('be.visible')
      cy.contains('Beverage').should('be.visible')

      // Verify search functionality
      cy.get('[data-cy=search-input]').should('be.visible')
      cy.get('[data-cy=search-input]').type('Chicken')
      cy.get('[data-cy=food-card]').should('contain', 'Chicken')

      // Verify price format
      cy.get('[data-cy=food-card]').first().within(() => {
        cy.get('[data-cy=food-price]').should('match', /^LKR\s?\d+(\.\d{2})?$/)
      })
    })

    it('should filter foods by category', () => {
      cy.visit('/valdor-menu')

      // Filter by Lunch category
      cy.filterByCategory('Lunch')
      cy.wait(1000) // Wait for API response

      // Verify only Lunch items are shown
      cy.get('[data-cy=food-card]').each(($card) => {
        cy.wrap($card).should('contain', 'Lunch')
      })

      // Filter by Snacks
      cy.filterByCategory('Snacks')
      cy.wait(1000)

      cy.get('[data-cy=food-card]').each(($card) => {
        cy.wrap($card).should('contain', 'Snacks')
      })
    })

    it('should filter foods by dietary preferences', () => {
      cy.visit('/valdor-menu')

      // Filter by Vegetarian
      cy.filterByDietary('Vegetarian')
      cy.wait(1000)

      // Verify all visible foods have Vegetarian tag
      cy.get('[data-cy=food-card]').each(($card) => {
        cy.wrap($card).find('[data-cy=dietary-vegetarian]').should('exist')
      })
    })

    it('should search foods by name and ingredients', () => {
      cy.visit('/valdor-menu')

      // Search for rice dishes
      cy.searchFoods('Rice')
      cy.wait(1000)

      cy.get('[data-cy=food-card]').should('have.length.greaterThan', 0)
      cy.get('[data-cy=food-card]').each(($card) => {
        cy.wrap($card).should(($card) => {
          const text = $card.text().toLowerCase()
          expect(text).to.include('rice')
        })
      })
    })

    it('should handle pagination correctly', () => {
      cy.visit('/valdor-menu')

      // Check pagination elements
      cy.get('[data-cy=pagination]').should('exist')
      cy.get('[data-cy=page-info]').should('contain', 'Page 1')

      // Click next page if available
      cy.get('[data-cy=next-page]').then($btn => {
        if (!$btn.is(':disabled')) {
          cy.wrap($btn).click()
          cy.get('[data-cy=page-info]').should('contain', 'Page 2')
        }
      })
    })
  })

  describe('5.2 Food Detail Page & Enrichment', () => {
    it('should display detailed food information', () => {
      cy.visit('/valdor-menu')

      // Click on first food card
      cy.get('[data-cy=food-card]').first().click()

      // Verify detail page loads
      cy.url().should('include', '/food/')
      cy.get('[data-cy=food-detail]').should('be.visible')

      // Verify required elements
      cy.get('[data-cy=food-name]').should('be.visible')
      cy.get('[data-cy=food-description]').should('be.visible').and('have.length.greaterThan', 50) // Wikipedia enrichment
      cy.get('[data-cy=food-price]').should('match', /^LKR\s?\d+(\.\d{2})?$/)

      // Verify ingredients section
      cy.get('[data-cy=ingredients-list]').should('be.visible')
      cy.get('[data-cy=ingredients-list] li').should('have.length.greaterThan', 0)

      // Verify allergens if present
      cy.get('[data-cy=allergens-list]').should('exist')

      // Verify dietary tags
      cy.get('[data-cy=dietary-tags]').should('be.visible')

      // Verify preparation time
      cy.get('[data-cy=prep-time]').should('contain', 'minutes')

      // Verify image loads
      cy.get('[data-cy=food-image]').should('be.visible')
      cy.get('[data-cy=food-image]').should('have.attr', 'src').and('include', 'http')
    })

    it('should handle image loading errors gracefully', () => {
      cy.visit('/valdor-menu')

      // Intercept image requests and force 404
      cy.intercept('GET', '**/*.{jpg,jpeg,png,gif}', { statusCode: 404 })

      cy.get('[data-cy=food-card]').first().click()

      // Should show fallback image or icon
      cy.get('[data-cy=food-image-fallback]').should('be.visible')
    })
  })

  describe('5.3 Add to Cart, Customizations, Qty Change', () => {
    it('should add food to cart with quantity management', () => {
      cy.visit('/valdor-menu')

      // Select first food card
      cy.get('[data-cy=food-card]').first().within(() => {
        cy.get('[data-cy=food-name]').invoke('text').as('foodName')

        // Increase quantity to 2
        cy.get('[data-cy=qty-plus]').click()
        cy.get('[data-cy=quantity]').should('contain', '2')

        // Add to cart
        cy.get('[data-cy=add-to-cart]').click()
      })

      // Verify cart updates
      cy.get('[data-cy=cart-count]').should('contain', '2')

      // Navigate to cart
      cy.get('[data-cy=cart-link]').click()
      cy.url().should('include', '/cart')

      // Verify cart contents
      cy.get('[data-cy=cart-item]').should('have.length', 1)
      cy.get('[data-cy=cart-item]').within(() => {
        cy.get('[data-cy=cart-item-name]').should('exist')
        cy.get('[data-cy=cart-item-price]').should('match', /^LKR\s?\d+(\.\d{2})?$/)
        cy.get('[data-cy=cart-item-qty]').should('contain', '2')
        cy.get('[data-cy=cart-item-subtotal]').should('exist')
      })

      // Verify cart total
      cy.get('[data-cy=cart-total]').should('be.visible')
    })

    it('should handle customizations and options', () => {
      cy.visit('/valdor-menu')

      // Find a food with customizations (if available)
      cy.get('[data-cy=food-card]').contains('Lamprais').first().within(() => {
        cy.get('[data-cy=customization-options]').should('exist')
        cy.get('[data-cy=customization-extra]').first().check()
        cy.get('[data-cy=add-to-cart]').click()
      })

      // Verify customization appears in cart
      cy.get('[data-cy=cart-link]').click()
      cy.get('[data-cy=cart-item-customizations]').should('contain', 'Extra')
    })

    it('should update cart totals when quantity changes', () => {
      cy.visit('/valdor-menu')

      // Add item to cart
      cy.get('[data-cy=food-card]').first().within(() => {
        cy.get('[data-cy=add-to-cart]').click()
      })

      cy.get('[data-cy=cart-link]').click()

      // Get initial total
      cy.get('[data-cy=cart-total]').invoke('text').as('initialTotal')

      // Increase quantity
      cy.get('[data-cy=cart-item]').within(() => {
        cy.get('[data-cy=cart-qty-plus]').click()
        cy.get('[data-cy=cart-item-qty]').should('contain', '2')
      })

      // Verify total updated
      cy.get('[data-cy=cart-total]').invoke('text').should('not.eq', '@initialTotal')
    })
  })

  describe('5.4 Cart Persistence Across Reloads', () => {
    it('should persist cart contents after page reload', () => {
      cy.visit('/valdor-menu')

      // Add item to cart
      cy.addFoodToCart('Chicken Lamprais')

      // Verify cart has item
      cy.get('[data-cy=cart-count]').should('contain', '1')

      // Reload page
      cy.reload()

      // Verify cart still has item
      cy.get('[data-cy=cart-count]').should('contain', '1')

      cy.get('[data-cy=cart-link]').click()
      cy.get('[data-cy=cart-item]').should('have.length', 1)
      cy.get('[data-cy=cart-item-name]').should('contain', 'Chicken Lamprais')
    })
  })

  describe('5.5 Checkout + Place Order', () => {
    beforeEach(() => {
      // Login as test user
      cy.loginUser()
    })

    it('should complete full checkout flow', () => {
      cy.visit('/valdor-menu')

      // Add item to cart
      cy.addFoodToCart('Chicken Lamprais')

      // Go to cart and checkout
      cy.get('[data-cy=cart-link]').click()
      cy.get('[data-cy=checkout-button]').click()

      // Fill checkout form
      cy.get('[data-cy=checkout-name]').type('John Doe')
      cy.get('[data-cy=checkout-email]').type('john@example.com')
      cy.get('[data-cy=checkout-phone]').type('+1234567890')
      cy.get('[data-cy=checkout-address]').type('123 Main St, Colombo')

      // Select delivery method
      cy.get('[data-cy=delivery-method]').select('dine-in')

      // Select payment method
      cy.get('[data-cy=payment-method]').select('card')
      cy.get('[data-cy=card-number]').type('4111111111111111')
      cy.get('[data-cy=card-expiry]').type('12/25')
      cy.get('[data-cy=card-cvc]').type('123')

      // Place order
      cy.get('[data-cy=place-order]').click()

      // Verify order confirmation
      cy.get('[data-cy=order-success]').should('be.visible')
      cy.get('[data-cy=order-number]').should('exist')
      cy.get('[data-cy=order-total]').should('match', /^LKR\s?\d+(\.\d{2})?$/)

      // Verify order appears in order history
      cy.visit('/dashboard/orders')
      cy.get('[data-cy=order-history]').should('contain', 'Chicken Lamprais')
    })

    it('should validate required checkout fields', () => {
      cy.visit('/valdor-menu')
      cy.addFoodToCart('Chicken Lamprais')
      cy.get('[data-cy=cart-link]').click()
      cy.get('[data-cy=checkout-button]').click()

      // Try to place order without filling required fields
      cy.get('[data-cy=place-order]').click()

      // Should show validation errors
      cy.get('[data-cy=checkout-name-error]').should('be.visible')
      cy.get('[data-cy=checkout-email-error]').should('be.visible')
      cy.get('[data-cy=checkout-phone-error]').should('be.visible')
    })
  })

  describe('5.6 Order History & Review', () => {
    beforeEach(() => {
      cy.loginUser()
    })

    it('should display order history and allow reviews', () => {
      // Navigate to order history
      cy.visit('/dashboard/orders')

      // Should show order history
      cy.get('[data-cy=order-history]').should('exist')

      // Click on an order to view details
      cy.get('[data-cy=order-item]').first().click()

      // Verify order details
      cy.get('[data-cy=order-detail]').should('be.visible')
      cy.get('[data-cy=order-status]').should('exist')
      cy.get('[data-cy=order-items]').should('exist')

      // If order is delivered, allow review
      cy.get('[data-cy=order-status]').then($status => {
        if ($status.text().includes('Delivered')) {
          cy.get('[data-cy=write-review]').click()

          // Fill review form
          cy.get('[data-cy=review-rating]').select('5')
          cy.get('[data-cy=review-comment]').type('Excellent food and service!')
          cy.get('[data-cy=submit-review]').click()

          // Verify review submitted
          cy.get('[data-cy=review-success]').should('be.visible')
        }
      })
    })
  })

  describe('5.7 Edge Cases', () => {
    it('should handle unavailable food items gracefully', () => {
      // Create an unavailable food item via API
      cy.createTestFood({
        name: 'Unavailable Test Food',
        category: 'Lunch',
        price: 10,
        isAvailable: false
      }).then((food) => {
        cy.visit('/valdor-menu')

        // Should not show unavailable items
        cy.contains('Unavailable Test Food').should('not.exist')

        // Try to access via direct URL (if possible)
        cy.visit(`/food/${food._id}`)
        cy.get('[data-cy=food-unavailable]').should('be.visible')
        cy.get('[data-cy=add-to-cart]').should('be.disabled')
      })
    })

    it('should handle network errors gracefully', () => {
      // Intercept API calls and force failures
      cy.intercept('GET', '/api/valdor/foods', { statusCode: 500 })

      cy.visit('/valdor-menu')

      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible')
      cy.get('[data-cy=retry-button]').should('be.visible')

      // Click retry
      cy.get('[data-cy=retry-button]').click()

      // Should attempt to reload
      cy.get('[data-cy=food-card]').should('exist')
    })

    it('should handle empty search results', () => {
      cy.visit('/valdor-menu')

      // Search for non-existent item
      cy.searchFoods('xyz123nonexistent')

      // Should show no results message
      cy.get('[data-cy=no-results]').should('be.visible')
      cy.get('[data-cy=clear-search]').should('be.visible')
    })
  })
})
