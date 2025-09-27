// Custom command for admin login
Cypress.Commands.add('adminLogin', () => {
  cy.visit('/admin/login')
  cy.get('[data-cy="email-input"]').type('admin@hotel.com')
  cy.get('[data-cy="password-input"]').type('admin123')
  cy.get('[data-cy="login-button"]').click()
  cy.url().should('include', '/admin/dashboard')
})

// Custom command for guest actions - updated API endpoint
Cypress.Commands.add('visitGuestMenu', () => {
  cy.visit('/menu')
  cy.intercept('GET', '**/api/food*').as('apiGetFoods')
  cy.wait('@apiGetFoods')
  cy.get('[data-cy="menu-container"]').should('be.visible')
})

// Custom command for creating test food item
Cypress.Commands.add('createTestFood', (foodData) => {
  cy.get('[data-cy="add-food-button"]').click()
  cy.get('[data-cy="food-name-input"]').type(foodData.name)
  cy.get('[data-cy="food-price-input"]').type(foodData.price.toString())
  cy.get('[data-cy="food-category-select"]').select(foodData.category)
  cy.get('[data-cy="food-description-textarea"]').type(foodData.description)
  if (foodData.image) {
    cy.get('[data-cy="food-image-input"]').selectFile(foodData.image)
  }
  cy.get('[data-cy="save-food-button"]').click()
})

// Custom command for API testing - updated endpoints
Cypress.Commands.add('apiRequest', (method, url, body = null) => {
  // Handle different possible API endpoints
  const apiUrl = url.startsWith('/food') ? url : `/food${url}`;
  
  return cy.request({
    method,
    url: `http://localhost:5000/api${apiUrl}`,
    body,
    headers: {
      'Content-Type': 'application/json'
    },
    failOnStatusCode: false
  })
})

// Custom command for waiting for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.wait(1000) // Allow for any animations
})
