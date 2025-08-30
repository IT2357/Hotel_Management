#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

echo "🚀 Testing menu and order flow..."

# Start backend
echo "🔄 Starting backend server..."
cd backend
npm install
npm run dev &

# Give server time to start
sleep 5

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test menu items endpoint
echo -e "\n📋 Testing menu items..."
curl -s http://localhost:5000/api/menu/items | jq '.[0:2]'  # Show first 2 items

# Test categories endpoint
echo -e "\n📋 Testing categories..."
curl -s http://localhost:5000/api/menu/categories | jq

echo -e "\n✅ Test flow completed!"
echo "Access the frontend at: http://localhost:5174"
