describe('Guest Menu Viewing', () => {
  beforeEach(() => {
    // Intercept the correct API endpoint
    cy.intercept('GET', 'http://localhost:5000/api/food').as('getFoods')
    cy.visit('/menu')
    cy.wait('@getFoods')
  })

  it('should display menu page correctly', () => {
    cy.get('[data-cy="menu-title"]').should('contain', 'Our Delicious Menu')
    cy.get('[data-cy="menu-container"]').should('be.visible')
  })

  it('should load and display food items from backend', () => {
    cy.get('[data-cy="food-item"]').should('have.length.greaterThan', 0)
    
    // Check first food item structure
    cy.get('[data-cy="food-item"]').first().within(() => {
      cy.get('[data-cy="food-name"]').should('be.visible')
      cy.get('[data-cy="food-price"]').should('be.visible')
      cy.get('[data-cy="food-description"]').should('be.visible')
      cy.get('[data-cy="food-image"]').should('be.visible')
    })
  })

  it('should filter menu by category', () => {
    // Wait for categories to load
    cy.get('.category-pill').should('have.length.greaterThan', 1)
    
    // Click on a category (not 'All Categories')
    cy.get('.category-pill').not('.active').first().click()
    
    // Verify filtered results
    cy.get('[data-cy="food-item"]').should('exist')
  })

  it('should search for food items', () => {
    const searchTerm = 'chicken'
    cy.get('[data-cy="search-input"]').type(searchTerm)
    
    // Search should filter automatically as you type
    cy.get('[data-cy="food-item"]').each(($item) => {
      cy.wrap($item).should('contain.text', searchTerm)
    })
  })

  it('should display food item details in modal', () => {
    cy.get('[data-cy="food-item"]').first().click()
    
    cy.get('[data-cy="food-modal"]').should('be.visible')
    cy.get('[data-cy="modal-food-name"]').should('be.visible')
    cy.get('[data-cy="modal-food-price"]').should('be.visible')
    cy.get('[data-cy="modal-food-description"]').should('be.visible')
    cy.get('[data-cy="modal-food-ingredients"]').should('be.visible')
    cy.get('[data-cy="modal-close-button"]').should('be.visible')
    
    // Close modal
    cy.get('[data-cy="modal-close-button"]').click()
    cy.get('[data-cy="food-modal"]').should('not.exist')
  })

  it('should handle empty menu state', () => {
    cy.intercept('GET', 'http://localhost:5000/api/food', { fixture: 'empty-menu.json' }).as('emptyMenu')
    cy.reload()
    cy.wait('@emptyMenu')
    
    cy.get('[data-cy="empty-menu-message"]').should('be.visible')
    cy.get('[data-cy="empty-menu-message"]').should('contain', 'No menu items available')
  })

  it('should be responsive on mobile devices', () => {
    cy.viewport('iphone-6')
    cy.waitForPageLoad()
    
    cy.get('[data-cy="menu-container"]').should('be.visible')
    cy.get('[data-cy="mobile-menu-grid"]').should('have.class', 'mobile-layout')
    cy.get('[data-cy="category-filter"]').should('be.visible')
  })
})
