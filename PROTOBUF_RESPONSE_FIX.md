# اصلاح Response Handling در Gateway

## مشکل قبلی

قبلاً در Gateway، response‌های Protobuf decode می‌شدند اما به درستی به کاربر نمایش داده نمی‌شدند. مشکلات:

1. ❌ در auth controller: `response.data || response` استفاده می‌شد که ساختار صحیحی نداشت
2. ❌ در export controller: bytes به صورت Buffer برگشته می‌شد نه base64 string
3. ❌ Schema response با نام اشتباه (`schema` به جای `tables`) برگشته می‌شد

## راه‌حل پیاده‌سازی شده ✅

### 1. اصلاح ProtoService در Gateway

**فایل:** `gateway/src/proto/proto.service.ts`

```typescript
// قبل:
bytes: Buffer,  // ❌ Buffer برای JSON قابل serialize نیست

// بعد:
bytes: String,  // ✅ تبدیل به base64 string برای انتقال JSON
```

### 2. اصلاح Auth Controller

**فایل:** `gateway/src/auth/auth.controller.ts`

#### Register Endpoint
```typescript
// قبل:
return response.data || response;  // ❌ ساختار نامشخص

// بعد:
return {
  message: response.message || 'User registered successfully',
  user: response.user,
};  // ✅ JSON تمیز و استاندارد
```

#### Login Endpoint
```typescript
// قبل:
return response.data || response;  // ❌ 

// بعد:
return {
  access_token: response.token,
  user: response.user,
};  // ✅ مطابق با Swagger schema
```

#### Profile Endpoint
```typescript
// قبل:
return response.data || response;  // ❌ 

// بعد:
return response.user;  // ✅ فقط اطلاعات کاربر
```

### 3. اصلاح Export Controller

**فایل:** `gateway/src/export/export.controller.ts`

#### Export Query Endpoint
```typescript
// قبل:
const buffer = result.isBase64 
  ? Buffer.from(result.data, 'base64')
  : Buffer.from(result.data);  // ❌ همیشه base64 نبود

// بعد:
const buffer = result.isBase64 || result.data
  ? Buffer.from(result.data, 'base64')
  : Buffer.from(result.data || '');  // ✅ همیشه base64 است
```

#### Schema Endpoint
```typescript
// قبل:
return {
  success: true,
  tables: result.schema,  // ❌ نام فیلد اشتباه
};

// بعد:
return {
  success: true,
  tables: result.tables,  // ✅ مطابق با proto schema
};
```

### 4. اصلاح Export Service

**فایل:** `export-service/src/export/export.service.ts`

```typescript
// اضافه کردن format به response
return {
  success: true,
  data: dataToSend,
  isBase64: Buffer.isBuffer(fileData),
  contentType,
  filename,
  format: dto.format,  // ✅ اضافه شد
};
```

## جریان کامل داده (Data Flow)

### مثال 1: Login Request

```
1️⃣ Client → Gateway
POST /api/auth/login
{
  "username": "john",
  "password": "pass123"
}

2️⃣ Gateway → Kafka (auth.request)
Headers:
  - correlationId: "123-abc"
  - messageType: "LoginRequest"
Value: <binary protobuf data>

3️⃣ Auth Service decodes & processes
LoginRequest { username: "john", password: "pass123" }
↓ Validate & generate JWT
LoginResponse { 
  success: true,
  token: "eyJhbGc...",
  user: { id: 1, username: "john", ... }
}

4️⃣ Auth Service → Kafka (auth.response)
Headers:
  - correlationId: "123-abc"
  - messageType: "LoginResponse"
Value: <binary protobuf data>

5️⃣ Gateway decodes Protobuf
LoginResponse {
  success: true,
  token: "eyJhbGc...",
  user: { id: 1, username: "john", ... }
}

6️⃣ Gateway → Client (Clean JSON)
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### مثال 2: Export PDF Request

```
1️⃣ Client → Gateway
POST /api/export/query
{
  "table": "users",
  "format": "pdf",
  "download": true
}

2️⃣ Gateway → Kafka (export.request)
Headers:
  - correlationId: "456-def"
  - messageType: "ExportQueryRequest"
Value: <binary protobuf data>

3️⃣ Export Service decodes & processes
ExportQueryRequest { table: "users", format: "pdf", ... }
↓ Query database & generate PDF
ExportQueryResponse {
  success: true,
  data: "JVBERi0xLjQKJeLjz9M..." (base64),  ✅ bytes → base64
  isBase64: true,
  contentType: "application/pdf",
  filename: "users_export.pdf",
  format: "pdf"
}

4️⃣ Export Service → Kafka (export.response)
Headers:
  - correlationId: "456-def"
  - messageType: "ExportQueryResponse"
Value: <binary protobuf data with base64 string>

5️⃣ Gateway decodes Protobuf
ExportQueryResponse {
  success: true,
  data: "JVBERi0xLjQKJeLjz9M..." (base64 string),  ✅ String نه Buffer
  isBase64: true,
  contentType: "application/pdf",
  filename: "users_export.pdf",
  format: "pdf"
}

6️⃣ Gateway converts base64 → Buffer
const buffer = Buffer.from(result.data, 'base64');

7️⃣ Gateway → Client (File Download)
Content-Type: application/pdf
Content-Disposition: attachment; filename="users_export.pdf"
<PDF binary data>
```

## نکات مهم

### ✅ چرا bytes به String تبدیل می‌شود؟

در Gateway's ProtoService:
```typescript
bytes: String,  // Convert bytes to base64 string
```

**دلیل:**
- Protobuf `bytes` field به صورت پیش‌فرض به Buffer تبدیل می‌شود
- Buffer در JSON قابل serialize نیست (تبدیل به `{type: "Buffer", data: [1,2,3...]}` می‌شود)
- با `bytes: String`، protobufjs خودکار base64 encoding انجام می‌دهد
- base64 string در JSON قابل انتقال است

### ✅ چرا در Auth/Export Service باز هم bytes: String است؟

```typescript
// auth-service & export-service
bytes: String,
```

**دلیل:**
- این سرویس‌ها bytes را encode می‌کنند (Buffer → Protobuf binary)
- Gateway bytes را decode می‌کند (Protobuf binary → base64 string)
- پس در Auth/Export Service، ما Buffer می‌فرستیم و Gateway string دریافت می‌کند

### ✅ تفاوت isBase64 و bytes field

- `isBase64`: فیلد boolean در response که نشان می‌دهد data چطور encode شده
- `bytes` field در proto: نوع داده که برای binary data استفاده می‌شود
- در Gateway: `bytes: String` باعث می‌شود base64 string بگیریم
- در Auth/Export: `bytes: String` برای decode کردن request (که معمولاً bytes ندارند)

## مزایای این رویکرد

1. ✅ **JSON سازگار**: تمام response‌ها JSON خالص هستند
2. ✅ **Type Safe**: TypeScript تمام نوع‌ها را بررسی می‌کند
3. ✅ **Swagger Compatible**: response‌ها با Swagger schemas سازگار هستند
4. ✅ **Binary Files**: PDF/Excel به صورت base64 منتقل و سپس به Buffer تبدیل می‌شوند
5. ✅ **Clean API**: کاربران JSON تمیز و استاندارد دریافت می‌کنند

## تست‌ها

### Test Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "Test@123"
  }'

# Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "test_user",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "Test@123"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "test_user",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Test Export JSON
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "table": "users",
    "format": "json"
  }'

# Response:
{
  "success": true,
  "table": "users",
  "format": "json",
  "recordCount": 5,
  "data": [
    {"id": 1, "username": "user1", ...},
    {"id": 2, "username": "user2", ...}
  ]
}
```

### Test Export PDF (Download)
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "table": "users",
    "format": "pdf",
    "download": true
  }' --output users.pdf

# Downloads: users_export.pdf
```

## خلاصه تغییرات

| سرویس | فایل | تغییر |
|-------|------|-------|
| Gateway | proto.service.ts | `bytes: Buffer` → `bytes: String` |
| Gateway | auth.controller.ts | Return clean JSON objects |
| Gateway | export.controller.ts | Fix base64 handling & schema field name |
| Export Service | export.service.ts | Add `format` field to response |

تمام تغییرات با موفقیت اعمال و کامپایل شدند! ✅
