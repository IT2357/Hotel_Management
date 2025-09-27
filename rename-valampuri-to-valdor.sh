#!/bin/bash

# 🔄 COMPREHENSIVE RENAMING SCRIPT: VALAMPURI → VALDOR
echo "🔄 Starting comprehensive renaming from Valampuri to Valdor..."

# Navigate to project root
cd /Users/ahsan/Desktop/ITP/Hotel_Management

# 1. Rename backend files
echo "📁 Renaming backend files..."

# Rename controller
if [ -f "backend/controllers/valampuriFoodController.js" ]; then
    mv backend/controllers/valampuriFoodController.js backend/controllers/valdorFoodController.js
    echo "✅ Renamed valampuriFoodController.js → valdorFoodController.js"
fi

# Rename routes
if [ -f "backend/routes/valampuriFoodRoutes.js" ]; then
    mv backend/routes/valampuriFoodRoutes.js backend/routes/valdorFoodRoutes.js
    echo "✅ Renamed valampuriFoodRoutes.js → valdorFoodRoutes.js"
fi

# Rename seeding script
if [ -f "backend/scripts/seed-valampuri.js" ]; then
    mv backend/scripts/seed-valampuri.js backend/scripts/seed-valdor.js
    echo "✅ Renamed seed-valampuri.js → seed-valdor.js"
fi

# 2. Rename frontend files
echo "📁 Renaming frontend files..."

# Rename menu page
if [ -f "frontend/src/pages/ValampuriMenuPage.jsx" ]; then
    mv frontend/src/pages/ValampuriMenuPage.jsx frontend/src/pages/ValdorMenuPage.jsx
    echo "✅ Renamed ValampuriMenuPage.jsx → ValdorMenuPage.jsx"
fi

# 3. Update file contents
echo "🔧 Updating file contents..."

# Update all references in backend files
find backend -name "*.js" -type f -exec sed -i '' 's/valampuri/valdor/g' {} \;
find backend -name "*.js" -type f -exec sed -i '' 's/Valampuri/Valdor/g' {} \;
find backend -name "*.js" -type f -exec sed -i '' 's/VALAMPURI/VALDOR/g' {} \;

# Update all references in frontend files
find frontend -name "*.jsx" -type f -exec sed -i '' 's/valampuri/valdor/g' {} \;
find frontend -name "*.jsx" -type f -exec sed -i '' 's/Valampuri/Valdor/g' {} \;
find frontend -name "*.jsx" -type f -exec sed -i '' 's/VALAMPURI/VALDOR/g' {} \;

echo "✅ Updated all file contents"

# 4. Update API endpoints
echo "🔗 Updating API endpoints..."

# Update server.js
sed -i '' 's/valampuriFoodRoutes/valdorFoodRoutes/g' backend/server.js
sed -i '' 's/\/api\/valampuri/\/api\/valdor/g' backend/server.js

echo "✅ Updated API endpoints"

# 5. Update package.json scripts if any
if [ -f "backend/package.json" ]; then
    sed -i '' 's/valampuri/valdor/g' backend/package.json
fi

if [ -f "frontend/package.json" ]; then
    sed -i '' 's/valampuri/valdor/g' frontend/package.json
fi

echo "✅ Updated package.json files"

echo ""
echo "🎉 RENAMING COMPLETE!"
echo "📋 Summary of changes:"
echo "   ✅ valampuriFoodController.js → valdorFoodController.js"
echo "   ✅ valampuriFoodRoutes.js → valdorFoodRoutes.js"
echo "   ✅ seed-valampuri.js → seed-valdor.js"
echo "   ✅ ValampuriMenuPage.jsx → ValdorMenuPage.jsx"
echo "   ✅ All file contents updated"
echo "   ✅ API endpoints: /api/valampuri → /api/valdor"
echo "   ✅ All class names and references updated"
echo ""
echo "🚀 Your system is now fully renamed to VALDOR!"
echo "📝 Next steps:"
echo "   1. Restart your backend server"
echo "   2. Update any frontend routes to use /valdor-menu"
echo "   3. Test all functionality"
