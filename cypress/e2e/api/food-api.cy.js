
describe('Food API Tests', () => {
  let authToken

  before(() => {
    // Get auth token for API requests
    cy.apiRequest('POST', '/auth/login', {
      email: 'admin@hotel.com',
      password: 'admin123'
    }).then((response) => {
      authToken = response.body.token
    })
  })

  it('should get all food items', () => {
    cy.apiRequest('GET', '/foods').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('foods')
      expect(response.body.foods).to.be.an('array')
    })
  })

  it('should create new food item', () => {
    cy.fixture('food-data').then((data) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.config('baseUrl')}/api/foods`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: data.testFood
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('food')
        expect(response.body.food.name).to.eq(data.testFood.name)
      })
    })
  })

  it('should get food item by ID', () => {
    cy.apiRequest('GET', '/foods').then((response) => {
      const foodId = response.body.foods[0]._id
      
      cy.apiRequest('GET', `/foods/${foodId}`).then((detailResponse) => {
        expect(detailResponse.status).to.eq(200)
        expect(detailResponse.body.food._id).to.eq(foodId)
      })
    })
  })

  it('should update food item', () => {
    cy.apiRequest('GET', '/foods').then((response) => {
      const foodId = response.body.foods[0]._id
      const updateData = {
        name: 'Updated Food Name',
        price: 29.99
      }
      
      cy.request({
        method: 'PUT',
        url: `${Cypress.config('baseUrl')}/api/foods/${foodId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: updateData
      }).then((updateResponse) => {
        expect(updateResponse.status).to.eq(200)
        expect(updateResponse.body.food.name).to.eq(updateData.name)
        expect(updateResponse.body.food.price).to.eq(updateData.price)
      })
    })
  })

  it('should delete food item', () => {
    // Create item first
    cy.request({
      method: 'POST',
      url: `${Cypress.config('baseUrl')}/api/foods`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        name: 'To Delete',
        price: 10.00,
        category: 'Test'
      }
    }).then((createResponse) => {
      const foodId = createResponse.body.food._id
      
      // Delete the item
      cy.request({
        method: 'DELETE',
        url: `${Cypress.config('baseUrl')}/api/foods/${foodId}`,
        headers: { Authorization: `Bearer ${authToken}` }
      }).then((deleteResponse) => {
        expect(deleteResponse.status).to.eq(200)
      })
    })
  })

  it('should filter foods by category', () => {
    cy.apiRequest('GET', '/foods?category=Main Course').then((response) => {
      expect(response.status).to.eq(200)
      response.body.foods.forEach((food) => {
        expect(food.category).to.eq('Main Course')
      })
    })
  })

  it('should search foods by name', () => {
    const searchTerm = 'burger'
    cy.apiRequest('GET', `/foods?search=${searchTerm}`).then((response) => {
      expect(response.status).to.eq(200)
      response.body.foods.forEach((food) => {
        expect(food.name.toLowerCase()).to.include(searchTerm)
      })
    })
  })

  it('should handle invalid food ID', () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.config('baseUrl')}/api/foods/invalid-id`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('error')
    })
  })

  it('should validate required fields', () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.config('baseUrl')}/api/foods`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {},
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('errors')
    })
  })
})