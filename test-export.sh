#!/bin/bash

echo "🧹 Cleaning up old processes..."
taskkill //F //IM node.exe 2>&1 | head -3
sleep 2

echo ""
echo "🚀 Starting all services..."
echo ""

# Start Gateway
echo "📡 Starting Gateway on port 3000..."
cd gateway
npm run start:dev > ../logs/gateway.log 2>&1 &
GATEWAY_PID=$!
cd ..

# Start Auth Service  
echo "🔐 Starting Auth Service on port 3001..."
cd auth-service
npm run start:dev > ../logs/auth.log 2>&1 &
AUTH_PID=$!
cd ..

# Start Export Service
echo "📤 Starting Export Service on port 3002..."
cd export-service
npm run start:dev > ../logs/export.log 2>&1 &
EXPORT_PID=$!
cd ..

echo ""
echo "⏳ Waiting 20 seconds for services to initialize..."
sleep 20

echo ""
echo "✅ All services should be running:"
echo "   - Gateway: http://localhost:3000"
echo "   - Auth Service: http://localhost:3001"
echo "   - Export Service: http://localhost:3002"
echo "   - Swagger: http://localhost:3000/api"
echo ""

# Test 1: Login as admin
echo "🔑 Test 1: Login as admin..."
ADMIN_TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"admin123"}' \
  | python -m json.tool | grep -oP '(?<="access_token": ")[^"]*')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin token received: ${ADMIN_TOKEN:0:50}..."
echo ""

# Test 2: Export users table to CSV
echo "📊 Test 2: Export users table to CSV..."
curl -s -o users_export.csv http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "table": "users",
    "format": "csv"
  }'

if [ -f users_export.csv ] && [ -s users_export.csv ]; then
  echo "✅ CSV export successful:"
  head -5 users_export.csv
else
  echo "❌ CSV export failed"
fi
echo ""

# Test 3: Export with filter to JSON
echo "📊 Test 3: Export filtered users to JSON..."
curl -s http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "table": "users",
    "columns": ["id", "username", "email", "role"],
    "where": "role = '"'"'user'"'"'",
    "format": "json"
  }' | python -m json.tool

echo ""

# Test 4: Try export as regular user (should fail with 403)
echo "🔒 Test 4: Try export as regular user (should fail)..."
USER_TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}' \
  | python -m json.tool | grep -oP '(?<="access_token": ")[^"]*')

curl -s http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "table": "users",
    "format": "json"
  }' | python -m json.tool

echo ""
echo ""
echo "✅ All tests completed!"
echo ""
echo "💡 To view service logs:"
echo "   tail -f logs/gateway.log"
echo "   tail -f logs/auth.log"
echo "   tail -f logs/export.log"
