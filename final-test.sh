#!/bin/bash

echo "==================================="
echo "🧪 Complete Auth Test"
echo "==================================="

# Clean up
echo "1️⃣ Cleaning up old processes..."
taskkill //F //IM node.exe 2>&1 | grep SUCCESS | wc -l
sleep 2

# Start Auth Service
echo ""
echo "2️⃣ Starting Auth Service..."
cd "/d/6 - hooshan-kavosh-borna/1 - first-tasks/auth-service"
npm run start:dev > /tmp/auth-new.log 2>&1 &
echo "   PID: $!"

# Start Gateway
echo ""
echo "3️⃣ Starting Gateway..."
cd "/d/6 - hooshan-kavosh-borna/1 - first-tasks/gateway"
npm run start:dev > /tmp/gateway-new.log 2>&1 &
echo "   PID: $!"

# Wait
echo ""
echo "4️⃣ Waiting 15 seconds for services to start..."
sleep 15

# Check Health
echo ""
echo "5️⃣ Testing Health..."
curl -s http://localhost:3000/health | head -1

# Test Login
echo ""
echo ""
echo "6️⃣ Testing Login..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}' \
  --max-time 35)

echo "$RESPONSE" | head -5

if echo "$RESPONSE" | grep -q "access_token"; then
  echo ""
  echo "✅ SUCCESS! Login worked!"
else
  echo ""
  echo "❌ FAILED!"
  echo ""
  echo "Auth Service Log:"
  tail -15 /tmp/auth-new.log
  echo ""
  echo "Gateway Log:"
  tail -15 /tmp/gateway-new.log
fi

echo ""
echo "==================================="
