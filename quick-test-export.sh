#!/bin/bash

echo "🔑 Getting admin token..."
ADMIN_TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"admin123"}' \
  | grep -o '"access_token":"[^"]*"' \
  | cut -d'"' -f4)

echo "Token: ${ADMIN_TOKEN:0:50}..."
echo ""

echo "📊 Test 1: Export users to JSON..."
curl -s http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"table":"users","format":"json"}' \
  -o export_users.json

echo "Response saved to export_users.json"
cat export_users.json | python -m json.tool 2>/dev/null || cat export_users.json
echo ""
echo ""

echo "📊 Test 2: Export users to CSV..."
curl -s http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"table":"users","format":"csv"}' \
  -o export_users.csv

echo "Response saved to export_users.csv"
head -10 export_users.csv
echo ""
echo ""

echo "🔒 Test 3: Try with regular user (should fail)..."
USER_TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}' \
  | grep -o '"access_token":"[^"]*"' \
  | cut -d'"' -f4)

curl -s http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"table":"users","format":"json"}'
echo ""
echo ""

echo "✅ Tests completed!"
