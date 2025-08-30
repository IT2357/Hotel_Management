#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

# Check if in git repository
if [ ! -d .git ]; then
    echo "❌ Not a git repository. Please run this from the project root."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo "🚀 Committing changes to branch: $CURRENT_BRANCH"

# Add all changes
git add .

# Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "🔧 Clean up and finalize food management system - $TIMESTAMP"

echo "✅ Changes committed successfully!"
echo "   Branch: $CURRENT_BRANCH"
echo "   To push changes: git push origin $CURRENT_BRANCH"
