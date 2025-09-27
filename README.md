# 🏨 Hotel Management System with AI-Powered Food Ordering

A comprehensive MERN-based solution designed to streamline hotel operations with role-based access, scalable architecture, modern development tools, and advanced AI-powered food management capabilities.

---

## ⚙️ How to Use

Follow these steps to get the project up and running on your local machine:

### 0. Open Terminal from Project Folder

```bash
cd hotel_management
```

### 1. Install Root Dependencies

```bash
npm install
```

### 2. Install Subfolder Dependencies

```bash
npm run install-all
```

### 3. Start Development Mode

```bash
npm run dev
```

---

## 🚀 Push All Local Git Branches to Remote

Use this script to push all your local branches to the remote repository:

```bash
for branch in $(git branch | sed 's/* //'); do
  git push origin $branch
done
```

---

## 🗂️ Project Folder Structure

Below is a high-level overview of the project layout:

```
hotel-management-system/
├── backend/
│   ├── config/             # Database, cloud, Redis configs
│   ├── controllers/        # Modular controllers (auth, rooms, food, etc.)
│   ├── models/             # Database schemas and profiles
│   ├── routes/             # API route definitions
│   ├── middleware/         # Validation, authentication, error handling
│   ├── services/           # Business logic and 3rd-party integrations
│   ├── utils/              # Common utility functions
│   ├── tests/              # Unit, integration, and test data
│   ├── uploads/            # Static file uploads (images, docs, etc.)
│   ├── docs/               # API and deployment documentation
│   ├── .env, .gitignore, package.json, server.js, app.js
│
├── frontend/
│   ├── public/             # Public HTML and manifest
│   ├── src/
│   │   ├── components/     # All UI components (auth, booking, rooms, etc.)
│   │   ├── pages/          # Static and dynamic pages
│   │   ├── context/        # React contexts for global state
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API call handlers
│   │   ├── utils/          # Client-side utilities
│   │   ├── styles/         # CSS & theming
│   │   ├── assets/         # Fonts, icons, and images
│   │   └── App.jsx, index.js, etc.
│   ├── .env, .gitignore, package.json
│
├── shared/
│   ├── constants/          # Shared roles, statuses, validation config
│   ├── types/              # Shared data models
│   └── utils/              # Reusable utility methods
│
├── docs/                   # General documentation and screenshots
├── scripts/                # Seed, migrate, and backup scripts
├── docker-compose.yml
└── README.md
```

---

## 🧩 Key Features of This Structure

### ✅ Backend Highlights
- Modular controller structure with focus on scalability
- Middleware layers for validation, roles, and rate-limiting
- External service integrations (payment, notifications, analytics)
- Clean separation of concerns using services and utils

### 🎨 Frontend Highlights
- Role-specific dashboards for guests, staff, managers, and admins
- Reusable UI components and custom hooks
- Organized by feature and screen for easy scaling

### 🔗 Shared Resources
- DRY code using shared constants and utilities
- Type-based models to maintain consistency
- Easy-to-read formatting and expandable documentation

### 🧪 Development Toolkit
- Integrated unit and integration tests
- Environment configuration examples
- Deployment scripts and Docker support

---

## 🛠 Requirements

Make sure these are installed:

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) (v8+)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) *(optional)*

---

## 📬 Need Help?

If you encounter any issues:

- 📩 Open an issue on the GitHub repo

---

## 💡 License

This project is released under the MIT License.

---

## 🍽️ Food Management System Features

### **Complete Food Ordering Workflow**
- **Guest Menu Browsing**: Professional restaurant-style interface with advanced filtering
- **Shopping Cart**: Persistent cart with quantity management and special instructions
- **Order Management**: Complete workflow from browsing to checkout with real-time updates
- **Admin Dashboard**: Full CRUD operations for menu items, categories, and orders

### **AI-Powered Menu Extraction**
- **Multi-Input Support**: Upload images, provide URLs, or specify file paths
- **OCR Integration**: Google Vision API (primary) and Tesseract.js (fallback)
- **Smart Parsing**: Automatic categorization and price extraction
- **Interactive Review**: Edit extracted data before importing to menu database

### **Professional UI/UX Design**
- **Modern Interface**: Dribbble-inspired design with gradient backgrounds
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Framer Motion**: Smooth animations and micro-interactions
- **Dark Theme**: Professional restaurant aesthetic with purple/pink gradients

---

## 🚀 API Endpoints

### **Food Menu Management**
```
GET    /api/food/menu/items          # Get all menu items (public)
GET    /api/food/menu/items/:id      # Get single menu item (public)
GET    /api/food/menu/categories     # Get all categories (public)
POST   /api/food/menu/items          # Create menu item (admin)
PUT    /api/food/menu/items/:id      # Update menu item (admin)
DELETE /api/food/menu/items/:id      # Delete menu item (admin)
POST   /api/food/menu/batch          # Batch create items (admin)
```

### **AI Menu Extraction**
```
POST   /api/uploadMenu/upload        # Extract menu from image/URL/path
GET    /api/uploadMenu/              # List extracted menus
GET    /api/uploadMenu/:id           # Get single extracted menu
PUT    /api/uploadMenu/:id           # Update extracted menu
DELETE /api/uploadMenu/:id           # Delete extracted menu
```

### **Order Management**
```
POST   /api/orders/customer          # Create customer order
GET    /api/orders/customer/:email   # Get customer orders
GET    /api/orders/admin             # Get all orders (admin)
PUT    /api/orders/:id/status        # Update order status (admin)
```

---

## 🔧 Environment Configuration

Create `.env` files in both backend and frontend directories:

### **Backend (.env)**
```env
# Required
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel_management
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Optional - AI Services
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
OPENAI_API_KEY=your-openai-api-key

# Optional - Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Hotel Management System
```

---

## 🛠️ Installation & Setup

### **1. Clone Repository**
```bash
git clone <repository-url>
cd Hotel_Management
```

### **2. Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### **4. Database Setup**
```bash
# Start MongoDB (if using local installation)
mongod

# Or use MongoDB Atlas cloud database
# Update MONGODB_URI in backend/.env
```

---

## 🎯 Usage Guide

### **For Administrators**

1. **Menu Management**
   - Navigate to `/admin/food/menu`
   - Add, edit, or delete menu items
   - Manage categories and pricing
   - Upload images and set dietary tags

2. **AI Menu Extraction**
   - Go to `/admin/menu-upload`
   - Upload menu images or provide URLs
   - Review and edit extracted data
   - Import to main menu database

3. **Order Management**
   - Monitor incoming orders in real-time
   - Update order status and manage kitchen workflow
   - View order analytics and reports

### **For Guests**

1. **Browse Menu**
   - Visit `/menu` for restaurant-style browsing
   - Filter by dietary preferences and categories
   - Search for specific items

2. **Place Orders**
   - Add items to cart with quantity selection
   - Proceed to checkout with customer details
   - Choose order type (dine-in/takeaway)
   - Complete payment and receive confirmation

3. **Track Orders**
   - View order history at `/dashboard/my-orders`
   - Check order status and estimated time
   - Leave reviews and ratings

---

## 🔍 Troubleshooting

### **Common Issues**

#### **Backend Not Starting**
```bash
# Check if MongoDB is running
mongod --version

# Check environment variables
cat backend/.env

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **Frontend Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .next package-lock.json
npm install

# Check API connection
curl http://localhost:5000/health
```

#### **AI Menu Extraction Not Working**
- Ensure Google Cloud credentials are properly configured
- Check if Tesseract.js is installed as fallback
- Verify image file formats (JPG, PNG, WEBP, GIF)
- Check file size limits (max 15MB)

#### **Database Connection Issues**
- Verify MongoDB URI format
- Check network connectivity
- Ensure database user has proper permissions
- Test connection with MongoDB Compass

---

## 📊 System Architecture

### **Backend Structure**
```
backend/
├── controllers/
│   ├── food/
│   │   └── menuController.js      # Menu CRUD operations
│   ├── menuExtractionController.js # AI extraction logic
│   └── auth/                      # Authentication
├── models/
│   ├── MenuItem.js                # Menu item schema
│   ├── Category.js                # Category schema
│   ├── Menu.js                    # Extracted menu schema
│   └── Order.js                   # Order schema
├── services/
│   ├── ocrService.js              # OCR processing
│   ├── imageStorageService.js     # Image management
│   └── htmlParser.js              # Web scraping
└── middleware/
    ├── auth.js                    # JWT authentication
    ├── upload.js                  # File upload handling
    └── validation.js              # Input validation
```

### **Frontend Structure**
```
frontend/src/
├── pages/
│   ├── admin/
│   │   └── food/
│   │       └── orders/
│   │           └── menu/
│   │               └── FoodMenuManagementPage.jsx
│   ├── menu/                      # Public menu pages
│   └── dashboard/                 # User dashboards
├── components/
│   ├── ui/                        # Reusable UI components
│   └── forms/                     # Form components
├── services/
│   ├── api.js                     # Axios configuration
│   ├── foodService.js             # Food API calls
│   └── menuExtractionService.js   # AI extraction API
└── context/
    ├── AuthContext.jsx            # Authentication state
    └── CartContext.jsx            # Shopping cart state
```

---

## 🚀 Deployment

### **Production Deployment**

1. **Backend Deployment**
```bash
# Build for production
npm run build

# Set production environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb+srv://...

# Start production server
npm start
```

2. **Frontend Deployment**
```bash
# Build for production
npm run build

# Serve static files
npm run preview
```

3. **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

---

## 🧪 Testing

### **Run Tests**
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

### **API Testing**
```bash
# Test menu endpoints
curl -X GET http://localhost:5000/api/food/menu/items

# Test AI extraction
curl -X POST http://localhost:5000/api/uploadMenu/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@menu.jpg"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🧪 Comprehensive Testing Plan - Valdor Restaurant System

This section provides a complete, step-by-step test plan for the Valdor restaurant ordering system, covering manual testing, automated testing, CI/CD, and quality assurance processes.

### 📋 Test Accounts
- **Admin**: admin@example.com / AdminPass123!
- **User**: user@example.com / UserPass123!

### 🧪 Test Environment Setup

#### 1. Prerequisites
```bash
# Install testing dependencies
cd backend && npm install --save-dev jest supertest mongodb-memory-server
cd ../frontend && npm install --save-dev cypress cypress-axe axe-core

# Start MongoDB for testing
docker run -d --name valdor-mongo-test -p 27017:27017 mongo:6

# Seed test data
cd backend && npm run seed:db
```

#### 2. Start Test Environment
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: Run tests
cd backend && npm run test:all
cd frontend && npm run test:e2e
```

### 🧪 1) SMOKE CHECKS (Quick Sanity Tests)

**Objective**: Ensure core functionality works before detailed testing.

| Test Case | Steps | Expected Result | Status |
|-----------|-------|----------------|--------|
| **Health Check** | `curl http://localhost:5000/health` | Returns `{"success":true,"message":"Server health check"}` | ✅ |
| **Menu API** | `curl http://localhost:5000/api/valdor/foods` | Returns JSON array of menu items | ✅ |
| **Frontend Load** | Visit `http://localhost:5173/valdor-menu` | Valdor menu page loads with food items | ✅ |
| **Database** | MongoDB Compass shows `foods` collection with seeded data | 22+ Valdor menu items | ✅ |

### 🧪 2) GUEST USER FLOW - MANUAL & AUTOMATED E2E

#### **5.1 Menu Browsing & Category Filters**
```bash
# Manual Test Steps:
1. Navigate to http://localhost:5173/valdor-menu
2. Verify "🍛 Valdor Restaurant" header appears
3. Check category navigation (Breakfast, Lunch, Dinner, Snacks, Beverage, Dessert)
4. Verify food cards display with images, names, prices (format: LKR XXX)
5. Test search functionality
6. Test category filtering
7. Test dietary filtering (Vegetarian, Non-Vegetarian, Spicy)

# Automated Test (Cypress):
describe('Menu Browsing', () => {
  it('displays Valdor menu with categories', () => {
    cy.visit('/valdor-menu')
    cy.contains('🍛 Valdor Restaurant').should('be.visible')
    cy.get('[data-cy=food-card]').should('have.length.greaterThan', 0)
    cy.get('[data-cy=category-list]').should('contain', 'Lunch')
  })
})
```

#### **5.2 Food Detail Page & Enrichment**
```bash
# Manual Test:
1. Click any food card (e.g., "Chicken Lamprais")
2. Verify detail page loads
3. Check: name, price, description (>50 chars with Wikipedia enrichment)
4. Verify ingredients list, allergens, dietary tags
5. Test image loading with fallback
6. Check preparation time display

# Automated Verification:
cy.get('[data-cy=food-description]').should('have.length.greaterThan', 50)
cy.get('[data-cy=ingredients-list]').should('exist')
cy.get('[data-cy=food-image]').should('be.visible')
```

#### **5.3 Add to Cart, Customizations, Qty Change**
```bash
# Manual Test:
1. On menu page, select food item
2. Increase quantity using +/- buttons
3. Add to cart
4. Navigate to cart page
5. Verify cart contents, quantities, totals
6. Test quantity changes in cart
7. Verify total updates correctly

# Automated Test:
cy.addFoodToCart('Chicken Lamprais')
cy.get('[data-cy=cart-count]').should('contain', '1')
cy.get('[data-cy=cart-link]').click()
cy.get('[data-cy=cart-total]').should('be.visible')
```

#### **5.4 Cart Persistence Across Reloads**
```bash
# Manual Test:
1. Add items to cart
2. Refresh page
3. Verify cart contents persist
4. Check localStorage contains cart data

# Automated Test:
cy.addFoodToCart('Chicken Lamprais')
cy.reload()
cy.get('[data-cy=cart-count]').should('contain', '1')
```

#### **5.5 Checkout + Place Order**
```bash
# Manual Test (requires authentication):
1. Login as user@example.com
2. Add items to cart
3. Click checkout
4. Fill customer details (name, email, phone, address)
5. Select order type (dine-in/takeaway)
6. Choose payment method (card/cash)
7. Complete order
8. Verify order confirmation with order ID

# Automated Test:
cy.loginUser()
cy.addFoodToCart('Chicken Lamprais')
cy.get('[data-cy=checkout-button]').click()
cy.get('[data-cy=checkout-form]').within(() => {
  cy.get('[data-cy=name]').type('John Doe')
  cy.get('[data-cy=email]').type('john@test.com')
  cy.get('[data-cy=phone]').type('+1234567890')
  cy.get('[data-cy=place-order]').click()
})
cy.get('[data-cy=order-success]').should('be.visible')
```

#### **5.6 Order History & Review**
```bash
# Manual Test:
1. Login as user
2. Navigate to /dashboard/orders
3. View order history
4. Click on order to see details
5. If order status is "Delivered", leave a review
6. Verify review saves and displays

# Automated Test:
cy.loginUser()
cy.visit('/dashboard/orders')
cy.get('[data-cy=order-history]').should('exist')
cy.get('[data-cy=order-item]').first().click()
cy.get('[data-cy=order-detail]').should('be.visible')
```

#### **5.7 Edge Cases**
```bash
# Test unavailable items:
cy.createTestFood({ name: 'Unavailable Item', isAvailable: false })
cy.visit('/valdor-menu')
cy.contains('Unavailable Item').should('not.exist')

# Test network failures:
cy.intercept('GET', '/api/valdor/foods', { statusCode: 500 })
cy.visit('/valdor-menu')
cy.get('[data-cy=error-message]').should('be.visible')

# Test empty search:
cy.searchFoods('nonexistentitem123')
cy.get('[data-cy=no-results]').should('be.visible')
```

### 🧪 3) ADMIN USER FLOW - MANUAL & AUTOMATED

#### **6.1 Admin Login & Auth**
```bash
# Manual Test:
1. Visit /admin
2. Login with admin@example.com / AdminPass123!
3. Verify dashboard loads with stats
4. Try accessing admin routes with user token (should fail)

# Automated Test:
cy.loginAdmin()
cy.url().should('include', '/admin')
cy.get('[data-cy=admin-dashboard]').should('be.visible')
```

#### **6.2 Menu Management - CRUD Operations**
```bash
# Manual Test - Add Food:
1. Navigate to /admin/food-menu
2. Click "Add Food"
3. Fill form: name, category, description, price, ingredients, allergens
4. Upload image
5. Submit
6. Verify new item appears in admin list and guest menu

# Manual Test - Edit Food:
1. Click edit on existing item
2. Change price and description
3. Save
4. Verify changes reflect immediately

# Manual Test - Delete Food:
1. Click delete on item
2. Confirm deletion
3. Verify item removed from admin list and guest menu

# Automated Test:
cy.loginAdmin()
cy.visit('/admin/food-menu')
cy.get('[data-cy=add-food]').click()
cy.get('[data-cy=food-form]').within(() => {
  cy.get('[data-cy=name]').type('Test Admin Food')
  cy.get('[data-cy=category]').select('Lunch')
  cy.get('[data-cy=price]').type('25.99')
  cy.get('[data-cy=submit]').click()
})
cy.contains('Test Admin Food').should('be.visible')
```

#### **6.3 AI Menu Extraction**
```bash
# Manual Test - URL Extraction:
1. Go to /admin/menu-upload
2. Select "URL" tab
3. Enter: https://valampuri.foodorders.lk/
4. Click "Extract"
5. Wait for AI processing
6. Review extracted items
7. Edit if needed
8. Save to menu

# Manual Test - Image Upload:
1. Select "Upload" tab
2. Upload menu image (JPG/PNG)
3. Click "Extract"
4. Review OCR results vs visual recognition
5. Verify corrections applied
6. Save items

# Automated Test:
cy.loginAdmin()
cy.visit('/admin/menu-upload')
cy.get('[data-cy=url-input]').type('https://valampuri.foodorders.lk/')
cy.get('[data-cy=extract-btn]').click()
cy.get('[data-cy=extraction-results]', { timeout: 30000 }).should('be.visible')
cy.get('[data-cy=save-extracted]').click()
cy.get('[data-cy=success-message]').should('contain', 'Successfully saved')
```

#### **6.4 Order Management**
```bash
# Manual Test:
1. Login as admin
2. Visit /admin/orders
3. View order list
4. Click on order to see details
5. Change status: Pending → Preparing → Out for delivery → Delivered
6. Verify status updates in real-time

# Automated Test:
cy.loginAdmin()
cy.visit('/admin/orders')
cy.get('[data-cy=order-list]').should('exist')
cy.get('[data-cy=order-item]').first().click()
cy.get('[data-cy=order-status]').select('Preparing')
cy.get('[data-cy=update-status]').click()
cy.get('[data-cy=status-updated]').should('be.visible')
```

### 🧪 4) API & INTEGRATION TESTS

#### **7.1 Authentication Tests**
```javascript
// backend/tests/integration/auth.test.js
describe('Authentication API', () => {
  test('POST /api/auth/register returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
  })

  test('POST /api/auth/login returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('admin')
  })
})
```

#### **7.2 Valdor Foods API Tests**
```javascript
// backend/tests/integration/valdor-foods.test.js
describe('Valdor Foods API', () => {
  let adminToken

  beforeAll(async () => {
    adminToken = global.testUtils.generateAdminToken()
  })

  test('GET /api/valdor/foods returns seeded items', async () => {
    const res = await request(app).get('/api/valdor/foods')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.foods)).toBe(true)
    expect(res.body.data.foods.length).toBeGreaterThan(0)
  })

  test('POST /api/valdor/foods creates item (admin only)', async () => {
    const newFood = {
      name: 'Test Food',
      category: 'Lunch',
      price: 25.99,
      description: 'Test food item',
      ingredients: ['Test ingredient'],
      allergens: [],
      dietaryTags: ['Vegetarian']
    }

    const res = await request(app)
      .post('/api/valdor/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newFood)

    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Test Food')
    expect(res.body.data.sentimentBreakdown).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    })
  })

  test('Food schema validation', async () => {
    const foods = await Food.find().limit(1)
    const food = foods[0]

    // Verify exact schema compliance
    expect(food).toHaveProperty('_id')
    expect(food).toHaveProperty('name').and.be.a('string')
    expect(food).toHaveProperty('category').and.be.oneOf(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'])
    expect(food).toHaveProperty('price').and.be.a('number').and.be.at.least(0)
    expect(food).toHaveProperty('ingredients').and.be.an('array')
    expect(food).toHaveProperty('allergens').and.be.an('array')
    expect(food).toHaveProperty('dietaryTags').and.be.an('array')
    expect(food).toHaveProperty('sentimentBreakdown').and.be.an('object')
  })
})
```

#### **7.3 AI Extractor API Tests**
```javascript
// backend/tests/integration/ai-extractor.test.js
describe('AI Menu Extractor API', () => {
  let adminToken

  beforeAll(async () => {
    adminToken = global.testUtils.generateAdminToken()
  })

  test('POST /api/valdor/extract-menu with URL', async () => {
    const res = await request(app)
      .post('/api/valdor/extract-menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ url: 'https://valampuri.foodorders.lk/' })

    expect(res.status).toBe(200)
    expect(res.body.data.extractedItems).toBeGreaterThan(0)
    expect(res.body.data.extractionMethod).toBeDefined()
    expect(res.body.data.confidence).toBeDefined()
  }, 60000)

  test('POST /api/valdor/scrape-website', async () => {
    const res = await request(app)
      .post('/api/valdor/scrape-website')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalScraped).toBeGreaterThan(0)
    expect(res.body.data.newItems).toBeGreaterThanOrEqual(0)
  }, 60000)
})
```

### 🧪 5) AI EXTRACTOR SPECIAL TESTS

#### **Test A: OCR Mismatch Correction**
```javascript
describe('OCR Mismatch Correction', () => {
  test('Idiyappam labeled as Burger gets corrected', async () => {
    // Create test image with Idiyappam but OCR text "Burger"
    const extractor = new AIMenuExtractor()

    // Mock OCR to return "Burger"
    jest.spyOn(extractor, 'performOCR').mockResolvedValue({
      text: 'Burger - Rs. 150',
      confidence: 80
    })

    // Mock vision analysis to identify Idiyappam
    jest.spyOn(extractor, 'performVisionAnalysis').mockResolvedValue({
      description: 'A traditional Sri Lankan food item called Idiyappam, made from rice flour',
      confidence: 95
    })

    const result = await extractor.extractFromImage('/path/to/idiyappam_image.jpg')

    expect(result.corrections).toContainEqual({
      original: 'Burger',
      corrected: 'Idiyappam'
    })
    expect(result.confidence).toBeLessThan(100) // Should be reduced due to correction
  })
})
```

### 🧪 6) UNIT TESTS (Jest)

#### **Schema Validation Tests**
```javascript
// backend/tests/unit/models/food.model.test.js
describe('Food Model Schema Validation', () => {
  test('validates required fields', () => {
    const invalidFood = new Food({})
    const validationError = invalidFood.validateSync()

    expect(validationError.errors.name).toBeDefined()
    expect(validationError.errors.price).toBeDefined()
    expect(validationError.errors.category).toBeDefined()
  })

  test('validates category enum', () => {
    const invalidCategory = new Food({
      name: 'Test',
      category: 'InvalidCategory',
      price: 10
    })

    const validationError = invalidCategory.validateSync()
    expect(validationError.errors.category).toBeDefined()
  })

  test('validates price is non-negative', () => {
    const negativePrice = new Food({
      name: 'Test',
      category: 'Lunch',
      price: -10
    })

    const validationError = negativePrice.validateSync()
    expect(validationError.errors.price).toBeDefined()
  })

  test('provides default sentimentBreakdown', () => {
    const food = new Food({
      name: 'Test',
      category: 'Lunch',
      price: 25
    })

    expect(food.sentimentBreakdown).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    })
  })
})
```

### 🧪 7) ACCESSIBILITY & PERFORMANCE TESTS

#### **Accessibility Tests**
```bash
# Install lighthouse
npm install -g lighthouse

# Run accessibility audit
lighthouse http://localhost:5173/valdor-menu --output=json --output-path=./accessibility-results.json

# Check results
cat accessibility-results.json | jq '.categories.accessibility.score'
```

#### **Performance Tests**
```javascript
// cypress/e2e/performance.cy.js
describe('Performance Tests', () => {
  it('menu page loads within 3 seconds', () => {
    const startTime = Date.now()
    cy.visit('/valdor-menu')
    cy.get('[data-cy=food-card]').should('be.visible').then(() => {
      const loadTime = Date.now() - startTime
      expect(loadTime).to.be.lessThan(3000) // 3 seconds
    })
  })

  it('images load and are properly sized', () => {
    cy.visit('/valdor-menu')
    cy.get('[data-cy=food-image]').each(($img) => {
      // Check if image loads
      cy.wrap($img).should('be.visible')
      // Check file size (should be < 150KB for thumbnails)
      cy.request($img.attr('src')).then((response) => {
        expect(response.headers['content-length']).to.be.lessThan(150000)
      })
    })
  })
})
```

### 🧪 8) CI/CD PIPELINE

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install backend deps
      working-directory: ./backend
      run: npm ci

    - name: Install frontend deps
      working-directory: ./frontend
      run: npm ci

    - name: Seed test DB
      working-directory: ./backend
      run: npm run seed:db
      env:
        MONGODB_URI: mongodb://localhost:27017/valdor_test

    - name: Run unit tests
      working-directory: ./backend
      run: npm run test:unit

    - name: Run integration tests
      working-directory: ./backend
      run: npm run test:integration

    - name: Start backend
      working-directory: ./backend
      run: npm run dev &
      env:
        NODE_ENV: test

    - name: Build frontend
      working-directory: ./frontend
      run: npm run build

    - name: Start frontend
      working-directory: ./frontend
      run: npm run preview &
      env:
        CYPRESS_BASE_URL: http://localhost:4173

    - name: Run E2E tests
      working-directory: ./frontend
      run: npm run test:e2e

    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results-${{ matrix.node-version }}
        path: |
          backend/coverage/
          frontend/cypress/screenshots/
          frontend/cypress/videos/

  accessibility:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20.x

    - name: Install deps
      working-directory: ./frontend
      run: npm ci

    - name: Build for accessibility
      working-directory: ./frontend
      run: npm run build

    - name: Run accessibility audit
      run: |
        npx lighthouse http://localhost:4173/valdor-menu --output=json --output-path=./accessibility.json || true
        # Check for critical violations
        CRITICAL=$(cat accessibility.json | jq '.categories.accessibility.score')
        if [ "$CRITICAL" -lt 90 ]; then
          echo "Accessibility score too low: $CRITICAL"
          exit 1
        fi

  deploy:
    runs-on: ubuntu-latest
    needs: [test, accessibility]
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4
    - name: Deploy to production
      run: echo "Deploy to production environment"
```

### 🧪 9) EXECUTION COMMANDS

#### **Run Full Test Suite Locally**
```bash
# Start MongoDB
docker run -d --name valdor-test-db -p 27017:27017 mongo:6

# Backend tests
cd backend
npm run seed:db
npm run test:all

# Frontend tests
cd ../frontend
npm run test:e2e

# Performance tests
npm install -g lighthouse
lighthouse http://localhost:5173/valdor-menu --output=json
```

#### **Run Individual Test Categories**
```bash
# Unit tests only
cd backend && npm run test:unit

# Integration tests only
cd backend && npm run test:integration

# E2E tests only
cd frontend && npm run test:e2e

# Accessibility tests
cd frontend && npx cypress run --spec "cypress/e2e/accessibility.cy.js"
```

### 🧪 10) BUG REPORTING TEMPLATE

**Title:** [Component] Brief description of issue

**Environment:**
- OS: macOS/Windows/Linux
- Browser: Chrome 120/Safari/Firefox
- Node.js: v18.19.0
- MongoDB: v6.0.8

**Steps to Reproduce:**
1. Navigate to `/valdor-menu`
2. Click on "Chicken Lamprais"
3. Add to cart with quantity 2
4. Proceed to checkout
5. Fill form and submit

**Expected Result:**
Order confirmation with order ID displayed

**Actual Result:**
Error message: "Failed to place order"

**Logs:**
```
Backend logs:
[2024-01-15 14:30:00] POST /api/valdor/orders 500 Internal Server Error
Error: ValidationError: Order validation failed

Frontend console:
Failed to place order: Request failed with status code 500
```

**Screenshots:**
[Attach screenshots of error states]

**DB State:**
```json
{
  "collection": "foods",
  "query": { "name": "Chicken Lamprais" },
  "result": { "isAvailable": true, "price": 950 }
}
```

**Additional Context:**
- User was logged in as user@example.com
- Cart contained 2 items
- Network connection was stable
- Issue occurs consistently

**Severity:** Critical/Major/Minor
**Priority:** High/Medium/Low

### 🧪 11) TROUBLESHOOTING GUIDE

#### **Common Issues & Solutions**

**Issue: Tests fail with MongoDB connection**
```bash
# Solution: Ensure MongoDB is running
docker ps | grep mongo
docker run -d --name valdor-mongo -p 27017:27017 mongo:6
```

**Issue: E2E tests timeout**
```bash
# Solution: Increase timeout and check network
# In cypress.config.js:
defaultCommandTimeout: 15000
requestTimeout: 20000
```

**Issue: AI extraction fails**
```bash
# Solution: Check API keys and network
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/valdor/extract-menu \
  -d '{"url":"https://valampuri.foodorders.lk/"}'
```

**Issue: Accessibility score low**
```bash
# Solution: Fix missing alt texts, ARIA labels
# Check axe-core violations and fix
```

**Issue: CI fails on deployment**
```bash
# Solution: Check environment variables
# Verify build artifacts exist
ls -la frontend/dist/
ls -la backend/dist/
```

### 🧪 12) ACCEPTANCE CRITERIA CHECKLIST

- ✅ **Guest Flow**: Browse, filter, cart, checkout, order history work
- ✅ **Admin Flow**: CRUD operations, AI extraction, order management work
- ✅ **API**: All endpoints return correct schema-compliant data
- ✅ **AI Extractor**: OCR, vision analysis, Wikipedia enrichment functional
- ✅ **Database**: All seeded Valdor items match exact Food schema
- ✅ **Security**: Role-based access, JWT validation, input sanitization
- ✅ **Performance**: Page loads < 3s, images < 150KB
- ✅ **Accessibility**: Axe-core critical violations = 0
- ✅ **Cross-browser**: Works on Chrome, Firefox, Safari
- ✅ **Mobile**: Responsive on 320px+ widths
- ✅ **CI/CD**: All tests pass in pipeline
- ✅ **Documentation**: README, API docs, deployment guides complete

---

**🎯 Ready to execute comprehensive testing!** This test plan covers every aspect of the Valdor restaurant system with both manual and automated testing approaches.