# 🧪 Food Workflow Enhancement - Quick Testing Guide

## 🚀 Quick Start Testing (5 Minutes)

### Prerequisites
```bash
# 1. Start backend server
cd backend
npm run dev

# 2. Start frontend (separate terminal)
cd frontend
npm run dev

# 3. Ensure MongoDB is running
# 4. Ensure you have a test user account
```

---

## 📋 Test Scenario 1: Complete Order Flow

### Step 1: Place Order (Existing)
1. Login as guest user
2. Navigate to `/menu` or `/food-ordering`
3. Add 2-3 items to cart
4. Click checkout
5. Fill in customer details
6. Select payment method (use "cash" for testing)
7. Submit order
8. **Note the Order ID** from success page

### Step 2: Confirm Order (NEW API)
```bash
# Use the Order ID from Step 1
curl -X POST http://localhost:5000/api/food/workflow/confirm/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "TEST_PAY_123",
    "transactionId": "TXN_456"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": { ...order details... },
  "task": {
    "_id": "...",
    "taskType": "prep",
    "status": "queued",
    "priority": "normal"
  }
}
```

**Check**:
- ✅ Browser console shows Socket.io event (if manager page open)
- ✅ MongoDB `foodtaskqueues` collection has new entry
- ✅ Order `taskHistory` has "Confirmed" entry

---

### Step 3: View Order Timeline (Frontend)
1. Navigate to `/order-details/ORDER_ID`
2. **Verify**:
   - ✅ `FoodStatusTracker` component displays
   - ✅ "Order Confirmed" step is highlighted
   - ✅ ETA banner shows estimated time
   - ✅ Socket.io connection in console

---

### Step 4: Assign to Staff (NEW API)
```bash
# Get a staff user ID from your database first
curl -X PUT http://localhost:5000/api/food/workflow/assign/ORDER_ID_HERE \
  -H "Authorization: Bearer ADMIN_OR_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "STAFF_USER_ID",
    "taskType": "prep"
  }'
```

**Expected**:
- ✅ Order status changes to "Assigned"
- ✅ `FoodStatusTracker` updates in real-time (no refresh needed!)
- ✅ "Assigned to Kitchen" step highlights
- ✅ ETA banner updates

---

### Step 5: Update Kitchen Status (NEW API)
```bash
# Mark as preparing
curl -X PUT http://localhost:5000/api/food/workflow/status/ORDER_ID_HERE \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kitchenStatus": "preparing",
    "status": "Preparing",
    "notes": "Started cooking at 10:30 AM"
  }'
```

**Watch the Magic** ✨:
- Open `/order-details/ORDER_ID` in browser
- Execute the curl command
- See "Being Prepared" step animate and highlight **WITHOUT refreshing!**

**Continue**:
```bash
# Mark as ready
curl -X PUT http://localhost:5000/api/food/workflow/status/ORDER_ID_HERE \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kitchenStatus": "ready",
    "status": "Ready",
    "qualityChecks": {
      "temperature": true,
      "presentation": true,
      "portionSize": true,
      "garnish": true
    }
  }'
```

```bash
# Mark as delivered
curl -X PUT http://localhost:5000/api/food/workflow/status/ORDER_ID_HERE \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kitchenStatus": "delivered",
    "status": "Delivered"
  }'
```

**Final Check**:
- ✅ All 5 steps completed in timeline
- ✅ Green success message appears
- ✅ "Rate Your Order" button shows up

---

### Step 6: Submit Review (NEW API)
```bash
curl -X POST http://localhost:5000/api/food/workflow/review/ORDER_ID_HERE \
  -H "Authorization: Bearer GUEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent Jaffna cuisine! Fresh and flavorful."
  }'
```

**Verify**:
- ✅ Review appears in order details
- ✅ Star rating displays
- ✅ Check MongoDB `foodreviews` collection for new entries

---

## 📋 Test Scenario 2: Order Modification

### Setup
1. Create new order (repeat Scenario 1, Steps 1-2)
2. **DO NOT assign to staff yet**

### Test Modification
```bash
curl -X PUT http://localhost:5000/api/food/workflow/modify/ORDER_ID_HERE \
  -H "Authorization: Bearer GUEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Extra spicy please, and add extra rice",
    "specialInstructions": "Allergic to peanuts"
  }'
```

**Expected**:
- ✅ Order status changes to "Modified"
- ✅ `modificationHistory` array has entry
- ✅ Notes updated

### Test Blocked Modification (After Assignment)
```bash
# First assign order (Step 4 from Scenario 1)
# Then try to modify

# This should FAIL
curl -X PUT http://localhost:5000/api/food/workflow/modify/ORDER_ID_HERE \
  -H "Authorization: Bearer GUEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Change order"
  }'
```

**Expected**: Error 400 - "Order is already being prepared"

---

## 📋 Test Scenario 3: Order Cancellation

### Test Cancel with Refund
```bash
curl -X DELETE http://localhost:5000/api/food/workflow/cancel/ORDER_ID_HERE \
  -H "Authorization: Bearer GUEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed plans"
  }'
```

**Expected**:
- ✅ Order status = "Cancelled"
- ✅ `paymentStatus` = "Refunded" (simulated)
- ✅ All `FoodTaskQueue` entries cancelled
- ✅ Timeline shows cancelled state in red
- ✅ Refund details in response

---

## 📋 Test Scenario 4: Kitchen Queue

### Get Pending Tasks
```bash
curl -X GET http://localhost:5000/api/food/workflow/kitchen-queue \
  -H "Authorization: Bearer STAFF_TOKEN"
```

**Expected**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderId": { ...order details... },
      "taskType": "prep",
      "status": "queued",
      "priority": "urgent",
      "isRoomService": true
    },
    ...more tasks sorted by priority
  ],
  "count": 3
}
```

**Verify Sorting**:
- ✅ Room service orders first (`isRoomService: true`)
- ✅ Within same priority, older orders first (FIFO)

---

## 📋 Test Scenario 5: Real-time Socket.io

### Setup
1. Open browser console on `/order-details/ORDER_ID`
2. In another terminal, update order status

### Watch Console
```javascript
// You should see:
Socket connected: abc123
User 6789... joined user room

// When status updated:
Received foodStatusUpdate: {
  orderId: "...",
  status: "Preparing",
  timeline: [...],
  timestamp: "2025-10-18T..."
}
```

### Verify Live Updates
1. Keep `/order-details/ORDER_ID` open
2. Execute status update curl command
3. **Watch the timeline animate WITHOUT refresh!**

---

## 📋 Test Scenario 6: Room Service Priority

### Create Room Service Order
When placing order in Step 1:
- Set `orderType: "room-service"` in checkout
- Or include "room" in delivery address

### Verify Priority
```bash
# After confirmation, check task priority
curl -X GET http://localhost:5000/api/food/workflow/kitchen-queue \
  -H "Authorization: Bearer STAFF_TOKEN"
```

**Expected**:
- ✅ Your order appears **first** in queue
- ✅ `priority: "urgent"`
- ✅ `isRoomService: true`
- ✅ ETA 20% shorter than normal orders

---

## 🐛 Common Issues & Fixes

### Issue 1: Socket.io not connecting
**Symptoms**: No real-time updates, console shows disconnect errors

**Fix**:
```bash
# Check .env has correct FRONTEND_URL
FRONTEND_URL=http://localhost:5173

# Restart backend server
cd backend
npm run dev
```

### Issue 2: Task not appearing in queue
**Symptoms**: `/kitchen-queue` returns empty array

**Fix**:
```bash
# Confirm order first (Step 2)
# Check MongoDB for task:
mongosh
use hotel_management
db.foodtaskqueues.find({ status: { $in: ['queued', 'assigned', 'in-progress'] } })
```

### Issue 3: Timeline not updating
**Symptoms**: Status stuck on old step

**Fix**:
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Check token is valid (not expired)
- Verify Socket.io connection in console

### Issue 4: 401 Unauthorized
**Symptoms**: API returns "Invalid token"

**Fix**:
```javascript
// Get fresh token
localStorage.getItem('token')

// Use in curl:
curl -H "Authorization: Bearer PASTE_TOKEN_HERE" ...
```

---

## ✅ Success Criteria

After running all scenarios, you should have:

### Backend
- [x] 1+ entries in `foodtaskqueues` collection
- [x] Orders with `taskHistory` array populated
- [x] Socket.io logs in server console
- [x] No errors in server logs

### Frontend
- [x] `FoodStatusTracker` displays on order details page
- [x] Real-time updates work without refresh
- [x] ETA banner calculates and displays
- [x] All 5 timeline steps animate correctly
- [x] Review form appears after delivery

### Database
- [x] `FoodTaskQueue` documents created
- [x] `FoodOrder.taskHistory` has timeline entries
- [x] `FoodOrder.review` saved after submission
- [x] `FoodReview` entries created for items

---

## 🎯 Performance Benchmarks

### Expected Response Times
- Order confirmation: <200ms
- Staff assignment: <150ms
- Status update: <100ms
- Kitchen queue query: <50ms (with indexes)
- Socket.io broadcast: <10ms

### Scalability Targets
- Handle 50+ concurrent orders
- Kitchen queue supports 200+ pending tasks
- Socket.io supports 1000+ connected clients

---

## 📊 Monitoring in Development

### Check Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Look for:
# ✅ "Food order confirmed"
# ✅ "Food order assigned"
# ✅ "Food order status updated"
# ✅ "Socket connected"
```

### MongoDB Queries
```javascript
// Check task queue
db.foodtaskqueues.find().pretty()

// Check recent orders
db.foodorders.find().sort({ createdAt: -1 }).limit(5).pretty()

// Check reviews
db.foodreviews.find().pretty()
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass**:
   - Proceed to Step 3: Kitchen Dashboard UI
   - Implement `KitchenQueueView.jsx` component
   - Add manager notification toasts

2. **If tests fail**:
   - Check "Common Issues & Fixes" section
   - Verify environment variables
   - Review server logs for errors
   - Ensure MongoDB indexes created

3. **Production Readiness**:
   - Set up PayHere production API
   - Configure Redis for Socket.io scaling
   - Add monitoring/alerts for task queue
   - Train staff on workflow

---

## 📞 Support

**Stuck?** Check:
1. `FOOD_WORKFLOW_ENHANCEMENT_COMPLETE.md` - Full documentation
2. Server console for error messages
3. Browser console for Socket.io logs
4. MongoDB collections for data

**Debug Mode**:
```javascript
// Add to frontend console
localStorage.setItem('debug', 'socket.io-client:*')
```

---

**Happy Testing! 🎉**

**Last Updated**: 2025-10-18  
**Version**: 1.0.0
