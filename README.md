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

---

## 🎉 Happy Hacking!

Thanks for exploring the Hotel Management System with AI-Powered Food Ordering! Feel free to customize, contribute, and scale it to fit your needs.

**Key Features Delivered:**
- ✅ Complete MERN stack architecture
- ✅ AI-powered menu extraction system
- ✅ Professional restaurant UI/UX
- ✅ Real-time order management
- ✅ Role-based access control
- ✅ Mobile-responsive design
- ✅ Production-ready deployment