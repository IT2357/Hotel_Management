# 🔧 Contact Page Not Showing Changes - Troubleshooting Guide

## Quick Diagnosis

### Step 1: Open Browser Console (F12)

1. Press `F12` to open Developer Tools
2. Click on the "Console" tab
3. Navigate to `/contact` page
4. Look for these log messages:

```
📦 Contact Page - User Data: {...}
✅ Contact Page - Parsed User: {...}
👤 Contact Page - User Role: staff
🔍 Contact Page - Current user state: {...}
🔍 Contact Page - Should show chat? true
✅ Contact Page - Rendering StaffContactChat
```

## Common Issues & Solutions

### ❌ Issue 1: "No user data in localStorage"

**Symptom:** You see this in console:
```
⚠️ Contact Page - No user data in localStorage
🔍 Contact Page - Current user state: null
🔍 Contact Page - Should show chat? false
📋 Contact Page - Rendering traditional contact form
```

**Solution:**
1. You're not logged in
2. Go to `/login`
3. Login with staff credentials
4. Then visit `/contact` again

---

### ❌ Issue 2: Wrong User Role

**Symptom:** You see this in console:
```
👤 Contact Page - User Role: guest
🔍 Contact Page - Should show chat? false
```

**Solution:**
1. You're logged in but not as staff
2. The chat only works for these roles:
   - `staff`
   - `chef`
   - `kitchen`
3. Logout and login with a staff account

---

### ❌ Issue 3: Component Not Loading

**Symptom:** You see errors in console like:
```
Error: Cannot find module './staff/StaffContactChat'
Failed to fetch StaffContactChat
```

**Solution:**
```bash
# Stop the dev server (Ctrl+C)
# Then restart it
cd frontend
npm run dev
```

---

### ❌ Issue 4: Browser Cache

**Symptom:** Old Contact page still showing despite being logged in as staff

**Solution:**
1. **Hard Refresh:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Cache:**
   - Press `F12`
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Or clear storage:**
   - F12 → Application → Storage → Clear site data

---

### ❌ Issue 5: Dev Server Not Restarted

**Symptom:** Changes not reflecting

**Solution:**
```bash
# Terminal 1: Restart Frontend
cd frontend
# Ctrl+C to stop
npm run dev

# Terminal 2: Backend should be running
cd backend
npm start
```

---

## ✅ Verification Steps

### 1. Check if you're logged in as staff:

Open Console (F12) and run:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user?.role);
console.log('Is Staff?', ['staff', 'chef', 'kitchen'].includes(user?.role));
```

Expected output:
```
Role: staff
Is Staff?: true
```

### 2. Check if StaffContactChat component loads:

Look for any errors in console when you visit `/contact`

Expected: No red errors

### 3. Test the debug page:

Visit: `http://localhost:5173/contact-test`

This will show you:
- ✅ Your login status
- ✅ Your current role
- ✅ What page should render

---

## 🎯 Quick Fix Script

Run this in your browser console (F12):

```javascript
// Check current state
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('=== CONTACT PAGE DEBUG ===');
console.log('Logged in:', !!user._id);
console.log('User role:', user.role);
console.log('Should show chat:', ['staff', 'chef', 'kitchen'].includes(user.role));
console.log('User data:', user);

// If you need to manually set a staff user for testing:
// ⚠️ Only use this for testing!
// localStorage.setItem('user', JSON.stringify({
//   _id: '123',
//   name: 'Test Staff',
//   email: 'staff@test.com',
//   role: 'staff'
// }));
// location.reload();
```

---

## 📋 Step-by-Step: Start from Scratch

If nothing works, follow these steps:

### 1. **Stop Everything**
```bash
# Ctrl+C in both terminals (frontend & backend)
```

### 2. **Clear Browser Data**
- F12 → Application → Clear storage
- Close browser completely
- Reopen browser

### 3. **Restart Backend**
```bash
cd backend
npm start
```

Wait for:
```
✅ Server running on port 5000
✅ MongoDB connected
✅ Socket.io initialized
```

### 4. **Restart Frontend**
```bash
cd frontend
npm run dev
```

Wait for:
```
  ➜  Local:   http://localhost:5173/
```

### 5. **Login as Staff**
1. Go to `http://localhost:5173/login`
2. Login with staff credentials
3. Check console for user data

### 6. **Visit Contact Page**
1. Go to `http://localhost:5173/contact`
2. Open console (F12)
3. Look for the debug logs

---

## 🔍 What You Should See

### If Logged in as Staff:

**Contact Page should show:**
- ✅ WhatsApp-style green header
- ✅ "Manager Name" at top
- ✅ Chat interface with message input
- ✅ Emoji picker button
- ✅ Send button

**Console should show:**
```
✅ Contact Page - Rendering StaffContactChat
Socket connected: xyz123
```

### If Not Staff or Not Logged In:

**Contact Page should show:**
- 📋 Traditional contact form
- Form fields (Name, Email, Subject, Message)
- Contact information cards

**Console should show:**
```
📋 Contact Page - Rendering traditional contact form
```

---

## 🆘 Still Not Working?

### Check These Files Exist:

```bash
# Run in terminal
ls frontend/src/pages/Contact.jsx
ls frontend/src/pages/staff/StaffContactChat.jsx
ls frontend/src/services/staffMessagingAPI.js
```

All should exist.

### Check for Compilation Errors:

Look at the terminal running `npm run dev`:
- ❌ Red errors? Fix them first
- ✅ No errors? Continue troubleshooting

### Check Network Tab:

1. F12 → Network tab
2. Visit `/contact`
3. Look for:
   - `Contact.jsx` loaded?
   - `StaffContactChat.jsx` loaded?
   - Any 404 errors?

---

## 📞 Debug Checklist

Before asking for help, check:

- [ ] Frontend dev server is running
- [ ] Backend server is running
- [ ] Logged in to the application
- [ ] Logged in as staff/chef/kitchen role
- [ ] Hard refreshed the page (Ctrl+Shift+R)
- [ ] Checked browser console for errors
- [ ] No red errors in terminal
- [ ] StaffContactChat.jsx file exists
- [ ] Dependencies installed (`framer-motion`, `socket.io-client`)

---

## 🎓 Understanding the Logic

```javascript
// In Contact.jsx
if (user && (user.role === 'staff' || user.role === 'chef' || user.role === 'kitchen')) {
  return <StaffContactChat />;  // ← WhatsApp chat
}
// else shows traditional form
```

So you need:
1. `user` to exist (logged in)
2. `user.role` to be one of: `staff`, `chef`, or `kitchen`

---

## ✅ Success Indicators

You'll know it's working when you see:

1. **In Console:**
   ```
   ✅ Contact Page - Rendering StaffContactChat
   ✅ Socket connected: [some-id]
   ```

2. **On Screen:**
   - Green header (WhatsApp style)
   - Chat interface
   - Message input at bottom
   - No traditional contact form

3. **You can:**
   - Type messages
   - See emoji picker
   - Send messages
   - See timestamps

---

**Last Updated:** Oct 25, 2025  
**File:** CONTACT_PAGE_TROUBLESHOOTING.md
