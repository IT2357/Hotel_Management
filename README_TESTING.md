# Hotel Management System - Testing Guide

## Overview
Comprehensive E2E testing suite for the Hotel Management System's food management functionality, covering both guest and admin interfaces.

## Test Structure

### Guest Tests
- **Menu Viewing**: Display, filtering, searching, responsive design
- **Food Ordering**: Cart management, checkout process, order completion

### Admin Tests
- **Food Management**: CRUD operations, bulk actions, validation
- **AI Menu Extractor**: Image processing, item extraction, confidence scoring

### API Tests
- **Food Endpoints**: All CRUD operations, filtering, error handling
- **Authentication**: Token-based auth testing

## Running Tests

### Prerequisites
```bash
npm install
npm install --save-dev cypress
```

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Suites
```bash
# Guest functionality
npm run test:guest

# Admin functionality  
npm run test:admin

# API endpoints
npm run test:api

# Interactive mode
npm run test:e2e:open
```

## Test Data
- `cypress/fixtures/food-data.json` - Sample food items
- `cypress/fixtures/ai-extraction-result.json` - Mock AI responses
- `cypress/fixtures/empty-menu.json` - Empty state testing

## Custom Commands
- `cy.adminLogin()` - Admin authentication
- `cy.visitGuestMenu()` - Navigate to guest menu
- `cy.createTestFood(data)` - Create food item
- `cy.apiRequest(method, url, body)` - API testing

## Test Coverage

### Guest Interface
✅ Menu display and layout
✅ Category filtering
✅ Search functionality
✅ Food item details
✅ Cart management
✅ Order process
✅ Responsive design

### Admin Interface
✅ Food CRUD operations
✅ Bulk actions
✅ Form validation
✅ AI menu extraction
✅ Image processing
✅ Confidence scoring
✅ Batch processing

### API Endpoints
✅ GET /api/foods
✅ POST /api/foods
✅ PUT /api/foods/:id
✅ DELETE /api/foods/:id
✅ Search and filtering
✅ Error handling
✅ Authentication

## CI/CD Integration
Tests can be integrated into CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cypress-io/github-action@v5
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
```

## Best Practices
1. Use data-cy attributes for reliable element selection
2. Mock API responses for consistent testing
3. Test both happy path and error scenarios
4. Include accessibility testing
5. Verify responsive design
6. Test with realistic data volumes

## Debugging
- Screenshots and videos saved in `cypress/screenshots` and `cypress/videos`
- Use `cy.debug()` to pause execution
- Browser dev tools available in interactive mode
