#!/bin/bash
echo "🧪 AUTHENTICATION SYSTEM TEST"
echo "================================"

# Test backend health
echo "1. Testing Backend Health..."
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    echo "✅ Backend: http://localhost:5000/health - OK"
else
    echo "❌ Backend: http://localhost:5000/health - FAILED"
fi

# Test frontend
echo "2. Testing Frontend..."
if curl -s http://localhost:5173 | grep -q "vite"; then
    echo "✅ Frontend: http://localhost:5173 - OK"
else
    echo "❌ Frontend: http://localhost:5173 - FAILED"
fi

# Test auth endpoints
echo "3. Testing Auth Endpoints..."
for user in "admin@test.com" "guest@test.com"; do
    echo "Testing login for: $user"
    if curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$user\", \"password\": \"${user%%@*}123\"}" | grep -q "success"; then
        echo "✅ Login: $user - OK"
    else
        echo "❌ Login: $user - FAILED"
    fi
done

echo ""
echo "🎯 ACCESS URLs:"
echo "📱 Frontend: http://localhost:5173"
echo "🔐 AuthTestPage: http://localhost:5173/auth-test"
echo "👤 Login: http://localhost:5173/login"
echo "⚙️ Admin Dashboard: http://localhost:5173/admin/dashboard"
echo ""
echo "🧪 TEST CREDENTIALS:"
echo "Admin: admin@test.com / admin123"
echo "Guest: guest@test.com / guest123"
echo "Manager: manager@test.com / manager123"
echo "Staff: staff@test.com / staff123"
