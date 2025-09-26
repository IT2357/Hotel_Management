#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

echo "🚀 Setting up MongoDB..."

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "📥 MongoDB not found. Installing MongoDB Community Edition..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew tap mongodb/brew
    brew install mongodb-community@7.0
fi

# Start MongoDB service
echo "🚀 Starting MongoDB..."
brew services start mongodb-community

# Create necessary collections
echo "📂 Setting up database collections..."
mongosh --eval "
    use hotel_management;
    db.createCollection('menuItems');
    db.createCollection('categories');
    db.createCollection('orders');
    db.createCollection('customers');
"

echo "✅ MongoDB setup complete!"
echo "   - Database: hotel_management"
echo "   - Collections: menuItems, categories, orders, customers"
