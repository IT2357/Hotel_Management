# Booking Meal Plan Calculation Fix - Complete Documentation

## 🎯 Problem Identified

The frontend was calculating meal costs correctly using the day-by-day meal structure from `DailyMealSelector`, but the backend was recalculating costs using **incorrect logic**:

### Frontend (Correct)
- Used day-by-day meal structure: `{ day, date, mealType, items[], totalCost }`
- Summed `totalCost` from each meal
- Each meal represents one meal slot (e.g., Day 1 Breakfast, Day 1 Dinner)

### Backend (Incorrect - FIXED)
- Used flat rates per person per night
- For "A la carte" meals, expected `meal.price` but structure had `meal.items[]`
- Multiplied by `guests * nights` which was wrong for day-by-day structure
- This caused **completely inappropriate values** to be saved

## ✅ Solution Implemented

### 1. Backend Calculation Fix (`backend/services/booking/bookingService.js`)

**Changed lines 245-322:**
- Now uses the same day-by-day meal structure as frontend
- Sums `meal.totalCost` from each meal
- Falls back to calculating from `meal.items[]` if `totalCost` is missing
- Removes incorrect multiplication by guests * nights
- Adds comprehensive logging for debugging

**Key Changes:**
```javascript
// OLD (INCORRECT):
if (bookingData.foodPlan === 'A la carte' && bookingData.selectedMeals) {
  mealPlanCost = bookingData.selectedMeals.reduce((total, meal) => {
    return total + (meal.price * guests * nights); // ❌ Wrong structure & logic
  }, 0);
}

// NEW (CORRECT):
if (bookingData.selectedMeals && bookingData.selectedMeals.length > 0) {
  mealPlanCost = bookingData.selectedMeals.reduce((total, meal) => {
    let mealCost = Number(meal.totalCost) || 0;
    if (!mealCost && meal.items) {
      mealCost = meal.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
    }
    return total + mealCost; // ✅ Correct: Sum of individual meal costs
  }, 0);
}
```

### 2. Frontend Validation Enhancement (`frontend/src/utils/bookingCalculations.js`)

**Enhanced `createBookingPayload` function:**
- Validates that each meal has `totalCost` calculated before sending
- Ensures all items have `foodId` for backend compatibility
- Adds comprehensive logging for debugging
- Updates version to 2.2 with `mealsValidated: true` flag

**Key Addition:**
```javascript
// Ensure each meal has totalCost calculated before sending to backend
const mealsWithTotalCost = selectedMeals.map(meal => {
  const totalCost = meal.totalCost || (meal.items?.reduce((sum, item) => 
    sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0) || 0);
  
  return {
    ...meal,
    totalCost, // Ensure this is always present
    items: meal.items?.map(item => ({
      ...item,
      foodId: item.foodId || item._id, // Ensure foodId is present
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1
    })) || []
  };
});
```

### 3. Frontend Documentation & Verification (`frontend/src/components/booking/IntegratedBookingFlow.jsx`)

**Added verification before submission (line 238-251):**
- Logs meal structure before sending to backend
- Verifies totalCost is present for each meal
- Adds detailed logging for debugging

## 📊 Meal Structure Reference

### Correct Structure
```javascript
{
  day: 1,                           // Day number (1-based)
  date: "2025-10-26T00:00:00.000Z", // ISO date string
  mealType: "breakfast",            // "breakfast" | "lunch" | "dinner"
  scheduledTime: "2025-10-26T07:30:00.000Z",
  items: [
    {
      foodId: "507f1f77bcf86cd799439011",
      _id: "507f1f77bcf86cd799439011",
      name: "Scrambled Eggs",
      price: 500,
      quantity: 2,
      category: "Breakfast",
      description: "Fresh scrambled eggs"
    }
  ],
  totalCost: 1000  // Sum of (price × quantity) for all items
}
```

## 🔄 Calculation Flow

### 1. User Selection (DailyMealSelector)
- User selects menu items for each day/meal
- Each meal stores items with quantities
- Calculates `totalCost` per meal

### 2. Frontend Display (IntegratedBookingFlow)
- Uses `calculateBookingCost()` to sum all `meal.totalCost`
- Displays breakdown in UI
- Shows total food cost in confirmation

### 3. Payload Creation (createBookingPayload)
- Validates all meals have `totalCost`
- Ensures all items have `foodId`
- Creates standardized payload

### 4. Backend Calculation (bookingService.calculateBookingCost)
- Recalculates from `selectedMeals` using same logic
- Sums `meal.totalCost` for each meal
- Falls back to calculating from items if needed
- Creates complete cost breakdown

### 5. Database Storage (Booking model)
- Stores `selectedMeals` array with all meal details
- Stores `costBreakdown` with complete breakdown
- Used by meal plan service to create food orders

## 🧪 Testing Checklist

### Before Testing
- [ ] Backend server is running
- [ ] Frontend dev server is running
- [ ] MongoDB is accessible
- [ ] User is authenticated

### Test Scenarios

#### 1. Basic Meal Plan Booking
- [ ] Select room and dates
- [ ] Choose "Half Board" food plan
- [ ] Select menu items for each day/meal
- [ ] Verify cost displays correctly in UI
- [ ] Submit booking
- [ ] Check backend logs for calculation
- [ ] Verify booking saved with correct amounts
- [ ] Check database: `db.bookings.findOne({ bookingNumber: 'BK...' })`

#### 2. Full Board Booking
- [ ] Select "Full Board" plan
- [ ] Select breakfast, lunch, dinner items for each day
- [ ] Verify total calculation
- [ ] Submit and verify backend

#### 3. À la carte Booking
- [ ] Select "À la carte" plan
- [ ] Select custom combination of meals
- [ ] Verify calculation
- [ ] Submit and verify

#### 4. Edge Cases
- [ ] Booking with no meals (food plan = None)
- [ ] Booking with meals then removing them
- [ ] Booking with different quantities per item
- [ ] Multi-night booking with varied meal selections

### Verification Points

#### Frontend Console Logs
Look for:
```
💰 Frontend: Day-by-day meal calculation: { mealsCount, totalMealCost, mealsDetails }
📦 Creating booking payload: { roomTitle, nights, foodPlan, mealsCount, totalMealCost, totalAmount }
✅ Submitting booking with validated payload
```

#### Backend Console Logs
Look for:
```
💰 Backend calculated meal cost from day-by-day structure: { foodPlan, mealsCount, totalMealCost, breakdown }
✅ Final booking status: [status]
```

#### Database Verification
```javascript
// MongoDB query to check booking
db.bookings.findOne(
  { bookingNumber: 'BK...' },
  { 
    costBreakdown: 1, 
    selectedMeals: 1, 
    foodPlan: 1,
    totalPrice: 1
  }
)

// Should see:
{
  foodPlan: "Half Board",
  selectedMeals: [
    { day: 1, mealType: "breakfast", items: [...], totalCost: 1500 },
    { day: 1, mealType: "dinner", items: [...], totalCost: 2000 }
  ],
  costBreakdown: {
    roomCost: 5000,
    mealPlanCost: 3500,  // ✅ Should match sum of selectedMeals.totalCost
    subtotal: 8500,
    tax: 1020,           // 12% of subtotal
    serviceFee: 850,     // 10% of subtotal
    total: 10370
  },
  totalPrice: 10370
}
```

## 🔍 Debugging Tips

### If Meal Costs Are Still Wrong

1. **Check Frontend Logs:**
   ```
   - Is totalCost present in selectedMeals?
   - Are items being properly structured?
   - Is createBookingPayload validating correctly?
   ```

2. **Check Backend Logs:**
   ```
   - Is backend receiving selectedMeals correctly?
   - Is calculateBookingCost using day-by-day logic?
   - Are there any warnings about flat rates being used?
   ```

3. **Check Network Request:**
   ```javascript
   // In browser DevTools > Network > bookings endpoint
   // Request Payload should show:
   {
     selectedMeals: [
       {
         day: 1,
         mealType: "breakfast",
         items: [...],
         totalCost: 1500  // ✅ Must be present
       }
     ]
   }
   ```

4. **Check Database:**
   ```javascript
   // Verify the booking document has correct structure
   db.bookings.findOne({ _id: ObjectId("...") })
   ```

### Common Issues

1. **totalCost is 0 but items are selected**
   - Check if DailyMealSelector is calculating totalCost correctly
   - Verify IntegratedBookingFlow is preserving totalCost when updating state

2. **Backend uses flat rates instead of items**
   - Check if selectedMeals is being passed correctly
   - Verify backend receives non-empty selectedMeals array

3. **Food cost multiplied incorrectly**
   - Check if backend is multiplying by guests/nights (should NOT)
   - Verify frontend is using day-by-day structure (not old flat structure)

## 📝 Files Changed

1. **Backend:**
   - `backend/services/booking/bookingService.js` (lines 245-322)

2. **Frontend:**
   - `frontend/src/utils/bookingCalculations.js` (lines 88-136, 281-414)
   - `frontend/src/components/booking/IntegratedBookingFlow.jsx` (lines 238-279)

3. **Documentation:**
   - `BOOKING_MEAL_CALCULATION_FIX.md` (this file)

## 🎉 Expected Results

After this fix:

✅ Frontend calculates meal costs correctly from selected items
✅ Backend recalculates using same logic (day-by-day structure)
✅ Database stores correct amounts
✅ Invoice creation uses correct amounts
✅ Meal plan orders are created with correct prices
✅ Taxes and service charges calculated on correct subtotal

## 🔗 Related Systems

These systems use the booking meal data:

1. **Meal Plan Service** (`backend/services/mealPlanService.js`)
   - Creates FoodOrders from `selectedMeals`
   - Uses `meal.totalCost` and `meal.items[]`

2. **Invoice Service** (`backend/services/payment/invoiceService.js`)
   - Uses `costBreakdown.mealPlanCost` for invoice line items

3. **Kitchen Dashboard** (frontend)
   - Displays meal plan orders from bookings

4. **Check-in/Check-out** (backend)
   - Validates meal plan orders exist for bookings

## 📞 Support

If issues persist after this fix:

1. Collect all console logs (frontend + backend)
2. Export the problematic booking from database
3. Check the meal structure at each step
4. Verify all files have the latest changes
5. Clear browser cache and restart servers

---

**Version:** 2.2  
**Date:** October 25, 2025  
**Status:** ✅ Complete  
**Tested:** ⏳ Awaiting user testing

