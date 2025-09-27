describe('Admin Food Management', () => {
  beforeEach(() => {
    cy.adminLogin()
    cy.visit('/admin/food-management')
    cy.waitForPageLoad()
  })

  it('should display food management dashboard', () => {
    cy.get('[data-cy="food-management-title"]').should('contain', 'Food Management')
    cy.get('[data-cy="add-food-button"]').should('be.visible')
    cy.get('[data-cy="food-list-table"]').should('be.visible')
    cy.get('[data-cy="search-food-input"]').should('be.visible')
  })

  it('should create new food item', () => {
    cy.fixture('food-data').then((data) => {
      cy.createTestFood(data.testFood)
      cy.wait('@apiPost')
      
      cy.get('[data-cy="success-notification"]').should('be.visible')
      cy.get('[data-cy="success-notification"]').should('contain', 'Food item created successfully')
      
      // Verify item appears in list
      cy.get('[data-cy="food-list-table"]').should('contain', data.testFood.name)
    })
  })

  it('should edit existing food item', () => {
    // Click edit button on first item
    cy.get('[data-cy="food-item-row"]').first().within(() => {
      cy.get('[data-cy="edit-food-button"]').click()
    })
    
    // Edit food details
    cy.get('[data-cy="food-name-input"]').clear().type('Updated Food Name')
    cy.get('[data-cy="food-price-input"]').clear().type('25.99')
    cy.get('[data-cy="save-food-button"]').click()
    cy.wait('@apiPut')
    
    cy.get('[data-cy="success-notification"]').should('contain', 'Food item updated successfully')
  })

  it('should delete food item', () => {
    // Click delete button on first item
    cy.get('[data-cy="food-item-row"]').first().within(() => {
      cy.get('[data-cy="delete-food-button"]').click()
    })
    
    // Confirm deletion
    cy.get('[data-cy="confirm-delete-modal"]').should('be.visible')
    cy.get('[data-cy="confirm-delete-button"]').click()
    cy.wait('@apiDelete')
    
    cy.get('[data-cy="success-notification"]').should('contain', 'Food item deleted successfully')
  })

  it('should toggle food availability', () => {
    cy.get('[data-cy="food-item-row"]').first().within(() => {
      cy.get('[data-cy="availability-toggle"]').click()
    })
    cy.wait('@apiPut')
    
    cy.get('[data-cy="success-notification"]').should('contain', 'Availability updated')
  })

  it('should search and filter food items', () => {
    const searchTerm = 'burger'
    cy.get('[data-cy="search-food-input"]').type(searchTerm)
    cy.get('[data-cy="search-button"]').click()
    cy.wait('@apiGet')
    
    cy.get('[data-cy="food-item-row"]').each(($row) => {
      cy.wrap($row).should('contain', searchTerm)
    })
  })

  it('should bulk delete food items', () => {
    // Select multiple items
    cy.get('[data-cy="food-item-checkbox"]').eq(0).check()
    cy.get('[data-cy="food-item-checkbox"]').eq(1).check()
    
    // Bulk delete
    cy.get('[data-cy="bulk-delete-button"]').click()
    cy.get('[data-cy="confirm-bulk-delete-button"]').click()
    cy.wait('@apiDelete')
    
    cy.get('[data-cy="success-notification"]').should('contain', 'Items deleted successfully')
  })

  it('should export food data', () => {
    cy.get('[data-cy="export-button"]').click()
    cy.get('[data-cy="export-format-select"]').select('CSV')
    cy.get('[data-cy="confirm-export-button"]').click()
    
    // Verify download
    cy.readFile('cypress/downloads/food-data.csv').should('exist')
  })

  it('should validate form inputs', () => {
    cy.get('[data-cy="add-food-button"]').click()
    
    // Try to save without required fields
    cy.get('[data-cy="save-food-button"]').click()
    
    cy.get('[data-cy="name-error"]').should('contain', 'Name is required')
    cy.get('[data-cy="price-error"]').should('contain', 'Price is required')
    cy.get('[data-cy="category-error"]').should('contain', 'Category is required')
  })
})
