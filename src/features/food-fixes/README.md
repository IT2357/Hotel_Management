# Food Fixes Feature

This feature enhances the Jaffna restaurant food ordering system with improved UI/UX, full CRUD operations for menu management, and an AI-powered menu extractor.

## Features

### 1. Enhanced Guest Experience
- **Responsive Menu Page**: Mobile-first design with Tamil/English language toggle
- **Improved Cart**: Visual counter, quantity adjustment, persistent storage
- **Streamlined Checkout**: Multi-step form with progress indicator

### 2. Admin Menu Management
- **Full CRUD Operations**: Create, read, update, delete menu items
- **Image Upload**: Support for menu item images
- **Pagination**: Efficient loading of menu items
- **Search & Filter**: Find menu items quickly

### 3. AI Menu Extractor
- **OCR Processing**: Extract text from menu images
- **Jaffna Cuisine Support**: Recognizes Tamil names and local dishes
- **Data Pre-fill**: Automatically fills forms with extracted data
- **Training Script**: Tool for improving OCR accuracy

## Components

### Frontend Components
- `MenuPage.jsx`: Enhanced menu browsing with search and filtering
- `Cart.jsx`: Improved shopping cart with persistent storage
- `Checkout.jsx`: Multi-step checkout process
- `AdminMenu.jsx`: Full CRUD interface for menu management
- `AIUpload.jsx`: AI-powered menu image processing

### Backend Routes
- `foodAdminRoutes.js`: Full CRUD operations for menu items
- `menuExtractionRoutes.js`: AI menu extraction endpoints

### Utilities
- `AIExtractor.js`: OCR processing and data parsing
- `train-ocr.js`: Script for training OCR model with Jaffna dataset

## Installation

```bash
cd src/features/food-fixes
npm install
```

## Usage

### Admin Menu Management
1. Navigate to `/admin/food/menu`
2. Use the "Add Item" button to create new menu items
3. Edit or delete existing items using the action buttons

### AI Menu Extraction
1. Navigate to `/admin/food/ai-menu`
2. Upload a clear image of your menu
3. Review the extracted data
4. Make any necessary adjustments
5. Click "Add to Menu" to create the menu item

### Training OCR Model
To improve OCR accuracy for Jaffna cuisine:

```bash
npm run train-ocr -- --dataset=/path/to/dataset --output=/path/to/output
```

## Jaffna Cuisine Support

The AI extractor is specifically trained to recognize:
- **Tamil Names**: நண்டு கறி (Crab Curry), அப்பம் (Hoppers)
- **English Names**: Jaffna Crab Curry, Odiyal Kool
- **Local Dishes**: Brinjal Curry, Mutton Curry, Fish Curry, String Hoppers
- **Cultural Context**: Automatically applies tags like "Traditional", "Spicy", "Seafood"

## Color Scheme

- Primary: #FF9933 (Saffron Orange)
- Secondary: #FFFFFF (White)
- Text: #4A4A4A (Dark Gray)

## Technologies

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **AI/OCR**: Tesseract.js
- **Image Processing**: Multer for uploads

## Testing

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

MIT