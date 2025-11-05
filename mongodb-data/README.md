# MongoDB Compass Data Insertion Guide

## Step-by-Step Instructions

### 1. Open MongoDB Compass
- Launch MongoDB Compass
- Connect to your local MongoDB instance (mongodb://localhost:27017)
- Select the `hotel-management` database

### 2. Insert Users Collection Data
1. Click on the `users` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `01-users.json`
5. Click "Insert"

**Login Credentials (all passwords are: `password123`):**
- Manager: `manager@hotel.com` / `password123`
- Staff: `maria.santos@hotel.com` / `password123`
- Guest: `guest@example.com` / `password123`

### 3. Insert Rooms Collection Data
1. Click on the `rooms` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `02-rooms.json`
5. Click "Insert"

### 4. Insert Tasks Collection Data
1. Click on the `tasks` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `03-tasks.json`
5. Click "Insert"

### 5. Insert Revenues Collection Data
1. Click on the `revenues` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `04-revenues.json`
5. Click "Insert"

**Note:** You'll need to update the `sourceId` and `customerId` fields with actual ObjectIds from your users and bookings collections after inserting them.

### 6. Insert Expenses Collection Data
1. Click on the `expenses` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `05-expenses.json`
5. Click "Insert"

**Note:** You'll need to update the `paidBy` and `approvedBy` fields with actual ObjectIds from your users collection.

### 7. Insert Reviews Collection Data
1. Click on the `reviews` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `06-reviews.json`
5. Click "Insert"

**Note:** You'll need to update the `userId` and `roomId` fields with actual ObjectIds.

### 8. Insert Bookings Collection Data
1. Click on the `bookings` collection (create if it doesn't exist)
2. Click "Insert Document"
3. Switch to JSON view
4. Copy and paste the content from `07-bookings.json`
5. Click "Insert"

**Note:** You'll need to update the `userId` and `roomId` fields with actual ObjectIds.

### 9. Insert Food Categories and Menu Items (Authentic Jaffna Cuisine)

#### Option 1: Using the Import Script (Recommended)
```bash
# From project root
node import-jaffna-food.js

# OR from backend directory
cd backend
node ../mongodb-data/import-food-data.js
```

This script will:
- Import 12 authentic Jaffna/Sri Lankan food categories
- Import 100+ menu items with real matching images
- Properly link menu items to categories
- Set time slot availability (Breakfast, Lunch, Dinner, Snacks)
- Display a summary with counts
- Based on real Valampuri Hotel menu in Jaffna

#### Option 2: Manual Import via MongoDB Compass
1. **Import Categories First:**
   - Click on the `categories` collection (create if it doesn't exist)
   - Click "Insert Document"
   - Switch to JSON view
   - Copy and paste the content from `08-food-categories.json`
   - Click "Insert"

2. **Import Menu Items:**
   - Note down the category `_id` values
   - Click on the `menuitems` collection (create if it doesn't exist)
   - For each item in `09-menu-items.json`:
     - Replace the category name with the corresponding `_id` from categories
     - Insert the document

## Food Data Summary (Authentic Jaffna Cuisine)

Based on [Valampuri Hotel Jaffna Menu](https://valampuri.foodorders.lk/menu/2)

### Categories (12 total):
- 🍛 Biryani - Aromatic rice dishes (6 items)
- 🥘 Kottu - Traditional Sri Lankan stir fry (6 items)  
- 🍚 Rice & Curry - Authentic rice with curries (5 items)
- 🦀 Jaffna Specials - Traditional Jaffna cuisine (5 items)
- 🥞 Dosa & Hoppers - Breakfast favorites (6 items)
- 🍜 Noodles & Fried Rice - Asian inspired (6 items)
- 🦐 Seafood - Fresh from Jaffna waters (5 items)
- 🥟 Appetizers & Snacks - Light bites (5 items)
- 🫓 Breads - Naan, chapati, paratha (6 items)
- 🍰 Desserts - Traditional sweets (5 items)
- ☕ Beverages - Hot and cold drinks (6 items)
- 🍲 Soups - Warming broths (4 items)

### Menu Items (65 total):
All items include:
- ✅ **Real food images** that match the dish names exactly
- ⏰ **Time slot availability** (Breakfast/Lunch/Dinner/Snacks)
- 🌱 **Vegetarian flags** for dietary preferences
- 🌶️ **Spicy indicators** for authentic Sri Lankan heat
- ⭐ **Popular item markers** for best sellers
- 💰 **Realistic pricing** in LKR (60 - 2200)
- 👨‍🍳 **Cooking time** estimates
- 📝 **Authentic descriptions** of each dish

### Featured Dishes:
- **Jaffna Crab Curry** - Signature dish (LKR 1800)
- **Mutton Kottu** - Popular street food (LKR 1000)
- **String Hoppers** - Traditional breakfast (LKR 350)
- **Chicken Biryani** - Aromatic favorite (LKR 950)
- **Watalappan** - Traditional dessert (LKR 250)

### Time Slot Distribution:
- 🌅 **Breakfast Plan**: ~15 items (hoppers, dosa, beverages, paratha)
- 🌅🌙 **Half Board**: ~50 items (breakfast + dinner items)
- 🌅🌞🌙 **Full Board**: ~60 items (all-day dining)
- 🎯 **A la carte**: 65 items (complete menu)

### Price Range:
- **Budget**: LKR 60 - 400 (hoppers, naan, samosa)
- **Mid-range**: LKR 450 - 900 (kottu, rice & curry, dosa)
- **Premium**: LKR 1000 - 2200 (biryani, seafood, Jaffna specials)

## Important Notes

### ObjectId References
After inserting the basic collections (users, rooms), you'll need to:

1. **Get ObjectIds**: Note down the `_id` values for:
   - Manager user (for tasks, expenses)
   - Guest user (for bookings, reviews, revenues)
   - Room IDs (for bookings, reviews)

2. **Update References**: Go back and edit the documents to add proper ObjectId references:
   - Tasks: Add `assignedBy` and `assignedTo` ObjectIds
   - Expenses: Add `paidBy` and `approvedBy` ObjectIds
   - Revenues: Add `sourceId` and `customerId` ObjectIds
   - Reviews: Add `userId` and `roomId` ObjectIds
   - Bookings: Add `userId` and `roomId` ObjectIds

### Testing the Dashboard
After inserting all data:

1. **Start the application**: Both backend and frontend should be running
2. **Login**: Use `manager@hotel.com` / `password123`
3. **Navigate**: Go to Manager Dashboard to see the dynamic data
4. **Verify**: Check that all sections now show real data instead of "Failed to load"

## Expected Dashboard Data
With this sample data, you should see:
- **Recent Activities**: 4 tasks with different statuses
- **Revenue**: $2,740 total from room bookings and food orders
- **Expenses**: $650 total from utilities, supplies, and maintenance
- **Task Statistics**: Mix of completed, in-progress, and pending tasks
- **Reviews**: Average rating around 4 stars from 3 reviews

## Collections Summary
- **users**: 5 users (1 manager, 3 staff, 1 guest)
- **rooms**: 4 rooms with different types and statuses
- **tasks**: 4 tasks across different departments
- **revenues**: 4 revenue entries from bookings and food
- **expenses**: 3 expense entries for operations
- **reviews**: 3 guest reviews with ratings
- **bookings**: 3 bookings with confirmed status