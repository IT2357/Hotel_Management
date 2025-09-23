#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

echo "🚀 Starting cleanup process..."

# Remove duplicate frontend files
echo "🧹 Removing duplicate frontend files..."
rm -f frontend/src/pages/menu/ValdorMenuPage.jsx
rm -f frontend/src/pages/guest/GuestDashboardPage.jsx
rm -f frontend/src/pages/guest/GuestDashboardPageSimple.jsx

# Clean up any .DS_Store files
find . -name ".DS_Store" -delete

echo "✅ Cleanup complete!"
