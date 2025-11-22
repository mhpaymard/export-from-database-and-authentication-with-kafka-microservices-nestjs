#!/bin/bash

# Export Features Test Script
# Tests: JSON parsing, Schema API, Date filters, Download mode, PDF export

echo "=================================================="
echo "    Export Service Features Test"
echo "=================================================="
echo ""

# Configuration
GATEWAY_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)
ADMIN_USERNAME="admin_test_$TIMESTAMP"
ADMIN_EMAIL="admin$TIMESTAMP@test.com"
ADMIN_PASSWORD="Test123456"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for Gateway
echo -e "${YELLOW}Waiting for Gateway to be ready...${NC}"
for i in {1..30}; do
    if curl -s "$GATEWAY_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Gateway is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Test 1: Create Admin User
echo -e "${YELLOW}Test 1: Creating admin user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$ADMIN_USERNAME\",
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"role\": \"admin\",
    \"firstName\": \"Admin\",
    \"lastName\": \"Test\"
  }")

echo "$REGISTER_RESPONSE" | head -20
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Failed to create admin user${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Admin user created successfully${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test 2: JSON Export (Parsed Data)
echo -e "${YELLOW}Test 2: Testing JSON export with parsed data...${NC}"
JSON_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "limit": 5
  }')

echo "$JSON_RESPONSE" | head -30
if echo "$JSON_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ JSON export successful${NC}"
else
    echo -e "${RED}✗ JSON export failed${NC}"
fi
echo ""

# Test 3: Database Schema API
echo -e "${YELLOW}Test 3: Testing schema metadata API...${NC}"
SCHEMA_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/export/schema" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$SCHEMA_RESPONSE" | head -50
if echo "$SCHEMA_RESPONSE" | grep -q '"tableName":"users"'; then
    echo -e "${GREEN}✓ Schema API working${NC}"
else
    echo -e "${RED}✗ Schema API failed${NC}"
fi
echo ""

# Test 4: Date Filter Export
echo -e "${YELLOW}Test 4: Testing date range filtering...${NC}"
DATE_FILTER_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "fromDate": "2025-11-22T00:00:00.000Z",
    "toDate": "2025-11-22T23:59:59.999Z"
  }')

echo "$DATE_FILTER_RESPONSE" | head -30
if echo "$DATE_FILTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Date filtering works${NC}"
else
    echo -e "${RED}✗ Date filtering failed${NC}"
fi
echo ""

# Test 5: CSV Download Mode
echo -e "${YELLOW}Test 5: Testing CSV export with download=true...${NC}"
curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "csv",
    "download": true,
    "limit": 10
  }' \
  -o "test_users.csv" 2>&1

if [ -f "test_users.csv" ] && [ -s "test_users.csv" ]; then
    echo -e "${GREEN}✓ CSV file downloaded successfully${NC}"
    echo "File size: $(wc -c < test_users.csv) bytes"
    echo "First 5 lines:"
    head -5 test_users.csv
else
    echo -e "${RED}✗ CSV download failed${NC}"
fi
echo ""

# Test 6: Excel Download Mode
echo -e "${YELLOW}Test 6: Testing Excel export with download=true...${NC}"
curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "excel",
    "download": true,
    "limit": 10
  }' \
  -o "test_users.xlsx" 2>&1

if [ -f "test_users.xlsx" ] && [ -s "test_users.xlsx" ]; then
    echo -e "${GREEN}✓ Excel file downloaded successfully${NC}"
    echo "File size: $(wc -c < test_users.xlsx) bytes"
    file test_users.xlsx 2>/dev/null || echo "Excel file created"
else
    echo -e "${RED}✗ Excel download failed${NC}"
fi
echo ""

# Test 7: PDF Export (NEW FEATURE)
echo -e "${YELLOW}Test 7: Testing PDF export with download=true...${NC}"
curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "pdf",
    "download": true,
    "limit": 10
  }' \
  -o "test_users.pdf" 2>&1

if [ -f "test_users.pdf" ] && [ -s "test_users.pdf" ]; then
    echo -e "${GREEN}✓ PDF file downloaded successfully${NC}"
    echo "File size: $(wc -c < test_users.pdf) bytes"
    file test_users.pdf 2>/dev/null || echo "PDF file created"
else
    echo -e "${RED}✗ PDF download failed${NC}"
fi
echo ""

# Test 8: Combined Features (Date Filter + PDF + Custom Columns)
echo -e "${YELLOW}Test 8: Testing combined features (date + PDF + columns)...${NC}"
curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "pdf",
    "download": true,
    "columns": ["id", "username", "email", "role", "created_at"],
    "fromDate": "2025-11-22T00:00:00.000Z",
    "limit": 20
  }' \
  -o "test_users_filtered.pdf" 2>&1

if [ -f "test_users_filtered.pdf" ] && [ -s "test_users_filtered.pdf" ]; then
    echo -e "${GREEN}✓ Combined features PDF created${NC}"
    echo "File size: $(wc -c < test_users_filtered.pdf) bytes"
else
    echo -e "${RED}✗ Combined features failed${NC}"
fi
echo ""

# Test 9: Inline JSON vs Download Mode
echo -e "${YELLOW}Test 9: Testing inline JSON (download=false)...${NC}"
INLINE_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/export/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "download": false,
    "limit": 3
  }')

if echo "$INLINE_RESPONSE" | grep -q '"data":\['; then
    echo -e "${GREEN}✓ Inline JSON mode working${NC}"
    echo "Record count: $(echo "$INLINE_RESPONSE" | grep -o '"recordCount":[0-9]*' | cut -d':' -f2)"
else
    echo -e "${RED}✗ Inline JSON failed${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "    Test Summary"
echo "=================================================="
echo ""
echo "Generated Files:"
ls -lh test_users* 2>/dev/null | awk '{print $9, $5}'
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open test_users.pdf to verify PDF formatting"
echo "  2. Open test_users.xlsx in Excel"
echo "  3. Check test_users.csv content"
echo "  4. Review API responses for data accuracy"
echo ""
