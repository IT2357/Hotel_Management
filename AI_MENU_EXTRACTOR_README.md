# 🤖 AI Menu Extractor & Importer (MERN Stack)

A comprehensive AI-powered menu extraction system that automatically extracts restaurant menu items from images, URLs, or file paths, organizes them into structured JSON, and allows admin review/editing before saving to MongoDB.

## 🚀 Features

### Multi-Input Support
- 📸 **Image Upload**: Upload menu photos/scans (JPEG, PNG, WEBP, GIF up to 15MB)
- 🌐 **Website URLs**: Extract menus from restaurant websites
- 💾 **File Paths**: Process images from server file paths (development)

### AI-Powered Extraction
- **Tesseract OCR**: Default offline OCR engine
- **Google Vision API**: Optional premium OCR (better accuracy)
- **Smart Parsing**: Automatic category detection and price extraction
- **Text Normalization**: Clean up OCR errors and format text

### Admin Review System
- **Interactive Editor**: Edit categories, items, prices, and descriptions
- **Real-time Validation**: Ensure data integrity before saving
- **Image Management**: GridFS storage with streaming endpoints
- **Export/Import**: JSON export for backup and migration

### Database Integration
- **MongoDB Storage**: Structured menu data with GridFS images
- **Schema Validation**: Ensure data consistency
- **API Endpoints**: Full CRUD operations with authentication
- **Statistics**: Track extraction performance and usage

## 📂 Project Structure

```
/backend
  /controllers
    menuExtractionController.js    # Main extraction logic
  /models
    Menu.js                        # MongoDB schema
  /routes
    menu.js                        # API endpoints
  /services
    ocrService.js                  # OCR processing (Tesseract + Google Vision)
    htmlParser.js                  # Website scraping with Cheerio
    gridfsService.js               # Image storage with GridFS
  server.js                        # Express app setup

/frontend
  /src
    /api
      menuApi.js                   # API client with axios
    /components
      MenuUploader.jsx             # Upload interface
      MenuReview.jsx               # Review/edit interface
    /pages/admin
      MenuExtractorPage.jsx        # Main page component
```

## 🛠️ Installation & Setup

### 1. Backend Dependencies
```bash
cd backend
npm install tesseract.js @google-cloud/vision @google-cloud/storage multer
```

### 2. Frontend Dependencies
```bash
cd frontend
npm install react-dropzone react-hot-toast
```

### 3. Environment Variables
Create `.env` file in `/backend`:
```env
# Required
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel_management
JWT_SECRET=your-jwt-secret

# Optional - Google Vision API (for better OCR)
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Optional - OpenAI API (for enhanced parsing)
OPENAI_API_KEY=your-openai-api-key
```

### 4. Add Routes to Server
In your main `server.js` or `app.js`:
```javascript
import menuRoutes from './routes/menu.js';

// Add menu extraction routes
app.use('/api/menu', menuRoutes);
```

### 5. Add Frontend Routes
In your React `App.jsx`:
```javascript
import MenuExtractorPage from './pages/admin/MenuExtractorPage';

// Add route
<Route path="/admin/menu-extractor" element={<MenuExtractorPage />} />
```

## 🔌 API Endpoints

### Core Endpoints
```http
POST   /api/menu/extract           # Extract menu from image/URL/path
GET    /api/menu/preview/:id       # Get menu preview for review
POST   /api/menu/save              # Save edited menu to database
GET    /api/menu/:id               # Get saved menu by ID
GET    /api/menu/image/:gridfsId   # Stream image from GridFS
GET    /api/menu                   # List menus with pagination
DELETE /api/menu/:id               # Delete menu by ID
GET    /api/menu/stats             # Get extraction statistics
```

### Request Examples

#### Extract from Image Upload
```bash
curl -F "file=@menu.jpg" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/menu/extract
```

#### Extract from URL
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"url": "https://restaurant.com/menu"}' \
     http://localhost:5000/api/menu/extract
```

#### Extract from File Path
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"path": "/path/to/menu.jpg"}' \
     http://localhost:5000/api/menu/extract
```

### Response Format
```json
{
  "success": true,
  "menu": {
    "id": "menu_id_here",
    "source": {
      "type": "image|url|path",
      "value": "original_input"
    },
    "categories": [
      {
        "name": "Appetizers",
        "items": [
          {
            "name": "Chicken Wings",
            "price": 12.99,
            "description": "Spicy buffalo wings",
            "image": "gridfs:image_id"
          }
        ]
      }
    ],
    "rawText": "original_ocr_text",
    "createdAt": "2025-09-20T...",
    "confidence": 85,
    "extractionMethod": "tesseract"
  },
  "previewId": "temp_id_for_editing"
}
```

## 🧪 Testing the System

### 1. Start Backend
```bash
cd backend
npm start
# Backend runs at http://localhost:5000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 3. Test Workflow
1. Navigate to `/admin/menu-extractor`
2. Upload a menu image or provide URL
3. Review extracted data in the editor
4. Make corrections as needed
5. Save to database
6. Verify in menu management system

### 4. Test API Directly
```bash
# Health check
curl http://localhost:5000/health

# Test extraction with sample image
curl -F "file=@sample-menu.jpg" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/menu/extract
```

## 🔧 Configuration Options

### OCR Service Priority
1. **Google Vision API** (if configured) - Best accuracy
2. **Tesseract.js** (default) - Good offline option

### Image Storage Options
- **GridFS** (default) - MongoDB-integrated storage
- **Base64** (optional) - Direct database storage
- **External URLs** (optional) - Reference external images

### Supported Formats
- **Images**: JPEG, PNG, WEBP, GIF (max 15MB)
- **URLs**: Any HTTP/HTTPS restaurant website
- **Paths**: Server-accessible image files

## 📊 Menu Data Schema

```javascript
{
  source: {
    type: "image|url|path",
    value: "original_input"
  },
  categories: [
    {
      name: "Category Name",
      items: [
        {
          name: "Item Name",
          price: 12.99,                    // Number (required)
          description: "Description",      // String (optional)
          image: "gridfs:id|url:http..."  // String (optional)
        }
      ]
    }
  ],
  rawText: "original_extracted_text",
  createdAt: "ISO8601_timestamp",
  confidence: 85,                         // 0-100
  extractionMethod: "tesseract|google-vision"
}
```

## 🚨 Error Handling

### Common Errors
- **File too large**: Max 15MB limit
- **Invalid file type**: Only images allowed
- **OCR failed**: Fallback to manual entry
- **URL inaccessible**: Network or permission issues
- **Validation errors**: Required fields missing

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": ["validation", "errors", "array"]
}
```

## 🔐 Security & Authentication

- **JWT Authentication**: Required for all endpoints except image streaming
- **Role-based Access**: Admin/Manager roles only
- **File Validation**: Type and size checks
- **Path Security**: Restricted file path access
- **Input Sanitization**: Clean and validate all inputs

## 📈 Performance Optimization

### Backend
- **GridFS Streaming**: Efficient image delivery
- **Pagination**: Large menu lists
- **Caching**: Image and data caching
- **Compression**: Image optimization

### Frontend
- **Lazy Loading**: Load images on demand
- **Debounced Input**: Reduce API calls
- **Progress Indicators**: User feedback
- **Error Boundaries**: Graceful error handling

## 🔄 Integration with Existing System

### Menu Management Integration
```javascript
// Import extracted menu to existing MenuItem collection
const importToMenuItems = async (extractedMenuId) => {
  const menu = await Menu.findById(extractedMenuId);
  
  for (const category of menu.categories) {
    for (const item of category.items) {
      await MenuItem.create({
        name: item.name,
        price: item.price,
        description: item.description,
        category: category.name,
        // ... other fields
      });
    }
  }
};
```

### Dashboard Integration
Add to admin dashboard:
```jsx
<DashboardCard 
  title="AI Menu Extractor" 
  to="/admin/menu-extractor"
  description="Extract menu data from images and URLs using AI"
/>
```

## 🐛 Troubleshooting

### Common Issues

#### OCR Not Working
- Check Tesseract.js installation
- Verify image quality and format
- Try Google Vision API for better results

#### GridFS Errors
- Ensure MongoDB connection is stable
- Check GridFS bucket configuration
- Verify file permissions

#### Frontend Build Issues
- Update React and dependencies
- Check for missing imports
- Verify environment variables

#### API Authentication Errors
- Check JWT token validity
- Verify user roles and permissions
- Ensure proper middleware order

### Debug Mode
Enable detailed logging:
```env
NODE_ENV=development
DEBUG=menu-extractor:*
```

## 📝 Sample Test Data

### Test Menu Image
Create a simple menu image with:
```
APPETIZERS
Chicken Wings - $12.99
Mozzarella Sticks - $8.99

MAIN COURSE  
Burger & Fries - $15.99
Grilled Salmon - $22.99

DESSERTS
Chocolate Cake - $6.99
Ice Cream - $4.99
```

### Test URLs
- Restaurant websites with visible menus
- PDF menu links
- Online ordering platforms

## 🎯 Production Deployment

### Environment Setup
```env
NODE_ENV=production
MONGODB_URI=mongodb://production-server/db
GOOGLE_APPLICATION_CREDENTIALS=/path/to/prod-credentials.json
```

### Performance Monitoring
- Monitor OCR processing times
- Track extraction accuracy rates
- Log failed extractions for improvement

### Scaling Considerations
- Use Redis for caching
- Implement queue system for large files
- Consider CDN for image delivery

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with detailed description

## 📄 License

This project is part of the Hotel Management System and follows the same licensing terms.

---

## 🎉 Ready to Use!

Your AI Menu Extractor is now fully functional and integrated with your MERN Hotel Management System. The system provides:

✅ **Complete End-to-End Workflow**: Upload → Extract → Review → Save  
✅ **Production-Ready Code**: Error handling, validation, security  
✅ **Scalable Architecture**: Modular services and clean separation  
✅ **Modern UI/UX**: React components with Tailwind CSS  
✅ **Comprehensive API**: Full CRUD operations with authentication  
✅ **Flexible Input Methods**: Images, URLs, and file paths  
✅ **Advanced Features**: GridFS storage, statistics, export/import  

Navigate to `/admin/menu-extractor` in your application to start extracting menus! 🚀
