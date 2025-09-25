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