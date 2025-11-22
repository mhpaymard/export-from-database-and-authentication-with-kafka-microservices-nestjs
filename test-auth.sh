#!/bin/bash

# Test Auth Service through Gateway

echo "🧪 Testing Auth Service..."
echo ""

# Test 1: Register a new user
echo "1️⃣ Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456",
    "role": "user"
  }')

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extract token from response
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed or token not found"
  exit 1
fi

echo "✅ Registration successful! Token: ${TOKEN:0:50}..."
echo ""

# Test 2: Login with the created user
echo "2️⃣ Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$LOGIN_TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Test 3: Get user profile with token
echo "3️⃣ Testing Get Profile (with JWT token)..."
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $PROFILE_RESPONSE"
echo ""

if echo "$PROFILE_RESPONSE" | grep -q "username"; then
  echo "✅ Profile retrieved successfully!"
else
  echo "❌ Failed to get profile"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📝 Summary:"
echo "  - User registered successfully"
echo "  - User logged in successfully"
echo "  - Profile retrieved with JWT token"
echo ""
echo "🎉 Auth Service is working correctly through Gateway and Kafka!"
