#!/bin/bash

# ==========================================
# Hotel Management System - Setup Script
# ==========================================
# This script automates the setup process

set -e  # Exit on error

echo "🏨 Hotel Management System - Production Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
print_info "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found! Please install Node.js v18 or higher"
    exit 1
fi

# Check npm
print_info "Checking npm installation..."
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

# Check MongoDB
print_info "Checking MongoDB installation..."
if command_exists mongod; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    print_success "MongoDB installed: $MONGO_VERSION"
else
    print_warning "MongoDB not found locally. Will use MongoDB Atlas."
fi

echo ""
echo "=============================================="
echo "📦 Installing Dependencies"
echo "=============================================="
echo ""

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"
cd ..

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
npm install
print_success "Frontend dependencies installed"
cd ..

echo ""
echo "=============================================="
echo "⚙️  Environment Configuration"
echo "=============================================="
echo ""

# Create .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    print_info "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    print_success "backend/.env created"
    print_warning "Please edit backend/.env with your configuration"
else
    print_success "backend/.env already exists"
fi

# Generate JWT Secret
print_info "Generating JWT Secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
print_success "JWT Secret generated"

# Generate Encryption Key
print_info "Generating Encryption Key..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
print_success "Encryption Key generated"

# Update .env with generated secrets
print_info "Would you like to update .env with generated secrets? (y/n)"
read -r UPDATE_ENV

if [ "$UPDATE_ENV" = "y" ] || [ "$UPDATE_ENV" = "Y" ]; then
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
    sed -i.bak "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" backend/.env
    rm backend/.env.bak
    print_success "Secrets updated in backend/.env"
fi

echo ""
echo "=============================================="
echo "🗄️  Database Setup"
echo "=============================================="
echo ""

print_info "Would you like to seed the database with sample data? (y/n)"
read -r SEED_DB

if [ "$SEED_DB" = "y" ] || [ "$SEED_DB" = "Y" ]; then
    print_info "Seeding database..."
    cd backend
    npm run seed
    print_success "Database seeded"
    cd ..
fi

echo ""
echo "=============================================="
echo "🔐 Google Vision API Setup"
echo "=============================================="
echo ""

if [ ! -f "backend/config/google-credentials.json" ]; then
    print_warning "Google Vision credentials not found"
    print_info "Do you have a Google Cloud credentials JSON file? (y/n)"
    read -r HAS_GOOGLE_CREDS
    
    if [ "$HAS_GOOGLE_CREDS" = "y" ] || [ "$HAS_GOOGLE_CREDS" = "Y" ]; then
        print_info "Please enter the full path to your credentials file:"
        read -r CREDS_PATH
        
        if [ -f "$CREDS_PATH" ]; then
            cp "$CREDS_PATH" backend/config/google-credentials.json
            print_success "Google Vision credentials copied"
        else
            print_error "File not found: $CREDS_PATH"
        fi
    else
        print_info "You can add it later to backend/config/google-credentials.json"
    fi
else
    print_success "Google Vision credentials found"
fi

echo ""
echo "=============================================="
echo "📧 Email Configuration"
echo "=============================================="
echo ""

print_info "Would you like to configure email settings now? (y/n)"
read -r CONFIG_EMAIL

if [ "$CONFIG_EMAIL" = "y" ] || [ "$CONFIG_EMAIL" = "Y" ]; then
    print_info "Enter SMTP host (e.g., smtp.gmail.com):"
    read -r SMTP_HOST
    
    print_info "Enter SMTP port (e.g., 465):"
    read -r SMTP_PORT
    
    print_info "Enter SMTP user (email address):"
    read -r SMTP_USER
    
    print_info "Enter SMTP password (app password):"
    read -rs SMTP_PASS
    echo ""
    
    # Update .env
    sed -i.bak "s/SMTP_HOST=.*/SMTP_HOST=$SMTP_HOST/" backend/.env
    sed -i.bak "s/SMTP_PORT=.*/SMTP_PORT=$SMTP_PORT/" backend/.env
    sed -i.bak "s/SMTP_USER=.*/SMTP_USER=$SMTP_USER/" backend/.env
    sed -i.bak "s/SMTP_PASS=.*/SMTP_PASS=$SMTP_PASS/" backend/.env
    rm backend/.env.bak
    
    print_success "Email settings configured"
fi

echo ""
echo "=============================================="
echo "🎨 Frontend Configuration"
echo "=============================================="
echo ""

# Create vite config if needed
if [ ! -f "frontend/.env" ]; then
    print_info "Creating frontend/.env..."
    echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
    print_success "frontend/.env created"
fi

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""

print_success "All dependencies installed"
print_success "Configuration files created"
print_success "Database ready"

echo ""
echo "📝 Next Steps:"
echo "=============================================="
echo "1. Review and update backend/.env with your settings"
echo "2. Add Google Vision credentials (if needed)"
echo "3. Configure email SMTP settings (if needed)"
echo ""
echo "🚀 To start the application:"
echo "=============================================="
echo "Backend:  cd backend && npm run dev"
echo "Frontend: cd frontend && npm run dev"
echo ""
echo "Or use: npm run dev (from root directory)"
echo ""
echo "📚 Documentation:"
echo "=============================================="
echo "- Production Config: PRODUCTION_CONFIG_GUIDE.md"
echo "- Food System: FOOD_SYSTEM_IMPLEMENTATION_SUMMARY.md"
echo "- API Docs: http://localhost:5000/api-docs (after starting)"
echo ""

print_success "Happy coding! 🎉"
