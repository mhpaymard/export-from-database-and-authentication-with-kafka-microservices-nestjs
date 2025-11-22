# Microservices Project - NestJS + Kafka + PostgreSQL

## 📋 نمای کلی پروژه

این پروژه شامل یک معماری میکروسرویس با استفاده از NestJS است که شامل سه سرویس اصلی می‌باشد:

1. **API Gateway** - دروازه ورودی و مسیریابی درخواست‌ها
2. **Auth Service** - احراز هویت و مجوزدهی مبتنی بر نقش
3. **Export Database Service** - استخراج و فیلتر داده‌های PostgreSQL

ارتباط بین سرویس‌ها از طریق **Apache Kafka (KRaft mode)** برقرار می‌شود.

---

## 🏗️ معماری سیستم

```
┌─────────────────┐
│   API Gateway   │ (Port: 3000)
└────────┬────────┘
         │
    ┌────┴────┐
    │  Kafka  │ (KRaft Mode)
    └────┬────┘
         │
    ┌────┴──────────────────┐
    │                       │
┌───▼──────────┐   ┌───────▼─────────┐
│ Auth Service │   │ Export Database │
│ (Port: 3001) │   │   (Port: 3002)  │
└──────────────┘   └────────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  PostgreSQL    │
                    │   (Docker)     │
                    └────────────────┘
```

---

## 🎯 مراحل پیاده‌سازی

### مرحله 0️⃣: راه‌اندازی پیش‌نیازها ✅
- [x] نصب Docker و Docker Compose
- [x] راه‌اندازی PostgreSQL در Docker
- [x] راه‌اندازی Apache Kafka با KRaft mode در Docker
- [x] ایجاد ساختار پروژه اصلی
- [x] تنظیمات محیط توسعه (environment variables)
- [x] تست اتصال به PostgreSQL
- [x] تست اتصال به Kafka
- [x] ایجاد دیتابیس نمونه و جدول‌های تست

### مرحله 1️⃣: پیاده‌سازی API Gateway ✅
- [x] ایجاد پروژه NestJS برای Gateway
- [x] نصب وابستگی‌های Kafka (KafkaJS)
- [x] پیکربندی اتصال به Kafka
- [x] پیاده‌سازی Proxy Pattern برای ارسال درخواست‌ها
- [x] مسیریابی درخواست‌ها به سرویس‌های مختلف
- [x] اضافه کردن Global Exception Filter
- [x] پیکربندی CORS
- [x] پیاده‌سازی Health Check endpoint
- [x] تست کامل Gateway

### مرحله 2️⃣: پیاده‌سازی Authentication & Authorization Service ✅
- [x] ایجاد پروژه NestJS برای Auth Service
- [x] نصب وابستگی‌های Kafka
- [x] پیکربندی Kafka Consumer/Producer
- [x] تعریف مدل‌های User و Role
- [x] پیاده‌سازی JWT Authentication
- [x] تعریف دو نقش: `admin` (دسترسی کامل) و `user` (بدون دسترسی به export)
- [x] پیاده‌سازی Guards برای Role-Based Access Control
- [x] پیاده‌سازی endpoints:
  - POST /auth/register
  - POST /auth/login
  - GET /auth/profile
- [x] Exception Handling سفارشی
- [x] تست احراز هویت و مجوزدهی

### مرحله 3️⃣: پیاده‌سازی Export Database Service ✅
- [x] ایجاد پروژه NestJS برای Export Service
- [x] نصب TypeORM و وابستگی PostgreSQL
- [x] پیکربندی اتصال به PostgreSQL
- [x] نصب وابستگی‌های Kafka
- [x] پیکربندی Kafka Consumer/Producer
- [x] پیاده‌سازی Query Builder پویا
- [x] پیاده‌سازی endpoint برای دریافت نام جدول
- [x] پیاده‌سازی فیلتر ستون‌ها (انتخاب ستون‌های خاص)
- [x] پیاده‌سازی فیلتر شرایط (WHERE conditions)
- [x] پیاده‌سازی Pagination
- [x] Exception Handling برای خطاهای دیتابیس
- [x] Validation برای ورودی‌ها
- [x] تست کامل Export Service
- [x] **پیاده‌سازی Export Formats:**
  - [x] JSON (با parse خودکار)
  - [x] CSV
  - [x] Excel (XLSX)
  - [x] PDF (با فرمت جدول)
- [x] **پیاده‌سازی Schema Metadata API**
- [x] **پیاده‌سازی Date Range Filtering**
- [x] **پیاده‌سازی Download Mode (inline/download)**

---

## 🛠️ تکنولوژی‌های استفاده شده

### Backend Framework
- **NestJS** (آخرین نسخه پایدار)
- **TypeScript**
- **Node.js** (LTS version)

### Message Broker
- **Apache Kafka** (KRaft mode - بدون Zookeeper)
- **KafkaJS** (کلاینت Kafka برای Node.js)

### Database
- **PostgreSQL** (آخرین نسخه) - در Docker
- **TypeORM** - ORM برای NestJS

### Authentication & Authorization
- **Passport.js**
- **JWT (JSON Web Tokens)**
- **bcrypt** - هش کردن رمز عبور

### Documentation
- **Swagger/OpenAPI** - مستندسازی خودکار API

### Container Platform
- **Docker & Docker Compose** (فقط برای PostgreSQL و Kafka)

---

## 📁 ساختار پروژه

```
first-tasks/
├── docker/
│   ├── docker-compose.yml          # PostgreSQL + Kafka
│   └── .env.docker                 # متغیرهای محیطی Docker
├── gateway/                        # API Gateway Service
│   ├── src/
│   ├── package.json
│   └── .env
├── auth-service/                   # Authentication Service
│   ├── src/
│   ├── package.json
│   └── .env
├── export-service/                 # Export Database Service
│   ├── src/
│   ├── package.json
│   └── .env
└── README.md                       # این فایل
```

---

## 🔧 پیکربندی‌های مورد نیاز

### PostgreSQL Configuration
- Host: localhost
- Port: 5432
- Database: microservices_db
- Username: postgres
- Password: postgres123

### Kafka Configuration
- Bootstrap Server: localhost:9092
- Mode: KRaft (بدون Zookeeper)
- Topics:
  - `auth.request`
  - `auth.response`
  - `export.request`
  - `export.response`

### Services Ports
- Gateway: 3000
- Auth Service: 3001
- Export Service: 3002

---

## 🔐 نقش‌ها و مجوزها

### Role: `admin`
- ✅ دسترسی کامل به تمام endpoints
- ✅ دسترسی به Export Database Service
- ✅ امکان دریافت لیست کاربران

### Role: `user`
- ✅ دسترسی به پروفایل شخصی
- ❌ بدون دسترسی به Export Database Service
- ❌ بدون دسترسی به لیست کاربران

---

## 📡 API Endpoints (پیش‌نویس)

### Gateway (Port 3000)
```
GET  /health
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
POST /api/export/query        # Export data in JSON/CSV/Excel/PDF
POST /api/export/schema       # Get database metadata
```

### Authentication Service (Internal - via Kafka)
```
Topics consumed: auth.request
Topics produced: auth.response
```

### Export Service (Internal - via Kafka)
```
Topics consumed: export.request
Topics produced: export.response
```

---

## 🚫 Exception Handling Strategy

### سطوح خطا:
1. **Validation Errors** (400) - خطاهای اعتبارسنجی ورودی
2. **Authentication Errors** (401) - خطاهای احراز هویت
3. **Authorization Errors** (403) - عدم دسترسی
4. **Not Found Errors** (404) - منابع یافت نشده
5. **Internal Server Errors** (500) - خطاهای سرور
6. **Database Errors** - خطاهای دیتابیس
7. **Kafka Communication Errors** - خطاهای ارتباطی

### فرمت پاسخ خطا:
```json
{
  "statusCode": 400,
  "message": "توضیحات خطا",
  "error": "Bad Request",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

---

## ✅ امکانات ضروری (الزامی)

- [x] احراز هویت با JWT
- [x] مجوزدهی مبتنی بر نقش (RBAC)
- [x] ارتباط Kafka بین سرویس‌ها
- [x] اتصال به PostgreSQL
- [x] Query Builder پویا
- [x] فیلتر کردن ستون‌ها
- [x] Validation ورودی‌ها
- [x] Exception Handling جامع
- [x] Swagger Documentation
- [x] Health Check endpoints
- [x] Environment Variables Management
- [x] CORS Configuration
- [x] **Export به فرمت‌های مختلف (JSON, CSV, Excel, PDF)**
- [x] **JSON Parsing خودکار**
- [x] **Database Schema Metadata API**
- [x] **Date Range Filtering**
- [x] **Download Mode (inline/attachment)**

---

## 🔄 امکانات اختیاری (پیاده‌سازی در صورت درخواست)

- [ ] Rate Limiting
- [ ] Request Logging & Monitoring
- [ ] Caching (Redis)
- [ ] Database Migration System
- [ ] Unit & Integration Tests
- [ ] CI/CD Pipeline
- [ ] API Versioning
- [ ] Refresh Token Mechanism
- [ ] Password Reset Functionality
- [ ] Email Notifications
- [ ] Request Throttling
- [ ] Data Encryption at Rest
- [ ] Audit Logging
- [ ] Metrics & Prometheus Integration

---

## 📝 نحوه استفاده از سیستم

### سناریوی کاربر Admin:
1. ثبت‌نام با نقش `admin`
2. دریافت JWT Token
3. ارسال درخواست به Gateway با Token
4. Gateway تایید هویت را از Auth Service درخواست می‌کند
5. Gateway درخواست export را به Export Service ارسال می‌کند
6. دریافت داده‌های فیلتر شده از دیتابیس

### سناریوی کاربر عادی:
1. ثبت‌نام با نقش `user`
2. دریافت JWT Token
3. ارسال درخواست به Gateway با Token
4. Gateway تایید هویت را انجام می‌دهد
5. در صورت درخواست export، خطای 403 Forbidden دریافت می‌کند

---

## 🚀 دستورات اجرا

### راه‌اندازی Infrastructure (Docker)
```bash
cd docker
docker-compose up -d
```

### اجرای سرویس‌ها (Development Mode)
```bash
# Terminal 1 - Gateway
cd gateway
npm install
npm run start:dev

# Terminal 2 - Auth Service
cd auth-service
npm install
npm run start:dev

# Terminal 3 - Export Service
cd export-service
npm install
npm run start:dev
```

### دسترسی به Swagger Documentation
```
http://localhost:3000/api/docs
```

---

## 📊 وضعیت پیاده‌سازی

| مرحله | وضعیت | توضیحات |
|-------|-------|---------|
| 0️⃣ پیش‌نیازها | ✅ کامل شد | Docker, PostgreSQL, Kafka راه‌اندازی شد |
| 1️⃣ Gateway | ✅ کامل شد | NestJS, Kafka integration, Swagger |
| 2️⃣ Auth Service | ✅ کامل شد | JWT, bcrypt, TypeORM, Kafka |
| 3️⃣ Export Service | ✅ کامل شد | Query Builder, Multi-format Export, PDF Generation |

### 🎉 قابلیت‌های پیاده‌سازی شده در Export Service:

| قابلیت | وضعیت | توضیحات |
|--------|-------|---------|
| JSON Export | ✅ | با parse خودکار داده‌ها |
| CSV Export | ✅ | با header و encoding صحیح |
| Excel Export | ✅ | فرمت XLSX با ستون‌های مشخص |
| PDF Export | ✅ | جدول فرمت شده با pagination خودکار |
| Schema Metadata | ✅ | لیست جداول، ستون‌ها، row count |
| Date Filtering | ✅ | fromDate, toDate, dateColumn |
| Download Mode | ✅ | inline JSON یا file attachment |
| Column Selection | ✅ | انتخاب ستون‌های خاص |
| WHERE Clause | ✅ | فیلتر سفارشی SQL |
| Pagination | ✅ | limit و offset |

---

## 📌 نکات مهم

1. **نسخه‌ها**: همه پکیج‌ها و تکنولوژی‌ها از آخرین نسخه‌های پایدار استفاده می‌کنند
2. **Kafka KRaft**: استفاده از KRaft mode بدون نیاز به Zookeeper
3. **Environment Variables**: تمام تنظیمات حساس در فایل‌های `.env` نگهداری می‌شوند
4. **Security**: رمزهای عبور با bcrypt هش می‌شوند
5. **Validation**: تمام ورودی‌ها با class-validator اعتبارسنجی می‌شوند
6. **Docker**: فقط PostgreSQL و Kafka در Docker اجرا می‌شوند
7. **Development**: سرویس‌های NestJS در حالت development به صورت دستی اجرا می‌شوند

---

## 🔄 تاریخچه تغییرات

این بخش پس از هر مرحله از پیاده‌سازی به‌روزرسانی خواهد شد.

### [مرحله 1 - API Gateway] ✅ کامل شد - 2025-11-22

#### ✅ موارد پیاده‌سازی شده:

**1. ساختار پروژه NestJS:**
```
gateway/
├── src/
│   ├── auth/              # Auth proxy endpoints
│   ├── export/            # Export proxy endpoints
│   ├── health/            # Health check endpoints
│   ├── kafka/             # Kafka service
│   ├── common/            # Filters & Interceptors
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── tsconfig.json
```

**2. Dependencies نصب شده:**
- @nestjs/core, @nestjs/common (v11.1.9)
- @nestjs/platform-express
- @nestjs/microservices
- @nestjs/swagger (v11.2.3)
- @nestjs/config
- kafkajs (v2.2.4)
- class-validator, class-transformer
- TypeScript, ts-loader

**3. Kafka Integration:**
- ✅ KafkaService با Request-Reply Pattern
- ✅ اتصال به Kafka Producer
- ✅ پشتیبانی از correlation ID
- ✅ Timeout handling (30s default)
- ✅ Retry mechanism

**4. API Endpoints:**

**Health Check:**
- `GET /health` - سلامت کلی سرویس
- `GET /health/ready` - آمادگی سرویس
- `GET /health/live` - زنده بودن سرویس

**Authentication (Proxy to auth-service):**
- `POST /api/auth/register` - ثبت‌نام کاربر
- `POST /api/auth/login` - ورود کاربر
- `GET /api/auth/profile` - پروفایل (نیاز به token)

**Database Export (Proxy to export-service):**
- `POST /api/export/query` - استخراج داده (فقط admin)
  - Formats: JSON, CSV, Excel, PDF
  - با فیلتر تاریخ، انتخاب ستون، WHERE clause
  - Download mode: inline یا file attachment
- `POST /api/export/schema` - دریافت metadata دیتابیس (فقط admin)
  - لیست تمام جداول
  - ستون‌ها با type و nullable
  - تعداد رکوردها

**5. Features پیاده‌سازی شده:**
- ✅ **Global Exception Filter**: مدیریت یکپارچه خطاها
- ✅ **Logging Interceptor**: لاگ تمام درخواست‌ها
- ✅ **Validation Pipe**: اعتبارسنجی خودکار DTOs
- ✅ **CORS Support**: پشتیبانی Cross-Origin
- ✅ **Swagger Documentation**: مستندسازی کامل
- ✅ **Environment Configuration**: مدیریت تنظیمات

**6. DTOs ایجاد شده:**
- `RegisterDto` - ثبت‌نام کاربر
- `LoginDto` - ورود کاربر
- `ExportQueryDto` - استخراج داده با فیلتر

**7. Error Handling:**
- استاندارد HTTP status codes
- پیام‌های خطای واضح و یکپارچه
- لاگ‌گیری خطاها
- Timeout protection

#### 📝 دستورات اجرا (مرحله 1):

**راه‌اندازی Gateway:**
```bash
cd gateway
npm install
npm run start:dev
```

**دسترسی به سرویس:**
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/health

**تست Health Endpoint:**
```bash
curl http://localhost:3000/health
```

#### 🎯 نتایج تست:

**✅ Gateway Startup:**
- NestJS application راه‌اندازی شد
- Kafka Producer متصل شد
- تمام routes ثبت شدند
- Swagger در دسترس است

**✅ Endpoints:**
- Health check: ✅ کار می‌کند
- Swagger docs: ✅ در دسترس
- Auth routes: ✅ آماده (منتظر auth-service)
- Export routes: ✅ آماده (منتظر export-service)

#### 🔧 تنظیمات محیط:

```env
PORT=3000
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=api-gateway
KAFKA_AUTH_REQUEST_TOPIC=auth.request
KAFKA_AUTH_RESPONSE_TOPIC=auth.response
KAFKA_EXPORT_REQUEST_TOPIC=export.request
KAFKA_EXPORT_RESPONSE_TOPIC=export.response
KAFKA_REQUEST_TIMEOUT=30000
```

#### 📚 مستندات:

- ✅ README.md برای Gateway
- ✅ Swagger interactive documentation
- ✅ تمام endpoints مستندسازی شده
- ✅ نمونه request/response

#### 🎨 معماری:

```
Client (HTTP)
     ↓
API Gateway :3000
     ↓
Kafka Topics
     ↓
Microservices
```

#### 📌 نکات مهم:

1. **Stateless Design**: Gateway هیچ state-ای ذخیره نمی‌کند
2. **Proxy Pattern**: فقط routing و forward کردن
3. **Request-Reply**: Kafka با correlation ID
4. **Timeout**: 30 ثانیه برای هر request
5. **Scalable**: قابل scale افقی

#### 🔍 Troubleshooting:

**اگر Gateway start نشد:**
- Port 3000 آزاد باشد
- Kafka در حال اجرا باشد
- Dependencies نصب شده باشند

**اگر Kafka اتصال برقرار نکرد:**
- Docker containers بررسی شوند
- KAFKA_BROKER صحیح باشد

---

### [مرحله 0 - پیش‌نیازها] ✅ کامل شد - 2025-11-22

#### ✅ موارد پیاده‌سازی شده:

**1. ساختار پوشه‌های پروژه:**
```
first-tasks/
├── docker/
│   ├── init-scripts/
│   │   └── 01-init-database.sql      # اسکریپت اولیه دیتابیس
│   ├── test-scripts/
│   │   ├── package.json
│   │   ├── test-postgres.js          # تست اتصال PostgreSQL
│   │   └── test-kafka.js             # تست اتصال Kafka
│   ├── docker-compose.yml            # تنظیمات Docker services
│   ├── .env.docker                   # متغیرهای محیطی
│   └── .env.example                  # نمونه تنظیمات
├── gateway/                          # پوشه Gateway (آماده برای مرحله 1)
├── auth-service/                     # پوشه Auth Service (آماده برای مرحله 2)
├── export-service/                   # پوشه Export Service (آماده برای مرحله 3)
├── .gitignore                        # فایل‌های نادیده گرفته شده
└── README.md                         # این فایل
```

**2. Docker Services راه‌اندازی شده:**

| سرویس | Image | Port | وضعیت | توضیحات |
|-------|-------|------|-------|---------|
| PostgreSQL | postgres:16-alpine | 5432 | ✅ Running | دیتابیس اصلی با 4 جدول نمونه |
| Kafka | apache/kafka:latest | 9092, 9093 | ✅ Running | KRaft mode (بدون Zookeeper) |
| Kafka UI | provectuslabs/kafka-ui | 8080 | ✅ Running | رابط مدیریت Kafka |
| pgAdmin | dpage/pgadmin4 | 5050 | ✅ Running | رابط مدیریت PostgreSQL |

**3. دیتابیس PostgreSQL:**
- ✅ دیتابیس `microservices_db` ایجاد شد
- ✅ جداول ایجاد شده:
  - `users` (4 رکورد نمونه) - شامل admin و user roles
  - `products` (10 رکورد نمونه)
  - `orders` (4 رکورد نمونه)
  - `order_items` (10 رکورد نمونه)
- ✅ Triggers برای auto-update `updated_at`
- ✅ Indexes برای کوئری‌های سریع‌تر

**4. Kafka Topics ایجاد شده:**
- ✅ `auth.request` (3 partitions)
- ✅ `auth.response` (3 partitions)
- ✅ `export.request` (3 partitions)
- ✅ `export.response` (3 partitions)

**5. اسکریپت‌های تست:**
- ✅ `test-postgres.js` - تست کامل اتصال به PostgreSQL
- ✅ `test-kafka.js` - تست producer/consumer و topics

#### 📝 دستورات اجرا (مرحله 0):

**راه‌اندازی Docker Services:**
```bash
cd docker
docker-compose --env-file .env.docker up -d
```

**بررسی وضعیت Containers:**
```bash
docker ps
```

**مشاهده لاگ‌ها:**
```bash
docker logs microservices-postgres
docker logs microservices-kafka
```

**تست اتصالات:**
```bash
cd docker/test-scripts
npm install
npm run test:kafka       # تست Kafka (✅ موفق)
```

**دسترسی به UI Tools:**
- Kafka UI: http://localhost:8080
- pgAdmin: http://localhost:5050
  - Email: admin@admin.com
  - Password: admin123

**متوقف کردن Services:**
```bash
cd docker
docker-compose down
```

**پاک کردن همه چیز (شامل volumes):**
```bash
cd docker
docker-compose down -v
```

#### ⚙️ تنظیمات محیط (.env.docker):

```env
# PostgreSQL
POSTGRES_DB=microservices_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# pgAdmin
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin123

# Kafka
KAFKA_CLUSTER_ID=MkU3OEVBNTcwNTJENDM2Qk
```

#### 🎯 نتایج تست:

**✅ Kafka Test:**
- اتصال به Kafka موفق
- ایجاد topics موفق
- ارسال و دریافت پیام موفق
- 4 topic با 3 partition هر کدام ایجاد شد

**✅ PostgreSQL (از داخل container):**
- 4 جدول با data نمونه
- Triggers و indexes فعال
- Schema اولیه آماده

#### 📌 نکات مهم:

1. **Kafka Version:** استفاده از آخرین نسخه Apache Kafka (4.0.0) با KRaft mode
2. **PostgreSQL Version:** PostgreSQL 16 Alpine (lightweight)
3. **Data Persistence:** تمام data در Docker volumes ذخیره می‌شود
4. **Network:** همه services در یک network مشترک (`microservices-network`)
5. **Health Checks:** PostgreSQL دارای health check است

#### 🔍 Troubleshooting:

**اگر Kafka start نشد:**
- منتظر بمانید 20-30 ثانیه (Kafka نیاز به زمان دارد)
- لاگ‌ها را بررسی کنید: `docker logs microservices-kafka`

**اگر PostgreSQL به مشکل خورد:**
- Volumes را پاک کنید: `docker-compose down -v`
- مجدد start کنید: `docker-compose up -d`

---

### [نسخه اولیه] - 2025-11-22
- ایجاد مستند اولیه پروژه
- تعریف معماری کلی سیستم
- مشخص کردن مراحل پیاده‌سازی

---

**✅ مرحله 0 کامل شد! آماده شروع مرحله 1️⃣ (API Gateway) هستید؟**

---

### [مرحله 2 - Authentication Service] ✅ کامل شد - 2025-11-22

تمام قابلیت‌های احراز هویت و مجوزدهی با JWT و Role-Based Access Control پیاده‌سازی شد.

---

### [مرحله 3 - Export Database Service] ✅ کامل شد - 2025-11-22

#### ✅ موارد پیاده‌سازی شده:

**1. ساختار پروژه:**
```
export-service/
├── src/
│   ├── export/
│   │   ├── dto/
│   │   │   └── export-query.dto.ts
│   │   ├── export.service.ts
│   │   ├── query-builder.service.ts
│   │   ├── file-generator.service.ts
│   │   ├── export.module.ts
│   │   └── export.controller.ts
│   ├── kafka/
│   │   ├── kafka.service.ts
│   │   └── kafka.module.ts
│   ├── auth/
│   │   └── jwt.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
└── package.json
```

**2. Dependencies نصب شده:**
- TypeORM & PostgreSQL driver
- KafkaJS
- ExcelJS (برای فایل‌های Excel)
- csv-writer (برای فایل‌های CSV)
- pdfkit & @types/pdfkit (برای PDF)
- class-validator & class-transformer

**3. قابلیت‌های Export:**

**📄 Export Formats:**

**JSON Format:**
- ✅ Parse خودکار به JavaScript object
- ✅ فرمت readable با indent
- ✅ مناسب برای API responses

**CSV Format:**
- ✅ Header row با نام ستون‌ها
- ✅ UTF-8 encoding
- ✅ Compatible با Excel و Google Sheets

**Excel Format:**
- ✅ فرمت XLSX
- ✅ Auto-sizing columns
- ✅ Header formatting
- ✅ Multiple sheets (نام جدول)

**PDF Format (جدید):**
- ✅ جدول فرمت شده با border
- ✅ Landscape A4 برای ستون‌های بیشتر
- ✅ Auto-pagination با header در هر صفحه
- ✅ Footer با page number و record count
- ✅ Title و timestamp

**4. Schema Metadata API:**

**Endpoint:** `POST /api/export/schema`

**قابلیت‌ها:**
- ✅ لیست تمام جداول دیتابیس
- ✅ ستون‌های هر جدول با:
  - نام ستون
  - نوع داده (data type)
  - nullable یا not null
- ✅ تعداد رکوردهای هر جدول
- ✅ فقط برای admin

**نمونه Response:**
```json
{
  "success": true,
  "tables": [
    {
      "tableName": "users",
      "rowCount": 10,
      "columns": [
        {
          "name": "id",
          "type": "integer",
          "nullable": false
        },
        {
          "name": "username",
          "type": "character varying",
          "nullable": false
        }
      ]
    }
  ]
}
```

**5. Date Range Filtering:**

**پارامترها:**
- `fromDate` (ISO 8601): فیلتر از تاریخ
- `toDate` (ISO 8601): فیلتر تا تاریخ
- `dateColumn` (string): نام ستون تاریخ (default: `created_at`)

**مثال:**
```json
{
  "table": "users",
  "format": "pdf",
  "fromDate": "2025-11-22T00:00:00.000Z",
  "toDate": "2025-11-22T23:59:59.999Z",
  "dateColumn": "created_at"
}
```

**نحوه کار:**
- ایجاد WHERE clause خودکار
- ترکیب با WHERE سفارشی کاربر
- Parameterized queries (امنیت SQL injection)

**6. Download Mode:**

**پارامتر:** `download` (boolean)

**Modes:**
- `download: false` (default):
  - JSON: پاسخ inline با data parsed
  - CSV/Excel/PDF: base64 string در JSON
  
- `download: true`:
  - CSV/Excel/PDF: فایل attachment با headers
  - JSON: همچنان inline (exception)

**Headers برای Download:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="users_export.pdf"
```

**7. امنیت و Validation:**

**✅ SQL Injection Prevention:**
- استفاده از TypeORM Query Builder
- Parameterized queries
- Whitelist validation برای table/column names

**✅ Authorization:**
- تایید JWT token
- بررسی نقش admin
- Error handling برای unauthorized

**✅ Input Validation:**
- class-validator decorators
- @IsIn برای فرمت‌ها
- @IsDateString برای تاریخ‌ها
- @IsOptional برای فیلدهای اختیاری

#### 📝 نمونه Requests:

**1. Export JSON with Date Filter:**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table": "users",
    "format": "json",
    "fromDate": "2025-11-22T00:00:00.000Z",
    "toDate": "2025-11-22T23:59:59.999Z"
  }'
```

**2. Download PDF with Columns:**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table": "users",
    "format": "pdf",
    "download": true,
    "columns": ["id", "username", "email", "role", "created_at"],
    "limit": 100
  }' -o users.pdf
```

**3. Get Database Schema:**
```bash
curl -X POST http://localhost:3000/api/export/schema \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**4. Export CSV with WHERE:**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table": "users",
    "format": "csv",
    "download": true,
    "where": "role = '\''admin'\''"
  }' -o admin-users.csv
```

#### 🎯 ویژگی‌های PDF Generator:

**Layout:**
- Landscape A4 (برای ستون‌های بیشتر)
- Margins: 50px
- Font: Helvetica (Built-in)

**Table Design:**
- Border برای تمام cells
- Header با font bold
- Auto text truncation با ellipsis
- Column width مساوی

**Pagination:**
- تشخیص خودکار نیاز به صفحه جدید
- Header تکرار در هر صفحه
- Page numbers در footer
- Total record count

**Performance:**
- Stream-based generation
- Memory efficient برای داده‌های زیاد
- Promise-based async/await

#### 🔧 تنظیمات Export Service:

```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=microservices_db

KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=export-service
KAFKA_GROUP_ID=export-service-group

JWT_SECRET=your-secret-key-here
```

#### 📚 Swagger Documentation:

**Export Query Endpoint Examples:**
- Export all users (JSON)
- Export specific columns
- Export with filter (WHERE)
- Export with pagination
- Export as CSV
- Export as Excel
- **Export as PDF** (جدید)
- **Download PDF file** (جدید)
- **PDF with date filter** (جدید)
- **Download CSV/Excel** (جدید)

**Schema Endpoint:**
- Get all database metadata
- Tables, columns, types, row counts

#### 📌 نکات مهم:

1. **PDF Performance**: برای جداول بزرگ (>1000 row) از limit استفاده کنید
2. **Date Format**: فقط ISO 8601 پذیرفته می‌شود
3. **Column Names**: باید دقیقاً با نام ستون‌های دیتابیس مطابقت داشته باشد
4. **Download Mode**: فقط برای CSV/Excel/PDF کار می‌کند، JSON همیشه inline است
5. **Schema API**: کمک می‌کند column names صحیح را پیدا کنید

#### 🎨 PDF Sample Output:

```
┌─────────────────────────────────────────────┐
│     Export: users                           │
│     Generated: 11/22/2025, 2:30:45 PM      │
├────┬──────────┬─────────────────┬──────────┤
│ id │ username │ email           │ role     │
├────┼──────────┼─────────────────┼──────────┤
│ 1  │ admin    │ admin@test.com  │ admin    │
│ 2  │ john_doe │ john@test.com   │ user     │
└────┴──────────┴─────────────────┴──────────┘

     Page 1 of 1 | Total Records: 2
```

#### ✅ Testing Checklist:

- [x] JSON export با parse صحیح
- [x] CSV export با header
- [x] Excel export قابل باز شدن
- [x] PDF export با فرمت جدول
- [x] Schema API با metadata کامل
- [x] Date filtering با تاریخ‌های مختلف
- [x] Download mode برای فایل‌ها
- [x] Inline mode برای JSON
- [x] Column selection
- [x] WHERE clause filtering
- [x] Pagination
- [x] Authorization (admin only)
- [x] Error handling

#### 🔍 فایل تست:

اسکریپت جامع تست در `test-export-features.sh` ایجاد شده که تمام قابلیت‌ها را تست می‌کند.

**اجرای تست:**
```bash
cd /d/6\ -\ hooshan-kavosh-borna/1\ -\ first-tasks
bash test-export-features.sh
```

---

**🎉 تمام مراحل پروژه با موفقیت کامل شد!**
