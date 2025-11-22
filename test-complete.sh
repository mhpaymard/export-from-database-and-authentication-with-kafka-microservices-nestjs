#!/bin/bash

echo "🧪 Testing Auth System - Step by Step"
echo "======================================"
echo ""

# Kill all existing node processes
echo "1️⃣ Stopping all Node.js processes..."
taskkill //F //IM node.exe 2>&1 | grep SUCCESS | head -3
sleep 2

# Start Auth Service
echo ""
echo "2️⃣ Starting Auth Service..."
cd "/d/6 - hooshan-kavosh-borna/1 - first-tasks/auth-service"
npm run start:dev > auth-service.log 2>&1 &
AUTH_PID=$!
echo "   Auth Service PID: $AUTH_PID"

# Start Gateway
echo ""
echo "3️⃣ Starting Gateway..."
cd "/d/6 - hooshan-kavosh-borna/1 - first-tasks/gateway"
npm run start:dev > gateway.log 2>&1 &
GATEWAY_PID=$!
echo "   Gateway PID: $GATEWAY_PID"

# Wait for services to start
echo ""
echo "4️⃣ Waiting for services to start (15 seconds)..."
for i in {15..1}; do
  echo -ne "   $i seconds remaining...\r"
  sleep 1
done
echo ""

# Test Health
echo ""
echo "5️⃣ Testing Health Endpoint..."
HEALTH=$(curl -s http://localhost:3000/health)
echo "   $HEALTH"

# Test Login
echo ""
echo "6️⃣ Testing Login with john_doe..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}')

echo "   Response: $LOGIN_RESPONSE"

# Check if we got a token
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo ""
  echo "✅ SUCCESS! Login worked!"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "   Token: ${TOKEN:0:50}..."
  
  # Test Profile
  echo ""
  echo "7️⃣ Testing Profile Endpoint..."
  PROFILE=$(curl -s -X GET http://localhost:3000/api/auth/profile \
    -H "Authorization: Bearer $TOKEN")
  echo "   $PROFILE"
else
  echo ""
  echo "❌ FAILED! No token received"
  echo ""
  echo "📋 Auth Service Log:"
  tail -20 "/d/6 - hooshan-kavosh-borna/1 - first-tasks/auth-service/auth-service.log"
  echo ""
  echo "📋 Gateway Log:"
  tail -20 "/d/6 - hooshan-kavosh-borna/1 - first-tasks/gateway/gateway.log"
fi

echo ""
echo "======================================"
echo "Test complete. Services are still running."
echo "To stop: taskkill //F //IM node.exe"
