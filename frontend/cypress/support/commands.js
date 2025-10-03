// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command for user login
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type(email)
    cy.get('[data-cy=password]').type(password)
    cy.get('[data-cy=login-button]').click()
    cy.url().should('not.include', '/login')
  })
})

// Custom command for admin login
Cypress.Commands.add('loginAdmin', () => {
  cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
})

// Custom command for user login
Cypress.Commands.add('loginUser', () => {
  cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASSWORD'))
})

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe()
  cy.checkA11y()
})

// Custom command to wait for API calls
Cypress.Commands.add('waitForAPI', (method, url) => {
  cy.intercept(method, url).as('apiCall')
  cy.wait('@apiCall')
})

// Custom command for Valdor food operations
Cypress.Commands.add('addFoodToCart', (foodName) => {
  cy.contains(foodName).parents('[data-cy=food-card]').within(() => {
    cy.get('[data-cy=add-to-cart]').click()
  })
})

Cypress.Commands.add('searchFoods', (query) => {
  cy.get('[data-cy=search-input]').type(query)
  cy.get('[data-cy=search-button]').click()
})

Cypress.Commands.add('filterByCategory', (category) => {
  cy.get('[data-cy=category-filter]').select(category)
})

Cypress.Commands.add('filterByDietary', (dietary) => {
  cy.get('[data-cy=dietary-filter]').select(dietary)
})

// Custom command to create test food (admin only)
Cypress.Commands.add('createTestFood', (foodData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/valdor/foods`,
    headers: {
      Authorization: `Bearer ${Cypress.env('ADMIN_TOKEN')}`
    },
    body: {
      name: foodData.name || 'Test Food',
      category: foodData.category || 'Lunch',
      description: foodData.description || 'Test food description',
      price: foodData.price || 25.99,
      preparationTimeMinutes: foodData.preparationTimeMinutes || 20,
      ingredients: foodData.ingredients || ['Test Ingredient'],
      allergens: foodData.allergens || [],
      dietaryTags: foodData.dietaryTags || ['Vegetarian'],
      seasonal: foodData.seasonal || false,
      isAvailable: foodData.isAvailable !== undefined ? foodData.isAvailable : true
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

// Custom command to clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  // This would clean up any test data created during tests
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/admin/cleanup-test-data`,
    headers: {
      Authorization: `Bearer ${Cypress.env('ADMIN_TOKEN')}`
    }
  })
})

// Custom command for AI menu extraction testing
Cypress.Commands.add('extractMenuFromURL', (url) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/valdor/extract-menu`,
    headers: {
      Authorization: `Bearer ${Cypress.env('ADMIN_TOKEN')}`
    },
    body: { url }
  }).then((response) => {
    expect(response.status).to.eq(200)
    return response.body.data
  })
})

// Custom command to verify food schema
Cypress.Commands.add('verifyFoodSchema', (food) => {
  expect(food).to.have.property('_id')
  expect(food).to.have.property('name').and.be.a('string')
  expect(food).to.have.property('category').and.be.oneOf(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'])
  expect(food).to.have.property('price').and.be.a('number').and.be.at.least(0)
  expect(food).to.have.property('ingredients').and.be.an('array')
  expect(food).to.have.property('allergens').and.be.an('array')
  expect(food).to.have.property('dietaryTags').and.be.an('array')
  expect(food).to.have.property('sentimentBreakdown').and.be.an('object')
  expect(food.sentimentBreakdown).to.have.property('positive').and.be.a('number')
  expect(food.sentimentBreakdown).to.have.property('neutral').and.be.a('number')
  expect(food.sentimentBreakdown).to.have.property('negative').and.be.a('number')
})
