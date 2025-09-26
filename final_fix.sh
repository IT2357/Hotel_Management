#!/bin/bash

# Fix all remaining syntax errors and import issues
find frontend/src -name "*.jsx" -exec sed -i '' \
  -e 's|import Card from '\''../components/ui/card'\'';|import Card from '\''../components/ui/Card'\'';|g' \
  -e 's|import Button from '\''../components/ui/button'\'';|import Button from '\''../components/ui/Button'\'';|g' \
  -e 's|import Input from '\''../components/ui/input'\'';|import Input from '\''../components/ui/Input'\'';|g' \
  -e 's|import Select from '\''../components/ui/select'\'';|import Select from '\''../components/ui/Select'\'';|g' \
  -e 's|import Textarea from '\''../components/ui/textarea'\'';|import Textarea from '\''../components/ui/Textarea'\'';|g' \
  -e 's|import Badge from '\''../components/ui/badge'\'';|import Badge from '\''../components/ui/Badge'\'';|g' \
  -e 's|import Label from '\''../components/ui/label'\'';|import Label from '\''../components/ui/Label'\'';|g' \
  -e 's|import Card from '\''../../components/ui/card'\'';|import Card from '\''../../components/ui/Card'\'';|g' \
  -e 's|import Button from '\''../../components/ui/button'\'';|import Button from '\''../../components/ui/Button'\'';|g' \
  -e 's|import Input from '\''../../components/ui/input'\'';|import Input from '\''../../components/ui/Input'\'';|g' \
  -e 's|import Select from '\''../../components/ui/select'\'';|import Select from '\''../../components/ui/Select'\'';|g' \
  -e 's|import Textarea from '\''../../components/ui/textarea'\'';|import Textarea from '\''../../components/ui/Textarea'\'';|g' \
  -e 's|import Badge from '\''../../components/ui/badge'\'';|import Badge from '\''../../components/ui/Badge'\'';|g' \
  -e 's|import Label from '\''../../components/ui/label'\'';|import Label from '\''../../components/ui/Label'\'';|g' \
  -e 's|import Card from '\''../../../../components/ui/card'\'';|import Card from '\''../../../../components/ui/Card'\'';|g' \
  -e 's|import Button from '\''../../../../components/ui/button'\'';|import Button from '\''../../../../components/ui/Button'\'';|g' \
  -e 's|import Input from '\''../../../../components/ui/input'\'';|import Input from '\''../../../../components/ui/Input'\'';|g' \
  -e 's|import Select from '\''../../../../components/ui/select'\'';|import Select from '\''../../../../components/ui/Select'\'';|g' \
  -e 's|import Textarea from '\''../../../../components/ui/textarea'\'';|import Textarea from '\''../../../../components/ui/Textarea'\'';|g' \
  -e 's|import Badge from '\''../../../../components/ui/badge'\'';|import Badge from '\''../../../../components/ui/Badge'\'';|g' \
  -e 's|import Label from '\''../../../../components/ui/label'\'';|import Label from '\''../../../../components/ui/Label'\'';|g' \
  -e 's|import Input from '\''../ui/input'\'';|import Input from '\''../ui/Input'\'';|g' \
  -e 's|import Select from '\''../ui/select'\'';|import Select from '\''../ui/Select'\'';|g' \
  -e 's|import Textarea from '\''../ui/textarea'\'';|import Textarea from '\''../ui/Textarea'\'';|g' \
  -e 's|import Label from '\''../ui/label'\'';|import Label from '\''../ui/Label'\'';|g' \
  {} \;

echo "Final fixes completed"
