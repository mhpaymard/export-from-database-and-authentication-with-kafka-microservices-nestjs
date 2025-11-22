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

### مرحله 0️⃣: راه‌اندازی پیش‌نیازها
- [ ] نصب Docker و Docker Compose
- [ ] راه‌اندازی PostgreSQL در Docker
- [ ] راه‌اندازی Apache Kafka با KRaft mode در Docker
- [ ] ایجاد ساختار پروژه اصلی
- [ ] تنظیمات محیط توسعه (environment variables)
- [ ] تست اتصال به PostgreSQL
- [ ] تست اتصال به Kafka
- [ ] ایجاد دیتابیس نمونه و جدول‌های تست

### مرحله 1️⃣: پیاده‌سازی API Gateway
- [ ] ایجاد پروژه NestJS برای Gateway
- [ ] نصب وابستگی‌های Kafka (KafkaJS)
- [ ] پیکربندی اتصال به Kafka
- [ ] پیاده‌سازی Proxy Pattern برای ارسال درخواست‌ها
- [ ] مسیریابی درخواست‌ها به سرویس‌های مختلف
- [ ] اضافه کردن Global Exception Filter
- [ ] پیکربندی CORS
- [ ] پیاده‌سازی Health Check endpoint
- [ ] تست کامل Gateway

### مرحله 2️⃣: پیاده‌سازی Authentication & Authorization Service
- [ ] ایجاد پروژه NestJS برای Auth Service
- [ ] نصب وابستگی‌های Kafka
- [ ] پیکربندی Kafka Consumer/Producer
- [ ] تعریف مدل‌های User و Role
- [ ] پیاده‌سازی JWT Authentication
- [ ] تعریف دو نقش: `admin` (دسترسی کامل) و `user` (بدون دسترسی به export)
- [ ] پیاده‌سازی Guards برای Role-Based Access Control
- [ ] پیاده‌سازی endpoints:
  - POST /auth/register
  - POST /auth/login
  - GET /auth/profile
- [ ] Exception Handling سفارشی
- [ ] تست احراز هویت و مجوزدهی

### مرحله 3️⃣: پیاده‌سازی Export Database Service
- [ ] ایجاد پروژه NestJS برای Export Service
- [ ] نصب TypeORM و وابستگی PostgreSQL
- [ ] پیکربندی اتصال به PostgreSQL
- [ ] نصب وابستگی‌های Kafka
- [ ] پیکربندی Kafka Consumer/Producer
- [ ] پیاده‌سازی Query Builder پویا
- [ ] پیاده‌سازی endpoint برای دریافت نام جدول
- [ ] پیاده‌سازی فیلتر ستون‌ها (انتخاب ستون‌های خاص)
- [ ] پیاده‌سازی فیلتر شرایط (WHERE conditions)
- [ ] پیاده‌سازی Pagination
- [ ] Exception Handling برای خطاهای دیتابیس
- [ ] Validation برای ورودی‌ها
- [ ] تست کامل Export Service

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
POST /api/export/query
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
| 3️⃣ Export Service | ⏳ در انتظار تایید | - |

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
