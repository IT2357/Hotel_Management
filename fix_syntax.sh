#!/bin/bash

# Fix syntax errors caused by extra quotes
find frontend/src -name "*.jsx" -exec sed -i '' \
  -e "s|from.*components/ui/Button'';|from '../components/ui/Button';|g" \
  -e "s|from.*components/ui/Badge'';|from '../components/ui/Badge';|g" \
  -e "s|from.*components/ui/Card'';|from '../components/ui/Card';|g" \
  -e "s|from.*components/ui/Input'';|from '../components/ui/Input';|g" \
  -e "s|from.*components/ui/Textarea'';|from '../components/ui/Textarea';|g" \
  -e "s|from.*components/ui/Select'';|from '../components/ui/Select';|g" \
  -e "s|from.*components/ui/Label'';|from '../components/ui/Label';|g" \
  -e "s|from.*components/ui/Button\";|from '../components/ui/Button';|g" \
  -e "s|from.*components/ui/Card\";|from '../components/ui/Card';|g" \
  -e "s|from.*components/ui/Input\";|from '../components/ui/Input';|g" \
  -e "s|from.*components/ui/Textarea\";|from '../components/ui/Textarea';|g" \
  -e "s|from.*components/ui/Select\";|from '../components/ui/Select';|g" \
  -e "s|from.*components/ui/Badge\";|from '../components/ui/Badge';|g" \
  -e "s|from.*components/ui/Label\";|from '../components/ui/Label';|g" \
  {} \;

echo "Syntax errors fixed"
