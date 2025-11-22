# 🐛 مشکل Kafka Message و راه‌حل

## 🔍 توضیح مشکل

وقتی درخواست login از Gateway به Auth Service ارسال می‌شد، خطای زیر رخ می‌داد:

```
Error: Unknown action: undefined
```

### علت مشکل:

در `gateway/src/kafka/kafka.service.ts`، وقتی پیام به Kafka ارسال می‌شد، فقط این ساختار ارسال می‌شد:

```json
{
  "correlationId": "...",
  "data": {
    "action": "login",
    "data": { "username": "...", "password": "..." }
  },
  "timestamp": 123456789
}
```

ولی Auth Service انتظار داشت `action` در سطح اصلی پیام باشد:

```json
{
  "correlationId": "...",
  "action": "login",
  "data": { "username": "...", "password": "..." },
  "timestamp": 123456789
}
```

---

## ✅ راه‌حل

### 1. تغییر در Gateway (`gateway/src/kafka/kafka.service.ts`)

**قبل:**
```typescript
value: JSON.stringify({
  correlationId,
  data: payload,  // ❌ payload کامل داخل data قرار می‌گرفت
  timestamp: Date.now(),
})
```

**بعد:**
```typescript
value: JSON.stringify({
  correlationId,
  ...payload,  // ✅ payload با spread operator باز می‌شود
  timestamp: Date.now(),
})
```

### 2. تغییر در Auth Service (`auth-service/src/kafka/kafka.service.ts`)

**قبل:**
```typescript
case 'validate':
  response = await this.authService.validateToken(request.data.token);
  break;
```

**بعد:**
```typescript
case 'profile':  // ✅ اضافه کردن action جدید
case 'validate':
  const token = request.token || request.data?.token;
  if (!token) {
    throw new Error('Token is required');
  }
  response = await this.authService.validateToken(token);
  break;
```

---

## 🧪 نحوه تست

### روش 1: استفاده از Swagger UI

1. به `http://localhost:3000/api/docs` بروید
2. روی `/api/auth/login` کلیک کنید
3. "Try it out" بزنید
4. این JSON را وارد کنید:
   ```json
   {
     "username": "john_doe",
     "password": "password123"
   }
   ```
5. "Execute" بزنید
6. باید پاسخ موفق دریافت کنید

### روش 2: استفاده از curl

```bash
# ثبت‌نام
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'

# ورود
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'

# دریافت پروفایل (TOKEN را جایگزین کنید)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### روش 3: استفاده از فایل test-login.http

اگر VS Code و پلاگین REST Client دارید:
- فایل `test-login.http` را باز کنید
- روی "Send Request" کلیک کنید

---

## 📝 لاگ‌های صحیح بعد از رفع مشکل

### Gateway:
```
[Nest] LOG [HTTP] ➡️  POST /api/auth/login - Request started
[Nest] DEBUG [HTTP] Body: {"username":"john_doe","password":"password123"}
[Nest] DEBUG [KafkaService] Request sent to auth.request with correlationId: xxx
[Nest] LOG [HTTP] ✅ POST /api/auth/login - 200 OK (3052ms)
```

### Auth Service:
```
[Nest] LOG [KafkaService] Processing message: login (correlationId: xxx)
[Nest] LOG [KafkaService] Response sent for correlationId: xxx
```

---

## ⚠️ نکات مهم

1. **هر بار تغییر کد، حتماً build کنید:**
   ```bash
   npm run build
   ```

2. **سرویس‌ها را restart کنید:**
   - `Ctrl+C` برای توقف
   - `npm run start:dev` برای شروع مجدد

3. **ترتیب راه‌اندازی مهم نیست** چون Kafka async است

4. **برای دیباگ:**
   - لاگ Gateway را بررسی کنید
   - لاگ Auth Service را بررسی کنید
   - Kafka UI را چک کنید: `http://localhost:8080`

---

## 🎯 وضعیت فعلی

✅ مشکل Kafka message برطرف شد  
✅ Gateway build شد  
✅ Auth Service build شد  
✅ آماده تست کامل  

---

**نویسنده:** GitHub Copilot  
**تاریخ:** 22 نوامبر 2025
