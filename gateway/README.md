# API Gateway - Microservices

## 📖 Overview

API Gateway برای میکروسرویس‌های احراز هویت و استخراج دیتابیس. این gateway تمام درخواست‌های HTTP را دریافت کرده و آنها را از طریق Kafka به سرویس‌های مربوطه ارسال می‌کند.

## 🚀 Features

- ✅ **Proxy Pattern**: مسیریابی درخواست‌ها به میکروسرویس‌های مختلف
- ✅ **Kafka Integration**: ارتباط بین سرویس‌ها از طریق Apache Kafka  
- ✅ **Global Exception Handling**: مدیریت یکپارچه خطاها
- ✅ **Request/Response Logging**: لاگ‌گیری تمام درخواست‌ها
- ✅ **Swagger Documentation**: مستندسازی خودکار API
- ✅ **Health Check Endpoints**: نظارت بر سلامت سرویس
- ✅ **CORS Support**: پشتیبانی از Cross-Origin requests
- ✅ **Input Validation**: اعتبارسنجی ورودی‌ها

## 📋 Prerequisites

- Node.js >= 18
- npm >= 9
- Kafka running on localhost:9092
- Docker containers (از مرحله 0)

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

## ⚙️ Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=api-gateway
KAFKA_GROUP_ID=gateway-group

# Topics
KAFKA_AUTH_REQUEST_TOPIC=auth.request
KAFKA_AUTH_RESPONSE_TOPIC=auth.response
KAFKA_EXPORT_REQUEST_TOPIC=export.request
KAFKA_EXPORT_RESPONSE_TOPIC=export.response

# CORS
CORS_ORIGIN=*

# Timeout
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_RETRY_ATTEMPTS=3
```

## 🏃 Running the Service

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Overall health status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Authentication (proxied to auth-service via Kafka)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires token)

### Database Export (proxied to export-service via Kafka)
- `POST /api/export/query` - Export database data (admin only)

## 📚 Swagger Documentation

Access the interactive API documentation at:
```
http://localhost:3000/api/docs
```

## 🔍 Request Flow

```
Client Request
     ↓
API Gateway (HTTP)
     ↓
Kafka Producer (send to topic)
     ↓
Microservice Consumer
     ↓
Process Request
     ↓
Kafka Producer (send response)
     ↓
API Gateway Consumer
     ↓
HTTP Response to Client
```

## 📁 Project Structure

```
gateway/
├── src/
│   ├── auth/                 # Auth proxy controller & DTOs
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   ├── export/               # Export proxy controller & DTOs
│   │   ├── dto/
│   │   ├── export.controller.ts
│   │   └── export.module.ts
│   ├── health/               # Health check controller
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── kafka/                # Kafka service
│   │   ├── kafka.service.ts
│   │   └── kafka.module.ts
│   ├── common/               # Common utilities
│   │   ├── filters/          # Exception filters
│   │   └── interceptors/     # Request interceptors
│   ├── app.module.ts         # Root module
│   └── main.ts               # Bootstrap file
├── .env                      # Environment variables
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔐 Authentication Flow

1. **Register**:
   ```bash
   POST /api/auth/register
   {
     "username": "john_doe",
     "email": "john@example.com",
     "password": "password123",
     "role": "user"
   }
   ```

2. **Login**:
   ```bash
   POST /api/auth/login
   {
     "usernameOrEmail": "john_doe",
     "password": "password123"
   }
   ```
   Response: `{ "access_token": "eyJhbG..." }`

3. **Use Token**:
   ```bash
   GET /api/auth/profile
   Headers: Authorization: Bearer <token>
   ```

## 📊 Export Database Flow

```bash
POST /api/export/query
Headers: Authorization: Bearer <admin_token>
Body: {
  "tableName": "users",
  "columns": ["id", "username", "email"],
  "where": { "role": "admin" },
  "limit": 10
}
```

## ⚠️ Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": ["Error message"],
  "error": "Bad Request",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `504` - Gateway Timeout (Kafka timeout)

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test Swagger
```bash
open http://localhost:3000/api/docs
```

## 📝 Logging

The gateway logs all requests and responses:

```
[HTTP] ➡️  POST /api/auth/login - Request started
[HTTP] ⬅️  POST /api/auth/login - Completed in 45ms
```

## 🔄 Kafka Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `auth.request` | Gateway → Auth Service | Authentication requests |
| `auth.response` | Auth Service → Gateway | Authentication responses |
| `export.request` | Gateway → Export Service | Export requests |
| `export.response` | Export Service → Gateway | Export responses |

## 🛡️ Security Features

- ✅ Input validation using class-validator
- ✅ JWT token-based authentication (handled by auth-service)
- ✅ Role-based access control (RBAC)
- ✅ Request timeout protection
- ✅ Error message sanitization

## 🚨 Troubleshooting

### Kafka Connection Failed
```bash
# Check if Kafka is running
docker ps | grep kafka

# Check Kafka logs
docker logs microservices-kafka
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Swagger Not Loading
- Make sure you're accessing `http://localhost:3000/api/docs`
- Check if the server is running
- Clear browser cache

## 📌 Notes

- Gateway does NOT store any business logic
- All business logic is in microservices
- Gateway is stateless and horizontally scalable
- Kafka provides reliable message delivery
- Request-Reply pattern ensures responses are routed back

## 🔗 Related Services

- [Auth Service](../auth-service/) - مرحله 2
- [Export Service](../export-service/) - مرحله 3
- [Docker Infrastructure](../docker/) - مرحله 0

## 📄 License

ISC

---

**Status**: ✅ مرحله 1 کامل شده - آماده برای مرحله 2
