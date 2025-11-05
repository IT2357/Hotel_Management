# 🧪 Testing Guide - Food System 2025

## 📋 Overview

This guide provides comprehensive testing instructions for the Jaffna Restaurant Food Ordering System. It covers backend API testing, frontend E2E testing, performance audits, and accessibility validation.

---

## 🔧 Backend API Testing

### Setup Thunder Client Collection

Import the provided `food-complete-api.json` collection into Thunder Client (VS Code extension) or use the manual test cases below.

### Test Cases

#### **TC-FO-001: Create Menu Item (Admin)**
**Endpoint**: `POST /api/food-complete/menu`  
**Auth**: Required (Admin role)  
**Request**:
```json
{
  "name_tamil": "நண்டு கறி",
  "name_english": "Jaffna Crab Curry",
  "description_tamil": "புதிய நண்டு, மசாலா, தேங்காய் பால்",
  "description_english": "Fresh crab cooked in aromatic spices with coconut milk",
  "price": 850,
  "category": "Seafood",
  "ingredients": ["Crab", "Coconut Milk", "Curry Leaves", "Chili", "Turmeric"],
  "mealTime": ["lunch", "dinner"],
  "prepTime": 30,
  "isVeg": false,
  "isSpicy": true,
  "isPopular": true,
  "isAvailable": true
}
```
**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "name_tamil": "நண்டு கறி",
    "name_english": "Jaffna Crab Curry",
    "price": 850,
    "isAvailable": true,
    "createdAt": "2025-10-18T10:00:00.000Z"
  },
  "message": "Menu item created successfully"
}
```

#### **TC-FO-002: List Menu Items with Pagination**
**Endpoint**: `GET /api/food-complete/menu?page=1&limit=10&search=crab`  
**Auth**: Public  
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "menuItems": [
      {
        "_id": "671234567890abcdef123456",
        "name_tamil": "நண்டு கறி",
        "name_english": "Jaffna Crab Curry",
        "price": 850,
        "category": { "name": "Seafood" },
        "isAvailable": true,
        "isVeg": false,
        "isSpicy": true,
        "isPopular": true
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

#### **TC-FO-003: Search Menu Items by Tamil Name**
**Endpoint**: `GET /api/food-complete/menu?search=நண்டு&searchLanguage=tamil`  
**Auth**: Public  
**Validation**: Should return items matching Tamil text  
**Expected**: At least 1 item with "நண்டு" in name_tamil or description_tamil

#### **TC-FO-004: Filter by Category and Dietary**
**Endpoint**: `GET /api/food-complete/menu?category=Seafood&isVeg=false&isSpicy=true`  
**Auth**: Public  
**Expected**: Only items matching all 3 filters (Seafood, non-veg, spicy)

#### **TC-FO-005: Update Menu Item (Partial Update)**
**Endpoint**: `PUT /api/food-complete/menu/:id`  
**Auth**: Required (Admin role)  
**Request**:
```json
{
  "price": 900,
  "isAvailable": false
}
```
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "name_english": "Jaffna Crab Curry",
    "price": 900,
    "isAvailable": false,
    "updatedAt": "2025-10-18T11:00:00.000Z"
  },
  "message": "Menu item updated successfully"
}
```

#### **TC-FO-006: Delete Menu Item (Soft Delete)**
**Endpoint**: `DELETE /api/food-complete/menu/:id`  
**Auth**: Required (Admin role)  
**Expected Response** (200):
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```
**Validation**: Item should have `isDeleted: true` in database but not appear in GET /menu

#### **TC-FO-007: Toggle Menu Item Availability**
**Endpoint**: `PATCH /api/food-complete/menu/:id/availability`  
**Auth**: Required (Admin role)  
**Request**:
```json
{
  "isAvailable": true
}
```
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "isAvailable": true
  },
  "message": "Availability updated successfully"
}
```

#### **TC-FO-008: Get Menu Stats (Admin Dashboard)**
**Endpoint**: `GET /api/food-complete/menu/stats/summary`  
**Auth**: Required (Admin role)  
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "totalItems": 22,
    "availableItems": 20,
    "unavailableItems": 2,
    "availablePercentage": 90.91,
    "vegItems": 8,
    "nonVegItems": 14,
    "spicyItems": 15,
    "popularItems": 10,
    "categories": {
      "Seafood": 5,
      "Curries": 8,
      "Rice": 4,
      "Breakfast": 3,
      "Desserts": 2
    }
  }
}
```

#### **TC-FO-009: AI Extract Menu from Image**
**Endpoint**: `POST /api/food-complete/ai/extract`  
**Auth**: Required (Admin role)  
**Request**: Multipart form-data with image file (max 10MB)  
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "menuItems": [
      {
        "name_tamil": "நண்டு கறி",
        "name_english": "Crab Curry",
        "price": 850,
        "ingredients": ["Crab", "Coconut Milk", "Spices"],
        "category": "Seafood",
        "confidence": 85
      }
    ],
    "rawText": "நண்டு கறி - Crab Curry\nRs. 850\n...",
    "ocrConfidence": 78,
    "language": "tam+eng"
  },
  "message": "Menu extracted successfully"
}
```
**Validation**: 
- `ocrConfidence` should be 50-100%
- `menuItems` array should have at least 1 item if text detected
- Tamil characters should render correctly

#### **TC-FO-010: Modify Order and Recalculate Discount**
**Endpoint**: `PATCH /api/food-complete/orders/:orderId/modify`  
**Auth**: Required (Order owner)  
**Request**:
```json
{
  "items": [
    {
      "menuItemId": "671234567890abcdef123456",
      "quantity": 2,
      "price": 850
    }
  ]
}
```
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order123",
      "items": [...],
      "subtotal": 1700,
      "jaffnaDiscount": 85,
      "total": 1615,
      "status": "pending"
    }
  },
  "message": "Order modified successfully"
}
```
**Validation**: `jaffnaDiscount` should be 5% of `subtotal`

#### **TC-FO-011: Cancel Order with Refund Percentage**
**Endpoint**: `POST /api/food-complete/orders/:orderId/cancel`  
**Auth**: Required (Order owner)  
**Request**:
```json
{
  "reason": "Changed my mind"
}
```
**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order123",
      "status": "cancelled",
      "refundAmount": 1615,
      "refundPercentage": 100
    }
  },
  "message": "Order cancelled successfully. Refund: 100%"
}
```
**Test Cases**:
- **Pending**: 100% refund
- **Confirmed**: 100% refund
- **Preparing**: 50% refund
- **Ready/Delivered**: 0% refund

#### **TC-FO-012: Create Review with Ratings**
**Endpoint**: `POST /api/food-complete/orders/reviews`  
**Auth**: Required  
**Request**:
```json
{
  "orderId": "order123",
  "menuItemId": "671234567890abcdef123456",
  "foodRating": 5,
  "serviceRating": 4,
  "comment": "Excellent crab curry! Very authentic Jaffna taste.",
  "photos": ["https://cloudinary.com/photo1.jpg"]
}
```
**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "review123",
    "orderId": "order123",
    "menuItemId": "671234567890abcdef123456",
    "foodRating": 5,
    "serviceRating": 4,
    "overallRating": 4.5,
    "comment": "Excellent crab curry! Very authentic Jaffna taste.",
    "createdAt": "2025-10-18T12:00:00.000Z"
  },
  "message": "Review created successfully"
}
```

---

## 🌐 Frontend E2E Testing (Cypress)

### Setup Instructions

1. **Install Cypress**:
   ```bash
   cd frontend
   npm install -D cypress
   ```

2. **Initialize Cypress**:
   ```bash
   npx cypress open
   ```

3. **Create Test Spec**:
   Create `cypress/e2e/food-complete.cy.js` with the test cases below.

### Test Scenarios

#### **E2E-001: Browse Menu as Guest**
```javascript
describe('Menu Browsing', () => {
  it('should display 22 Jaffna dishes on menu page', () => {
    cy.visit('/food-complete/menu');
    cy.get('[data-testid="menu-item-card"]').should('have.length.at.least', 10);
    cy.contains('Jaffna Crab Curry').should('be.visible');
  });

  it('should show bilingual Tamil/English names', () => {
    cy.visit('/food-complete/menu');
    cy.contains('நண்டு கறி').should('be.visible');
    cy.contains('Jaffna Crab Curry').should('be.visible');
  });
});
```

#### **E2E-002: Search Menu by Tamil Name**
```javascript
it('should search menu items by Tamil text', () => {
  cy.visit('/food-complete/menu');
  cy.get('[data-testid="search-input"]').type('நண்டு');
  cy.wait(600); // Wait for debounce
  cy.get('[data-testid="menu-item-card"]').should('contain', 'நண்டு கறி');
});
```

#### **E2E-003: Filter by Dietary Tags**
```javascript
it('should filter vegetarian items with green badges', () => {
  cy.visit('/food-complete/menu');
  cy.get('[data-testid="filter-veg"]').click();
  cy.get('[data-testid="menu-item-card"]').each(($card) => {
    cy.wrap($card).find('[data-testid="veg-badge"]').should('be.visible');
  });
});
```

#### **E2E-004: Add Items to Cart**
```javascript
it('should add 3 items to cart and persist in localStorage', () => {
  cy.visit('/food-complete/menu');
  cy.get('[data-testid="add-to-cart-btn"]').first().click();
  cy.get('[data-testid="add-to-cart-btn"]').eq(1).click();
  cy.get('[data-testid="add-to-cart-btn"]').eq(2).click();
  
  cy.get('[data-testid="cart-count"]').should('contain', '3');
  
  // Verify localStorage
  cy.window().then((win) => {
    const cart = JSON.parse(win.localStorage.getItem('jaffna_cart_2025'));
    expect(cart).to.have.length(3);
  });
});
```

#### **E2E-005: Checkout Flow - 3 Steps**
```javascript
it('should complete 3-step checkout: Cart → Details → Payment', () => {
  // Step 1: Cart Review
  cy.visit('/food-complete/menu');
  cy.get('[data-testid="add-to-cart-btn"]').first().click();
  cy.get('[data-testid="cart-icon"]').click();
  cy.get('[data-testid="checkout-modal"]').should('be.visible');
  cy.get('[data-testid="order-type-dine-in"]').click();
  cy.get('[data-testid="continue-btn"]').click();

  // Step 2: Guest Details
  cy.get('[data-testid="guest-name"]').type('John Doe');
  cy.get('[data-testid="guest-email"]').type('john@example.com');
  cy.get('[data-testid="guest-phone"]').type('0771234567');
  cy.get('[data-testid="room-number"]').type('301');
  cy.get('[data-testid="continue-btn"]').click();

  // Step 3: Payment
  cy.get('[data-testid="payment-summary"]').should('contain', 'Subtotal');
  cy.get('[data-testid="jaffna-discount"]').should('contain', '-5%');
  cy.get('[data-testid="place-order-btn"]').should('be.visible');
});
```

#### **E2E-006: Modify Order Quantity**
```javascript
it('should modify order quantity and recalculate discount', () => {
  cy.visit('/food-complete/menu');
  cy.get('[data-testid="add-to-cart-btn"]').first().click();
  cy.get('[data-testid="cart-icon"]').click();
  
  // Initial total
  cy.get('[data-testid="cart-total"]').invoke('text').then((initialTotal) => {
    // Increase quantity
    cy.get('[data-testid="increase-qty-btn"]').click();
    
    // Verify total increased
    cy.get('[data-testid="cart-total"]').invoke('text').should('not.eq', initialTotal);
    
    // Verify 5% discount applied
    cy.get('[data-testid="discount-amount"]').should('contain', '5%');
  });
});
```

#### **E2E-007: Submit Review with Star Ratings**
```javascript
it('should submit review with foodRating and serviceRating', () => {
  cy.login(); // Custom command for authentication
  cy.visit('/orders/order123'); // Order details page
  
  cy.get('[data-testid="write-review-btn"]').click();
  cy.get('[data-testid="food-rating-5"]').click();
  cy.get('[data-testid="service-rating-4"]').click();
  cy.get('[data-testid="review-comment"]').type('Excellent crab curry!');
  cy.get('[data-testid="submit-review-btn"]').click();
  
  cy.contains('Review submitted successfully').should('be.visible');
});
```

#### **E2E-008: Admin CRUD Operations**
```javascript
describe('Admin Menu Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/food/menu');
  });

  it('should create new menu item with bilingual fields', () => {
    cy.get('[data-testid="add-item-btn"]').click();
    cy.get('[data-testid="name-tamil"]').type('புதிய உணவு');
    cy.get('[data-testid="name-english"]').type('New Dish');
    cy.get('[data-testid="price"]').type('500');
    cy.get('[data-testid="category-dropdown"]').select('Curries');
    cy.get('[data-testid="veg-checkbox"]').check();
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.contains('Menu item created successfully').should('be.visible');
  });

  it('should update existing menu item', () => {
    cy.get('[data-testid="edit-btn"]').first().click();
    cy.get('[data-testid="price"]').clear().type('600');
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.contains('Menu item updated successfully').should('be.visible');
  });

  it('should delete menu item with confirmation', () => {
    cy.get('[data-testid="delete-btn"]').first().click();
    cy.get('[data-testid="confirm-delete-btn"]').click();
    
    cy.contains('Menu item deleted successfully').should('be.visible');
  });

  it('should toggle availability inline', () => {
    cy.get('[data-testid="availability-toggle"]').first().click();
    cy.contains('Availability updated').should('be.visible');
  });
});
```

#### **E2E-009: AI Menu Extraction Workflow**
```javascript
it('should extract menu items from uploaded image', () => {
  cy.loginAsAdmin();
  cy.visit('/admin/food/ai-uploader');
  
  // Upload image
  cy.get('[data-testid="file-dropzone"]').attachFile('jaffna-menu.jpg');
  cy.get('[data-testid="extract-btn"]').click();
  
  // Wait for OCR processing
  cy.get('[data-testid="progress-bar"]', { timeout: 30000 }).should('not.exist');
  
  // Verify results
  cy.get('[data-testid="extracted-items-table"]').should('be.visible');
  cy.get('[data-testid="confidence-score"]').should('exist');
  cy.get('[data-testid="overall-accuracy"]').invoke('text').then((accuracy) => {
    expect(parseInt(accuracy)).to.be.greaterThan(50);
  });
});
```

#### **E2E-010: Bulk Save Extracted Items**
```javascript
it('should bulk save all extracted items to database', () => {
  cy.loginAsAdmin();
  cy.visit('/admin/food/ai-uploader');
  
  // Upload and extract
  cy.get('[data-testid="file-dropzone"]').attachFile('jaffna-menu.jpg');
  cy.get('[data-testid="extract-btn"]').click();
  cy.get('[data-testid="progress-bar"]', { timeout: 30000 }).should('not.exist');
  
  // Assign categories to all items
  cy.get('[data-testid="category-dropdown"]').each(($dropdown) => {
    cy.wrap($dropdown).select('Curries');
  });
  
  // Bulk save
  cy.get('[data-testid="save-all-btn"]').click();
  cy.contains('All items saved successfully', { timeout: 10000 }).should('be.visible');
});
```

---

## 📊 Performance Testing (Lighthouse)

### Setup Instructions

1. **Install Lighthouse CLI**:
   ```bash
   npm install -g lighthouse
   ```

2. **Run Audits**:
   ```bash
   # MenuPage2025
   lighthouse http://localhost:5173/food-complete/menu --output html --output-path ./reports/menu-audit.html

   # Admin Menu Panel
   lighthouse http://localhost:5173/admin/food/menu --output html --output-path ./reports/admin-audit.html

   # AI Uploader
   lighthouse http://localhost:5173/admin/food/ai-uploader --output html --output-path ./reports/ai-audit.html
   ```

### Target Scores (>90 for all metrics)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|------------|---------------|----------------|-----|
| MenuPage2025 | >90 | >90 | >90 | >90 |
| AdminMenuPanel | >85 | >90 | >90 | N/A |
| AIMenuUploader | >85 | >90 | >90 | N/A |

### Common Issues & Fixes

- **Performance <90**: Optimize images (use WebP), lazy load components, code split
- **Accessibility <90**: Add ARIA labels, ensure keyboard navigation, check color contrast
- **Best Practices <90**: Use HTTPS, remove console.logs, update dependencies
- **SEO <90**: Add meta descriptions, use semantic HTML, ensure mobile-friendly

---

## 📱 Mobile Responsive Testing

### Breakpoints to Test

| Device | Width | Test Cases |
|--------|-------|------------|
| iPhone SE | 320px | Menu grid → 1 column, search bar full width, filters in sidebar |
| iPhone 12 | 390px | Menu grid → 1 column, cart checkout modal full screen |
| iPad Mini | 768px | Menu grid → 2 columns, admin table scrollable |
| iPad Pro | 1024px | Menu grid → 3 columns, admin table 9 columns visible |
| Desktop | 1920px | Menu grid → 4 columns, all admin features visible |

### Chrome DevTools Testing

1. Open Chrome DevTools (`Cmd+Option+I`)
2. Toggle device toolbar (`Cmd+Shift+M`)
3. Select device preset or enter custom dimensions
4. Test touch interactions (tap, swipe)
5. Verify no horizontal scrolling
6. Check that text remains readable (min 16px)

### Checklist

- [ ] Menu items display in correct grid (1/2/3/4 columns)
- [ ] Search bar is accessible on mobile (no overlap)
- [ ] Dietary filter pills wrap correctly
- [ ] Cart checkout modal is scrollable on small screens
- [ ] Admin table has horizontal scroll on mobile
- [ ] All buttons are at least 44×44px (tap target size)
- [ ] Tamil text renders correctly at all sizes
- [ ] Images scale proportionally without distortion

---

## ♿ Accessibility Testing

### Keyboard Navigation

Test the following keyboard shortcuts:

| Key | Action | Expected Behavior |
|-----|--------|-------------------|
| Tab | Navigate forward | Highlights next interactive element |
| Shift+Tab | Navigate backward | Highlights previous interactive element |
| Enter | Activate button/link | Performs action (add to cart, submit form) |
| Space | Toggle checkbox/radio | Checks/unchecks dietary filters |
| Escape | Close modal | Closes cart checkout or edit modal |
| Arrow Keys | Navigate carousel | Moves through upsell items |

### Screen Reader Testing (VoiceOver on macOS)

1. Enable VoiceOver: `Cmd+F5`
2. Navigate to MenuPage2025: `http://localhost:5173/food-complete/menu`
3. Verify announcements:
   - "நண்டு கறி, Jaffna Crab Curry, button, Add to Cart"
   - "Vegetarian, badge"
   - "Price: 850 rupees, discounted from 895"
4. Test form labels:
   - Guest name input: "Name, required, text field"
   - Email input: "Email, required, text field"

### ARIA Attributes Checklist

- [ ] All interactive elements have `aria-label` or `aria-labelledby`
- [ ] Form inputs have associated `<label>` elements
- [ ] Loading states use `aria-busy="true"`
- [ ] Modals have `role="dialog"` and `aria-modal="true"`
- [ ] Tabs/steppers use `role="tablist"` and `aria-selected`
- [ ] Alerts use `role="alert"` or `aria-live="polite"`

---

## 🌐 Tamil Character Rendering

### Browser Compatibility

Test Tamil Unicode rendering across:

| Browser | Version | Test Case |
|---------|---------|-----------|
| Chrome | Latest | Display "நண்டு கறி" without boxes/squares |
| Firefox | Latest | Verify Tamil font loads correctly |
| Safari | Latest | Check line height and spacing |
| Edge | Latest | Ensure no character overlap |

### Font Stack Verification

Check that the following CSS is applied:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Noto Sans Tamil', 'Lohit Tamil', sans-serif;
```

### Tamil Text Test Cases

- [ ] நண்டு கறி (Crab Curry)
- [ ] புதிய நண்டு, மசாலா, தேங்காய் பால் (Fresh crab, spices, coconut milk)
- [ ] காலை உணவு (Breakfast)
- [ ] சைவ உணவு (Vegetarian food)
- [ ] காரமான (Spicy)

---

## 🔧 Thunder Client API Collection

### Import Collection

1. Open VS Code
2. Install Thunder Client extension
3. Import `food-complete-api.json` (created below)

### Collection JSON

Create `food-complete-api.json`:

```json
{
  "client": "Thunder Client",
  "collectionName": "Food Complete API",
  "dateExported": "2025-10-18",
  "version": "1.0",
  "folders": [
    {
      "name": "Menu CRUD",
      "requests": [
        {
          "name": "Create Menu Item",
          "method": "POST",
          "url": "{{baseUrl}}/api/food-complete/menu",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{adminToken}}"
            }
          ],
          "body": {
            "type": "json",
            "raw": "{\n  \"name_tamil\": \"நண்டு கறி\",\n  \"name_english\": \"Jaffna Crab Curry\",\n  \"price\": 850,\n  \"category\": \"Seafood\",\n  \"isVeg\": false,\n  \"isSpicy\": true\n}"
          }
        },
        {
          "name": "List Menu Items",
          "method": "GET",
          "url": "{{baseUrl}}/api/food-complete/menu?page=1&limit=10"
        },
        {
          "name": "Get Menu Item by ID",
          "method": "GET",
          "url": "{{baseUrl}}/api/food-complete/menu/{{menuItemId}}"
        },
        {
          "name": "Update Menu Item",
          "method": "PUT",
          "url": "{{baseUrl}}/api/food-complete/menu/{{menuItemId}}",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{adminToken}}"
            }
          ],
          "body": {
            "type": "json",
            "raw": "{\n  \"price\": 900,\n  \"isAvailable\": false\n}"
          }
        },
        {
          "name": "Delete Menu Item",
          "method": "DELETE",
          "url": "{{baseUrl}}/api/food-complete/menu/{{menuItemId}}",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{adminToken}}"
            }
          ]
        },
        {
          "name": "Toggle Availability",
          "method": "PATCH",
          "url": "{{baseUrl}}/api/food-complete/menu/{{menuItemId}}/availability",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{adminToken}}"
            }
          ],
          "body": {
            "type": "json",
            "raw": "{\n  \"isAvailable\": true\n}"
          }
        },
        {
          "name": "Get Menu Stats",
          "method": "GET",
          "url": "{{baseUrl}}/api/food-complete/menu/stats/summary",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{adminToken}}"
            }
          ]
        }
      ]
    },
    {
      "name": "AI Extraction",
      "requests": [
        {
          "name": "Extract Menu from Image",
          "method": "POST",
          "url": "{{baseUrl}}/api/food-complete/ai/extract",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{adminToken}}"
            }
          ],
          "body": {
            "type": "formdata",
            "formdata": [
              {
                "name": "image",
                "type": "file",
                "value": "path/to/jaffna-menu.jpg"
              }
            ]
          }
        },
        {
          "name": "Get Supported Languages",
          "method": "GET",
          "url": "{{baseUrl}}/api/food-complete/ai/supported-languages"
        }
      ]
    },
    {
      "name": "Order Management",
      "requests": [
        {
          "name": "Modify Order",
          "method": "PATCH",
          "url": "{{baseUrl}}/api/food-complete/orders/{{orderId}}/modify",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{userToken}}"
            }
          ],
          "body": {
            "type": "json",
            "raw": "{\n  \"items\": [\n    {\n      \"menuItemId\": \"{{menuItemId}}\",\n      \"quantity\": 2,\n      \"price\": 850\n    }\n  ]\n}"
          }
        },
        {
          "name": "Cancel Order",
          "method": "POST",
          "url": "{{baseUrl}}/api/food-complete/orders/{{orderId}}/cancel",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{userToken}}"
            }
          ],
          "body": {
            "type": "json",
            "raw": "{\n  \"reason\": \"Changed my mind\"\n}"
          }
        },
        {
          "name": "Create Review",
          "method": "POST",
          "url": "{{baseUrl}}/api/food-complete/orders/reviews",
          "headers": [
            {
              "name": "Authorization",
              "value": "Bearer {{userToken}}"
            }
          ],
          "body": {
            "type": "json",
            "raw": "{\n  \"orderId\": \"{{orderId}}\",\n  \"menuItemId\": \"{{menuItemId}}\",\n  \"foodRating\": 5,\n  \"serviceRating\": 4,\n  \"comment\": \"Excellent!\"\n}"
          }
        },
        {
          "name": "Get Menu Item Reviews",
          "method": "GET",
          "url": "{{baseUrl}}/api/food-complete/orders/reviews/menu/{{menuItemId}}"
        }
      ]
    }
  ],
  "environments": [
    {
      "name": "Development",
      "variables": [
        {
          "name": "baseUrl",
          "value": "http://localhost:5000"
        },
        {
          "name": "adminToken",
          "value": "your_admin_jwt_token_here"
        },
        {
          "name": "userToken",
          "value": "your_user_jwt_token_here"
        },
        {
          "name": "menuItemId",
          "value": "671234567890abcdef123456"
        },
        {
          "name": "orderId",
          "value": "order123"
        }
      ]
    }
  ]
}
```

---

## ✅ Testing Checklist Summary

### Backend (12 test cases)
- [ ] TC-FO-001: Create menu item (Admin)
- [ ] TC-FO-002: List menu items with pagination
- [ ] TC-FO-003: Search by Tamil name
- [ ] TC-FO-004: Filter by category & dietary
- [ ] TC-FO-005: Update menu item (partial)
- [ ] TC-FO-006: Delete menu item (soft delete)
- [ ] TC-FO-007: Toggle availability
- [ ] TC-FO-008: Get menu stats
- [ ] TC-FO-009: AI extract menu from image
- [ ] TC-FO-010: Modify order & recalculate discount
- [ ] TC-FO-011: Cancel order with refund %
- [ ] TC-FO-012: Create review with ratings

### Frontend (10 test cases)
- [ ] E2E-001: Browse menu as guest
- [ ] E2E-002: Search by Tamil name
- [ ] E2E-003: Filter by dietary tags
- [ ] E2E-004: Add items to cart (localStorage)
- [ ] E2E-005: 3-step checkout flow
- [ ] E2E-006: Modify order quantity
- [ ] E2E-007: Submit review with stars
- [ ] E2E-008: Admin CRUD operations
- [ ] E2E-009: AI menu extraction workflow
- [ ] E2E-010: Bulk save extracted items

### Performance & Accessibility
- [ ] Lighthouse audit: MenuPage2025 (>90 all metrics)
- [ ] Lighthouse audit: AdminMenuPanel (>85 performance)
- [ ] Lighthouse audit: AIMenuUploader (>85 performance)
- [ ] Mobile responsive: 320px, 768px, 1024px, 1920px
- [ ] Tamil character rendering: Chrome, Firefox, Safari
- [ ] Keyboard navigation: Tab, Enter, Escape
- [ ] Screen reader: VoiceOver announcements

---

## 📝 Test Execution Log

Create a log file to track test results:

```markdown
# Test Execution Log - Food System 2025

**Date**: October 18, 2025  
**Tester**: [Your Name]  
**Environment**: Development (http://localhost:5000)

| Test ID | Status | Notes | Screenshot |
|---------|--------|-------|------------|
| TC-FO-001 | ✅ Pass | Created item successfully | [link] |
| TC-FO-002 | ✅ Pass | Pagination works correctly | [link] |
| TC-FO-003 | ❌ Fail | Tamil search needs fix | [link] |
| ... | ... | ... | ... |

**Summary**:
- Total Tests: 32
- Passed: 30
- Failed: 2
- Skipped: 0
- Pass Rate: 93.75%
```

---

## 🚀 Next Steps

After completing all tests:

1. **Document Results**: Fill test execution log
2. **Fix Failing Tests**: Create GitHub issues for failures
3. **Update README**: Add testing instructions
4. **Create PR**: Include testing report in PR description
5. **Deploy to Staging**: Run smoke tests in staging environment

---

**Last Updated**: October 18, 2025  
**Version**: 1.0
