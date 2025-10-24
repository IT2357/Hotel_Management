# 📊 Staff Analytics Seed Script

## Overview
This script populates MongoDB with comprehensive sample data for the **Staff Analytics Dashboard**, including staff members, tasks, and performance metrics.

## What Data Gets Seeded

### 👥 Staff Members (8 total)
- **Housekeeping**: Maria Rodriguez (Lead), Sarah Williams (Senior Housekeeper)
- **Maintenance**: John Smith (Tech), Mike Johnson (Lead)
- **Kitchen**: Carlos Martinez (Head Chef), David Lee (Sous Chef)
- **Service**: Lisa Chen (Front Desk Manager), Emily Davis (Receptionist)

### 📋 Tasks (~300-600 tasks)
- **Time Period**: Last 30 days of data
- **Volume**: 10-20 tasks per day
- **Departments**: cleaning, Maintenance, Kitchen, service
- **Statuses**: completed, in_progress, pending, cancelled
- **Completion Rate**: ~70% for older tasks, ~50% for recent tasks

### 📈 Performance Metrics
For completed tasks:
- Quality Rating: 4-5 stars
- Time Efficiency: 70-100%
- Guest Satisfaction: 4-5 stars
- Actual Duration: Tracked in minutes

## How to Run

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run seed:staff-analytics
```

### Option 2: Direct execution
```bash
cd backend
node scripts/seedStaffAnalytics.js
```

## What You'll See

The script will:
1. ✅ Connect to MongoDB
2. 👤 Create/update manager user
3. 👥 Create/update 8 staff members
4. 🗑️ Clear existing staff tasks
5. 📊 Generate 30 days of task data
6. 💾 Insert all tasks into database
7. 📈 Display statistics summary

### Sample Output
```
✨ ============================================
✨ STAFF ANALYTICS DATA SEEDED SUCCESSFULLY!
✨ ============================================

📈 Overall Statistics:
   Total Staff: 8
   Active Staff: 6
   Total Tasks: 450
   Completed Tasks: 315
   Completion Rate: 70.0%

🏢 Department Statistics:
   cleaning: 110/158 tasks (69.6%)
   Maintenance: 85/120 tasks (70.8%)
   Kitchen: 65/92 tasks (70.7%)
   service: 55/80 tasks (68.8%)

👥 Staff Members:
   - Maria Rodriguez (cleaning) - active
   - John Smith (Maintenance) - active
   - Lisa Chen (service) - active
   - Carlos Martinez (Kitchen) - active
   - Sarah Williams (cleaning) - inactive
   - Mike Johnson (Maintenance) - active
   - Emily Davis (service) - active
   - David Lee (Kitchen) - inactive

🎯 You can now view the Staff Analytics page with real data!
📊 Navigate to: /manager/staff/analytics
```

## Environment Requirements

Make sure your `.env` file has:
```env
MONGODB_URI=mongodb://localhost:27017/hotel-management
# or your MongoDB Atlas connection string
```

## Default Credentials

After seeding, you can login with:

**Manager Account:**
- Email: `manager@hotel.com`
- Password: `manager123`

**Staff Accounts:**
- Email: `{firstname}.{lastname}@hotel.com` (e.g., `maria.rodriguez@hotel.com`)
- Password: `staff123`

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Duplicate Key Error
**Solution**: The script automatically clears existing tasks. If you get duplicate user errors, users already exist and will be updated.

### No Manager Found
**Solution**: The script automatically creates a manager user if none exists.

## Data Structure

### Staff Task Schema
```javascript
{
  title: String,
  description: String,
  department: String, // cleaning, Maintenance, Kitchen, service
  category: String,   // room_cleaning, maintenance, guest_request, etc.
  priority: String,   // low, medium, high
  status: String,     // completed, in_progress, pending, cancelled
  assignedBy: ObjectId,
  assignedTo: ObjectId,
  createdAt: Date,
  completedAt: Date,
  actualDuration: Number, // in minutes
  performanceMetrics: {
    qualityRating: Number,
    timeEfficiency: Number,
    guestSatisfaction: Number
  }
}
```

## Next Steps

After seeding:
1. Start the backend server: `npm run dev`
2. Login as manager
3. Navigate to Staff Analytics page
4. See real-time performance charts populated with data!

## Re-running the Seed

You can run the seed script multiple times:
- It will **clear all existing staff tasks** each time
- Staff users will be **updated** (not duplicated)
- Fresh 30 days of data will be generated

---

💡 **Tip**: Run this seed script whenever you need fresh test data for the Staff Analytics dashboard!
