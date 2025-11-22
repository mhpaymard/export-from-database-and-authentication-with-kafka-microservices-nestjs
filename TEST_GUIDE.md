# ✅ راهنمای تست کامل Auth Service

## 🔧 آماده‌سازی

### مرحله 1: اطمینان از اجرای Docker
```bash
docker ps
```

باید این containerها را ببینید:
- microservices-postgres
- microservices-kafka

### مرحله 2: بررسی پسوردها در دیتابیس

پسوردهای موجود:
- **john_doe** / **password123** (role: user)
- **jane_smith** / **password123** (role: user)  
- **admin** / **admin123** (role: admin)
- **bob_admin** / **admin123** (role: admin)

## 🚀 اجرای سرویس‌ها

### Terminal 1: Auth Service
```bash
cd "d:/6 - hooshan-kavosh-borna/1 - first-tasks/auth-service"
npm run start:dev
```

منتظر بمانید تا این پیام را ببینید:
```
🚀 Auth Service is running on: http://localhost:3001
📨 Listening on topic: auth.request
```

### Terminal 2: Gateway
```bash
cd "d:/6 - hooshan-kavosh-borna/1 - first-tasks/gateway"
npm run start:dev
```

منتظر بمانید تا این پیام را ببینید:
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api/docs
```

## 🧪 تست‌های دستی

### تست 1: Health Check
```bash
curl http://localhost:3000/health
```

**پاسخ موردانتظار:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T...",
  "uptime": 123.456
}
```

### تست 2: Login با john_doe
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}'
```

**پاسخ موردانتظار:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### تست 3: Login با email
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john@example.com","password":"password123"}'
```

### تست 4: Get Profile (جایگزین TOKEN کنید)
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**پاسخ موردانتظار:**
```json
{
  "id": 2,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user"
}
```

### تست 5: Login با Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"admin123"}'
```

## 🎨 تست با Swagger UI

1. باز کنید: `http://localhost:3000/api/docs`

2. روی **/api/auth/login** کلیک کنید

3. "Try it out" بزنید

4. JSON زیر را وارد کنید:
```json
{
  "usernameOrEmail": "john_doe",
  "password": "password123"
}
```

5. "Execute" بزنید

6. باید `access_token` دریافت کنید

7. token را کپی کنید

8. روی دکمه **"Authorize"** در بالای صفحه کلیک کنید

9. token را paste کنید و "Authorize" بزنید

10. حالا **/api/auth/profile** را تست کنید

## 🔍 بررسی لاگ‌ها

### لاگ موفق در Gateway:
```
[Nest] LOG [HTTP] ➡️  POST /api/auth/login - Request started
[Nest] DEBUG [HTTP] Body: {"usernameOrEmail":"john_doe","password":"password123"}
[Nest] DEBUG [KafkaService] Request sent to auth.request with correlationId: xxx
[Nest] LOG [HTTP] ✅ POST /api/auth/login - 200 OK (3052ms)
```

### لاگ موفق در Auth Service:
```
[Nest] LOG [KafkaService] Processing message: login (correlationId: xxx)
query: SELECT ... FROM "users" "User" WHERE "User"."username" = $1
[Nest] LOG [KafkaService] Response sent for correlationId: xxx
```

## ❌ عیب‌یابی

### مشکل: "Request timeout"
- Auth Service اجرا نیست
- Kafka اجرا نیست
- بررسی کنید: `docker ps`

### مشکل: "Invalid credentials"
- username/email یا password اشتباه است
- بررسی کنید پسوردها در دیتابیس درست hash شده‌اند

### مشکل: "EADDRINUSE"
- Port قبلاً استفاده می‌شود
- توقف: `taskkill //F //IM node.exe`

### مشکل: "Unknown action"
- Gateway یا Auth Service build نشده
- `npm run build` در هر دو سرویس

## 📊 وضعیت تغییرات

### تغییرات اعمال شده:

1. ✅ **Gateway** - kafka.service.ts: `...payload` به جای `data: payload`
2. ✅ **Auth Service** - login.dto.ts: `usernameOrEmail` به جای `username`
3. ✅ **Auth Service** - auth.service.ts: پشتیبانی از login با email
4. ✅ **Auth Service** - kafka.service.ts: اضافه شدن `profile` action
5. ✅ **Database** - پسوردها با bcrypt hash شدند

### اطلاعات کاربران:

| Username | Email | Password | Role | Hash |
|----------|-------|----------|------|------|
| john_doe | john@example.com | password123 | user | $2b$10$PDO... |
| jane_smith | jane@example.com | password123 | user | $2b$10$PDO... |
| admin | admin@example.com | admin123 | admin | $2b$10$g0i... |
| bob_admin | bob@example.com | admin123 | admin | $2b$10$g0i... |

---

**تاریخ:** 22 نوامبر 2025  
**وضعیت:** ✅ آماده برای تست
