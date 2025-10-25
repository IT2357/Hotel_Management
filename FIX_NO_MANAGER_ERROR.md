# Fix: No Manager Available Error

## Problem
Error when sending message: `No manager available to receive messages`

## Cause
The backend cannot find any active manager in the database.

## Solution

### Option 1: Check Existing Managers
Run this in MongoDB:
```javascript
db.users.find({ role: { $in: ['manager', 'admin'] } })
```

### Option 2: Create a Manager Account
If no manager exists, create one:

1. **Via Registration:**
   - Go to `/register`
   - Create account
   - Set role to 'manager'

2. **Via Database (MongoDB):**
```javascript
db.users.updateOne(
  { email: "your-email@hotel.com" },
  { 
    $set: { 
      role: "manager",
      isActive: true 
    } 
  }
)
```

### Option 3: Activate Existing Manager
If manager exists but is inactive:

```javascript
db.users.updateOne(
  { role: "manager" },
  { $set: { isActive: true } }
)
```

## Verification

After fixing, check:
```javascript
// In MongoDB
db.users.find({ 
  role: { $in: ['manager', 'admin'] },
  isActive: true 
}).count()

// Should return at least 1
```

Then try sending a message again!
