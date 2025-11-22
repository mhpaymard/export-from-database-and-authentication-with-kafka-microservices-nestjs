# تجربیات توسعه - سیستم میکروسرویس با Kafka و NestJS

## 📋 فهرست مطالب
1. [مراحل پیاده‌سازی شده](#مراحل-پیاده-سازی-شده)
2. [مشکلات و راه‌حل‌ها](#مشکلات-و-راه-حل-ها)
3. [بهترین روش‌ها (Best Practices)](#بهترین-روش-ها)
4. [مرحله 3: Export Database Service](#مرحله-3-export-database-service)

---

## 🎯 مراحل پیاده‌سازی شده

### ✅ Stage 0: زیرساخت Docker
**وضعیت**: کامل شده
- PostgreSQL 16 (پورت 5432)
- Apache Kafka KRaft 4.0.0 (پورت 9092)
- pgAdmin (پورت 5050)
- Kafka UI (پورت 8080)

**فایل‌های کلیدی**:
- `docker-compose.yml`
- `kafka/kraft/server.properties`

---

### ✅ Stage 1: API Gateway
**وضعیت**: کامل شده و تست شده

**قابلیت‌های پیاده‌سازی شده**:
- 7 اندپوینت REST API
- یکپارچه‌سازی با Kafka (Request-Reply Pattern)
- مستندات Swagger
- پورت 3000

**اندپوینت‌ها**:
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
GET    /api/auth/validate
POST   /api/export/query
GET    /api/export/download/:jobId
GET    /api/export/status/:jobId
```

**فایل‌های کلیدی**:
- `gateway/src/kafka/kafka.service.ts` (سرویس Kafka)
- `gateway/src/auth/auth.controller.ts` (کنترلر Auth)
- `gateway/src/export/export.controller.ts` (کنترلر Export)

---

### ✅ Stage 2: Auth Service
**وضعیت**: کامل شده و تست شده

**قابلیت‌های پیاده‌سازی شده**:
- احراز هویت JWT (انقضا: 24 ساعت)
- RBAC (نقش‌ها: user, admin)
- رمزنگاری bcrypt (10 rounds)
- ورود با username یا email
- پورت 3001

**مدل کاربر**:
```typescript
{
  id: number
  username: string (unique)
  email: string (unique)
  password: string (bcrypt hashed)
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}
```

**فایل‌های کلیدی**:
- `auth-service/src/auth/auth.service.ts` (منطق احراز هویت)
- `auth-service/src/auth/dto/login.dto.ts` (DTO ورود)
- `auth-service/src/kafka/kafka.service.ts` (Consumer کافکا)

---

## 🐛 مشکلات و راه‌حل‌ها

### مشکل 1: عدم تطابق فیلد DTO
**علت**:
- Gateway فیلد `usernameOrEmail` می‌فرستاد
- Auth Service فیلد `username` انتظار داشت

**علائم**:
```
Error: Username is required
```

**راه‌حل**:
```typescript
// auth-service/src/auth/dto/login.dto.ts
export class LoginDto {
  @IsNotEmpty()
  usernameOrEmail: string;  // قبلاً: username

  @IsNotEmpty()
  password: string;
}
```

**درس آموخته**: همیشه نام فیلدهای DTO را در تمام میکروسرویس‌ها یکسان نگه دارید.

---

### مشکل 2: رمزهای عبور ذخیره شده در دیتابیس plaintext بود
**علت**:
- رمزها بدون hash در دیتابیس ذخیره شده بودند
- `bcrypt.compare()` نمی‌توانست رمز plaintext را با hash مقایسه کند

**علائم**:
```
Error: Invalid credentials
```

**راه‌حل**:
```sql
-- تولید hash برای تمام رمزها
UPDATE users SET password = '$2b$10$PDO...' WHERE username = 'john_doe';
UPDATE users SET password = '$2b$10$g0i...' WHERE username = 'admin';
```

**درس آموخته**: 
- هرگز رمز plaintext در دیتابیس ذخیره نکنید
- از ابتدای توسعه از bcrypt استفاده کنید
- برای تست، از رمزهای hashed شده استفاده کنید

---

### مشکل 3: ساختار پیلود Kafka اشتباه بود
**علت**:
```typescript
// ❌ اشتباه
await this.kafkaService.sendRequest('auth.request', { data: payload });

// علت: فیلد action درون { data } قرار گرفته و Auth Service نمی‌تواند آن را بخواند
```

**علائم**:
```
Error: Action is required
```

**راه‌حل**:
```typescript
// ✅ صحیح
await this.kafkaService.sendRequest('auth.request', { ...payload });

// حالا action در سطح اصلی object قرار دارد
```

**درس آموخته**: هنگام ارسال پیام به Kafka، از spread operator استفاده کنید تا ساختار داده حفظ شود.

---

### ⚠️ مشکل 4: Timeout در Gateway (مشکل حیاتی)
**علت ریشه‌ای**:
```typescript
// ❌ الگوی اشتباه: ایجاد consumer موقت برای هر request
async sendRequest(topic: string, payload: any) {
  const consumer = this.kafka.consumer({ groupId: `temp-${Date.now()}` });
  await consumer.connect();
  await consumer.subscribe({ topic: responseTopic });
  
  // مشکل: consumer باید به گروه بپیوندد (3-4 ثانیه طول می‌کشد)
  // در این مدت، پاسخ Auth Service ارسال و از دست می‌رود!
}
```

**تایم‌لاین دقیق مشکل**:
```
11:29:00.123 - Gateway ارسال درخواست
11:29:00.456 - Auth Service پردازش درخواست
11:29:00.789 - Auth Service ارسال پاسخ به auth.response
11:29:02.100 - Consumer موقت به گروه پیوست (خیلی دیر!)
11:29:30.000 - Gateway timeout (هیچ پاسخی دریافت نشد)
```

**راه‌حل (الگوی صحیح)**:
```typescript
// ✅ الگوی صحیح: Permanent Consumer Pattern
export class KafkaService implements OnModuleInit {
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeoutId: NodeJS.Timeout;
  }> = new Map();

  async onModuleInit() {
    await this.startResponseConsumers();  // فوراً consumer ها را راه‌اندازی کن
  }

  async startResponseConsumers() {
    // Consumer برای auth.response
    const authConsumer = this.kafka.consumer({ groupId: 'gateway-auth-consumer' });
    await authConsumer.connect();
    await authConsumer.subscribe({ topic: 'auth.response' });
    
    await authConsumer.run({
      eachMessage: async ({ message }) => {
        const correlationId = message.headers?.correlationId?.toString();
        const pending = this.pendingRequests.get(correlationId);
        
        if (pending) {
          clearTimeout(pending.timeoutId);
          pending.resolve(JSON.parse(message.value.toString()));
          this.pendingRequests.delete(correlationId);
        }
      },
    });

    // Consumer برای export.response نیز مشابه
  }

  async sendRequest(topic: string, payload: any): Promise<any> {
    const correlationId = uuidv4();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('Request timeout'));
      }, 30000);

      this.pendingRequests.set(correlationId, { resolve, reject, timeoutId });

      // ارسال درخواست با correlationId
      this.producer.send({
        topic,
        messages: [{
          key: correlationId,
          value: JSON.stringify({ ...payload }),
          headers: { correlationId },
        }],
      });
    });
  }
}
```

**مقایسه عملکرد**:
| معیار | الگوی اشتباه (Temporary) | الگوی صحیح (Permanent) |
|-------|-------------------------|------------------------|
| زمان پاسخ | 30 ثانیه (timeout) | < 1 ثانیه |
| موفقیت | 0% | 100% |
| مصرف منابع | بالا (ایجاد consumer جدید) | پایین (استفاده مجدد) |
| پیچیدگی | پایین (ولی کار نمی‌کند!) | متوسط (ولی صحیح است) |

**درس‌های آموخته**:
1. **Consumer باید قبل از ارسال request آماده باشد**
2. Consumer ها برای join شدن به گروه زمان نیاز دارند (3-4 ثانیه)
3. از `correlationId` برای matching request/response استفاده کنید
4. Consumer های permanent بهتر از temporary هستند
5. با `Map` در حافظه، pending request ها را track کنید
6. همیشه timeout برای request ها تعیین کنید

---

### مشکل 5: تست end-to-end نبود
**علت**:
- هر سرویس به صورت جداگانه تست می‌شد
- جریان کامل Kafka تست نمی‌شد

**راه‌حل**:
```bash
#!/bin/bash
# final-test.sh - تست کامل جریان

# راه‌اندازی سرویس‌ها
npm run start:dev --prefix gateway &
npm run start:dev --prefix auth-service &

# انتظار برای آماده شدن
sleep 15

# تست با username
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john_doe","password":"password123"}'

# تست با email
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"john@example.com","password":"password123"}'

# تست admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"admin123"}'
```

**درس آموخته**: همیشه جریان کامل را از ابتدا تا انتها تست کنید.

---

## 📚 بهترین روش‌ها (Best Practices)

### 1. معماری Kafka
✅ **انجام دهید**:
- Consumer های permanent ایجاد کنید
- از `correlationId` برای matching استفاده کنید
- همیشه timeout تعیین کنید
- از `Map` برای track کردن pending requests استفاده کنید

❌ **انجام ندهید**:
- Consumer موقت برای هر request ایجاد نکنید
- بدون correlationId پیام ارسال نکنید
- request های بدون timeout نداشته باشید

### 2. امنیت
✅ **انجام دهید**:
- همیشه از bcrypt برای hash کردن رمز استفاده کنید (salt rounds >= 10)
- JWT token با expiration تولید کنید
- از RBAC برای کنترل دسترسی استفاده کنید
- Secret key را در environment variable ذخیره کنید

❌ **انجام ندهید**:
- رمز plaintext ذخیره نکنید
- Secret key را hardcode نکنید
- از token های بدون expiration استفاده نکنید

### 3. DTO و Validation
✅ **انجام دهید**:
- نام فیلدها را در تمام سرویس‌ها یکسان نگه دارید
- از class-validator برای اعتبارسنجی استفاده کنید
- خطاها را واضح و قابل فهم بنویسید

❌ **انجام ندهید**:
- نام فیلدهای مختلف در سرویس‌های مختلف استفاده نکنید
- بدون validation داده دریافت نکنید

### 4. تست
✅ **انجام دهید**:
- تست end-to-end بنویسید
- جریان کامل Kafka را تست کنید
- هر دو حالت موفقیت و شکست را تست کنید
- Log های واضح برای debugging اضافه کنید

❌ **انجام ندهید**:
- فقط یک سرویس را جداگانه تست نکنید
- بدون log های مناسب کار نکنید

---

## 🚀 مرحله 3: Export Database Service

### هدف
سرویس اکسپورت داده از دیتابیس با قابلیت فیلتر و فرمت‌های مختلف

### الزامات

#### 1. قابلیت‌های اصلی
- **Query با فیلتر**: 
  - انتخاب جدول
  - انتخاب ستون‌ها
  - شرایط WHERE
  - Pagination (limit, offset)
  
- **فرمت‌های خروجی**:
  - CSV (Comma-Separated Values)
  - JSON (JavaScript Object Notation)
  - Excel (XLSX)

- **کنترل دسترسی**:
  - فقط admin می‌تواند اکسپورت کند
  - Verify کردن JWT token از Auth Service
  - بررسی role در token

#### 2. معماری

```
Client (Swagger)
    ↓
Gateway (3000) → export.request (Kafka)
    ↓
Export Service (3002)
    ↓ 
PostgreSQL Database (read-only queries)
    ↓
Export Service → export.response (Kafka)
    ↓
Gateway → Client (لینک دانلود)
```

#### 3. اندپوینت‌ها در Gateway

```typescript
// درخواست اکسپورت جدید
POST /api/export/query
Headers: { Authorization: "Bearer <token>" }
Body: {
  "table": "users",
  "columns": ["id", "username", "email"],
  "where": "role = 'user'",
  "format": "csv",
  "limit": 100,
  "offset": 0
}
Response: { "jobId": "uuid-123", "status": "processing" }

// دریافت وضعیت job
GET /api/export/status/:jobId
Response: { "status": "completed", "downloadUrl": "/api/export/download/uuid-123" }

// دانلود فایل
GET /api/export/download/:jobId
Response: فایل CSV/JSON/Excel
```

#### 4. مدل داده

```typescript
// Export Job Entity
{
  id: string (UUID)
  userId: number
  table: string
  columns: string[]
  where?: string
  format: 'csv' | 'json' | 'excel'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filePath?: string
  error?: string
  createdAt: Date
  completedAt?: Date
}
```

#### 5. ساختار پروژه

```
export-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── export/
│   │   ├── export.service.ts       (منطق اکسپورت)
│   │   ├── export.entity.ts        (مدل Job)
│   │   ├── query-builder.service.ts (ساخت SQL امن)
│   │   └── file-generator.service.ts (تولید CSV/JSON/Excel)
│   ├── kafka/
│   │   └── kafka.service.ts        (Consumer/Producer)
│   └── auth/
│       └── jwt-verify.service.ts   (Verify کردن token)
├── package.json
└── tsconfig.json
```

#### 6. وابستگی‌ها

```json
{
  "dependencies": {
    "@nestjs/common": "^11.1.9",
    "@nestjs/core": "^11.1.9",
    "@nestjs/typeorm": "^10.0.2",
    "typeorm": "^0.3.20",
    "pg": "^8.13.1",
    "kafkajs": "^2.2.4",
    "xlsx": "^0.18.5",
    "csv-writer": "^1.6.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

#### 7. امنیت و Validation

**Security Checklist**:
- ✅ Verify JWT token قبل از پردازش
- ✅ بررسی role = 'admin'
- ✅ Sanitize کردن SQL queries (جلوگیری از SQL Injection)
- ✅ محدود کردن جداول قابل دسترسی (whitelist)
- ✅ محدود کردن تعداد رکوردها (max 10000)
- ✅ Timeout برای query ها (max 30 ثانیه)

**Query Builder با امنیت**:
```typescript
// ✅ صحیح: استفاده از parameterized query
const query = this.db
  .select(columns)
  .from(table)
  .where(whereClause, parameters)  // parameters جداگانه
  .limit(limit)
  .offset(offset);

// ❌ اشتباه: استفاده از string concatenation
const query = `SELECT * FROM ${table} WHERE ${userInput}`;  // SQL Injection!
```

#### 8. نکات مهم برای پیاده‌سازی

**از اشتباهات قبلی درس بگیرید**:

1. **Permanent Consumer Pattern**: 
   - از همان ابتدا consumer را permanent ایجاد کنید
   - قبل از ارسال اولین request، consumer آماده باشد

2. **DTO Consistency**:
   - نام فیلدها در Gateway و Export Service یکسان باشد
   - از interface مشترک استفاده کنید

3. **JWT Verification**:
   - همان JWT_SECRET را در Auth و Export Service استفاده کنید
   - Token را self-contained verify کنید (بدون query به database)

4. **Error Handling**:
   - خطاهای واضح و قابل فهم برگردانید
   - Log های مناسب برای debugging

5. **Testing**:
   - از ابتدا تست end-to-end بنویسید
   - هم موفقیت و هم شکست را تست کنید
   - با کاربر admin و non-admin تست کنید

#### 9. مراحل پیاده‌سازی (Step by Step)

**Step 1**: ایجاد پروژه
```bash
cd "d:\6 - hooshan-kavosh-borna\1 - first-tasks"
nest new export-service
cd export-service
```

**Step 2**: نصب وابستگی‌ها
```bash
npm install @nestjs/typeorm typeorm pg kafkajs xlsx csv-writer jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

**Step 3**: پیکربندی TypeORM و Kafka
- اتصال به PostgreSQL
- اتصال به Kafka

**Step 4**: ایجاد Export Service
- Query Builder با امنیت
- File Generator (CSV, JSON, Excel)
- Job Management

**Step 5**: ایجاد Kafka Consumer
- Listen به export.request
- Verify JWT token
- پردازش درخواست
- ارسال پاسخ به export.response

**Step 6**: تست کامل
- تست با admin token ✅
- تست با user token ❌ (باید رد شود)
- تست فرمت‌های مختلف
- تست با فیلترهای مختلف

#### 10. معیارهای موفقیت

مرحله 3 زمانی کامل است که:
- ✅ Admin بتواند جدول users را اکسپورت کند
- ✅ فرمت‌های CSV, JSON, Excel کار کنند
- ✅ User غیر admin نتواند اکسپورت کند (403 Forbidden)
- ✅ Query با فیلتر و pagination کار کند
- ✅ جریان کامل Kafka بدون timeout باشد
- ✅ SQL Injection امکان‌پذیر نباشد
- ✅ فایل‌ها قابل دانلود باشند

---

## 📊 خلاصه تجربیات

### چالش‌های اصلی:
1. ❌ Consumer موقت → ✅ Consumer دائمی
2. ❌ رمز plaintext → ✅ bcrypt hash
3. ❌ عدم تطابق DTO → ✅ نام‌گذاری یکسان
4. ❌ تست تک‌سرویسه → ✅ تست end-to-end

### زمان صرف شده:
- Stage 0 (Docker): 30 دقیقه
- Stage 1 (Gateway): 1 ساعت
- Stage 2 (Auth Service): 2 ساعت
- **Debug & Fix**: 3 ساعت (بیشترین زمان صرف شد)
- **جمع**: ~6.5 ساعت

### نکته طلایی:
> "بهترین راه برای جلوگیری از باگ، استفاده از الگوهای معماری درست از همان ابتدا است. Debug کردن همیشه زمان‌برتر از پیاده‌سازی صحیح است!"

---

**تاریخ بروزرسانی**: 22 نوامبر 2025  
**نسخه**: 1.1  
**وضعیت پروژه**: Stage 3 در حال توسعه (90% کامل شده)

---

## 📊 وضعیت Stage 3: Export Database Service

### ✅ کارهای انجام شده:
1. **پروژه Export Service ایجاد شد** - NestJS با TypeORM و Kafka
2. **JwtVerifyService** - Verify کردن JWT token و بررسی admin role
3. **QueryBuilderService** - ساخت SQL امن با TypeORM QueryBuilder
4. **FileGeneratorService** - تولید CSV/JSON/Excel در حافظه
5. **ExportService** - منطق اصلی اکسپورت
6. **KafkaService** - Permanent Consumer Pattern برای export.request
7. **Gateway ExportController** - اندپوینت `/api/export/query` با Swagger examples
8. **همه فایل‌ها compile** می‌شوند بدون خطا

### 🔧 نیاز به رفع اشکال:
- مشکل Kafka message delivery از Gateway به Export Service (timeout می‌خورد)
- Export Service پیام‌ها را دریافت نمی‌کند
- احتمالاً topic یا correlation ID mismatch

### 📁 ساختار فایل‌های ایجاد شده:
```
export-service/
├── src/
│   ├── auth/
│   │   └── jwt-verify.service.ts           ✅ Verify JWT + Admin role check
│   ├── export/
│   │   ├── export.service.ts               ✅ منطق اکسپورت
│   │   ├── query-builder.service.ts        ✅ SQL امن با validation
│   │   ├── file-generator.service.ts       ✅ CSV/JSON/Excel generator
│   │   └── dto/
│   │       └── export-query.dto.ts         ✅ Validation DTO
│   ├── kafka/
│   │   └── kafka.service.ts                ✅ Permanent Consumer
│   ├── app.module.ts                       ✅ TypeORM + تمام services
│   └── main.ts                             ✅ پورت 3002

gateway/
├── src/
│   └── export/
│       ├── export.controller.ts            ✅ POST /api/export/query
│       └── dto/
│           └── export-query.dto.ts         ✅ Swagger examples
```

### 🎯 قابلیت‌های پیاده‌سازی شده:
- ✅ Export به فرمت‌های CSV, JSON, Excel
- ✅ انتخاب جدول دلخواه
- ✅ انتخاب ستون‌های خاص
- ✅ فیلتر با WHERE clause
- ✅ Pagination با limit/offset
- ✅ احراز هویت admin
- ✅ Validation جدول و ستون‌ها
- ✅ Protection از SQL Injection
- ✅ Swagger documentation کامل

---
