echo "Testing login..."
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}' \
  --max-time 10 \
  --silent \
  --show-error

echo ""
echo "Done"
