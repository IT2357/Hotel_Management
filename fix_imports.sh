#!/bin/bash

# Fix all lowercase UI component imports
find frontend/src -name "*.jsx" -exec sed -i '' \
  -e 's|from.*components/ui/card|from '\''../components/ui/Card'\''|g' \
  -e 's|from.*components/ui/input|from '\''../components/ui/Input'\''|g' \
  -e 's|from.*components/ui/label|from '\''../components/ui/Label'\''|g' \
  -e 's|from.*components/ui/textarea|from '\''../components/ui/Textarea'\''|g' \
  -e 's|from.*components/ui/badge|from '\''../components/ui/Badge'\''|g' \
  -e 's|from.*components/ui/select|from '\''../components/ui/Select'\''|g' \
  -e 's|from.*components/ui/dialog|from '\''../components/ui/dialog'\''|g' \
  -e 's|from.*components/ui/separator|from '\''../components/ui/separator'\''|g' \
  -e 's|from.*components/ui/button|from '\''../components/ui/Button'\''|g' \
  {} \;

# Fix @/components/ui imports
find frontend/src -name "*.jsx" -exec sed -i '' \
  -e 's|from '\''@/components/ui/card|from '\''@/components/ui/Card'\''|g' \
  -e 's|from '\''@/components/ui/input|from '\''@/components/ui/Input'\''|g' \
  -e 's|from '\''@/components/ui/label|from '\''@/components/ui/Label'\''|g' \
  -e 's|from '\''@/components/ui/textarea|from '\''@/components/ui/Textarea'\''|g' \
  -e 's|from '\''@/components/ui/badge|from '\''@/components/ui/Badge'\''|g' \
  -e 's|from '\''@/components/ui/select|from '\''@/components/ui/Select'\''|g' \
  -e 's|from '\''@/components/ui/button|from '\''@/components/ui/Button'\''|g' \
  {} \;

# Fix ../../components/ui imports
find frontend/src -name "*.jsx" -exec sed -i '' \
  -e 's|from '\''../../components/ui/card|from '\''../../components/ui/Card'\''|g' \
  -e 's|from '\''../../components/ui/input|from '\''../../components/ui/Input'\''|g' \
  -e 's|from '\''../../components/ui/label|from '\''../../components/ui/Label'\''|g' \
  -e 's|from '\''../../components/ui/textarea|from '\''../../components/ui/Textarea'\''|g' \
  -e 's|from '\''../../components/ui/badge|from '\''../../components/ui/Badge'\''|g' \
  -e 's|from '\''../../components/ui/select|from '\''../../components/ui/Select'\''|g' \
  -e 's|from '\''../../components/ui/button|from '\''../../components/ui/Button'\''|g' \
  {} \;

echo "Import fixes completed"
