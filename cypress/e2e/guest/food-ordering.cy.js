describe('Guest Food Ordering', () => {
  beforeEach(() => {
    cy.visitGuestMenu()
  })

  it('should add food item to cart', () => {
    cy.get('[data-cy="food-item"]').first().within(() => {
      cy.get('[data-cy="add-to-cart-button"]').click()
    })
    
    cy.get('[data-cy="cart-notification"]').should('be.visible')
    cy.get('[data-cy="cart-notification"]').should('contain', 'Item added to cart')
    cy.get('[data-cy="cart-counter"]').should('contain', '1')
  })

  it('should update quantity in cart', () => {
    // Add item to cart
    cy.get('[data-cy="food-item"]').first().within(() => {
      cy.get('[data-cy="add-to-cart-button"]').click()
    })
    
    // Open cart
    cy.get('[data-cy="cart-icon"]').click()
    cy.get('[data-cy="cart-modal"]').should('be.visible')
    
    // Increase quantity
    cy.get('[data-cy="quantity-increase"]').click()
    cy.get('[data-cy="item-quantity"]').should('contain', '2')
    
    // Decrease quantity
    cy.get('[data-cy="quantity-decrease"]').click()
    cy.get('[data-cy="item-quantity"]').should('contain', '1')
  })

  it('should remove item from cart', () => {
    // Add item to cart
    cy.get('[data-cy="food-item"]').first().within(() => {
      cy.get('[data-cy="add-to-cart-button"]').click()
    })
    
    // Open cart and remove item
    cy.get('[data-cy="cart-icon"]').click()
    cy.get('[data-cy="remove-item-button"]').click()
    
    cy.get('[data-cy="empty-cart-message"]').should('be.visible')
    cy.get('[data-cy="cart-counter"]').should('contain', '0')
  })

  it('should calculate total price correctly', () => {
    let totalPrice = 0
    
    // Add multiple items to cart
    cy.get('[data-cy="food-item"]').each(($item, index) => {
      if (index < 3) { // Add first 3 items
        cy.wrap($item).within(() => {
          cy.get('[data-cy="food-price"]').invoke('text').then((priceText) => {
            const price = parseFloat(priceText.replace('$', ''))
            totalPrice += price
          })
          cy.get('[data-cy="add-to-cart-button"]').click()
        })
      }
    }).then(() => {
      cy.get('[data-cy="cart-icon"]').click()
      cy.get('[data-cy="cart-total"]').should('contain', `$${totalPrice.toFixed(2)}`)
    })
  })

  it('should proceed to checkout', () => {
    // Add item to cart
    cy.get('[data-cy="food-item"]').first().within(() => {
      cy.get('[data-cy="add-to-cart-button"]').click()
    })
    
    // Open cart and proceed to checkout
    cy.get('[data-cy="cart-icon"]').click()
    cy.get('[data-cy="checkout-button"]').click()
    
    cy.url().should('include', '/checkout')
    cy.get('[data-cy="checkout-form"]').should('be.visible')
  })

  it('should complete order process', () => {
    // Add item to cart
    cy.get('[data-cy="food-item"]').first().within(() => {
      cy.get('[data-cy="add-to-cart-button"]').click()
    })
    
    // Proceed to checkout
    cy.get('[data-cy="cart-icon"]').click()
    cy.get('[data-cy="checkout-button"]').click()
    
    // Fill checkout form
    cy.get('[data-cy="customer-name"]').type('John Doe')
    cy.get('[data-cy="customer-phone"]').type('123-456-7890')
    cy.get('[data-cy="customer-room"]').type('101')
    cy.get('[data-cy="special-instructions"]').type('Extra sauce please')
    
    // Submit order
    cy.get('[data-cy="place-order-button"]').click()
    cy.wait('@apiPost')
    
    cy.get('[data-cy="order-success-message"]').should('be.visible')
    cy.get('[data-cy="order-number"]').should('be.visible')
  })
})
