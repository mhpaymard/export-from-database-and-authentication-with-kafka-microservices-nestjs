# 🚀 دستورات سریع - Quick Commands

## 🐳 مدیریت Docker

### راه‌اندازی تمام services
```bash
cd docker
docker-compose --env-file .env.docker up -d
```

### توقف تمام services
```bash
cd docker
docker-compose down
```

### توقف و پاک کردن volumes (حذف تمام data)
```bash
cd docker
docker-compose down -v
```

### مشاهده وضعیت containers
```bash
docker ps
```

### مشاهده لاگ‌ها
```bash
docker logs microservices-postgres
docker logs microservices-kafka
docker logs microservices-kafka-ui
docker logs microservices-pgadmin
```

### Restart یک service خاص
```bash
docker restart microservices-postgres
docker restart microservices-kafka
```

---

## 🔍 تست اتصالات

### تست Kafka
```bash
cd docker/test-scripts
npm install
npm run test:kafka
```

### تست PostgreSQL (از داخل container)
```bash
docker exec microservices-postgres psql -U postgres -d microservices_db -c "SELECT COUNT(*) FROM users;"
```

### مشاهده جداول PostgreSQL
```bash
docker exec microservices-postgres psql -U postgres -d microservices_db -c "\dt"
```

### مشاهده topics در Kafka
```bash
docker exec microservices-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```

---

## 🌐 دسترسی به UI Tools

- **Kafka UI**: http://localhost:8080
- **pgAdmin**: http://localhost:5050
  - Email: `admin@admin.com`
  - Password: `admin123`

---

## 🔧 PostgreSQL مستقیم

### اتصال به psql از داخل container
```bash
docker exec -it microservices-postgres psql -U postgres -d microservices_db
```

### کوئری‌های مفید
```sql
-- لیست جداول
\dt

-- تعداد رکوردها
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;

-- مشاهده 5 کاربر
SELECT id, username, email, role FROM users LIMIT 5;

-- مشاهده محصولات
SELECT id, name, price, category FROM products LIMIT 5;

-- خروج
\q
```

---

## ⚡ Kafka مستقیم

### ایجاد topic جدید
```bash
docker exec microservices-kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --topic test-topic \
  --partitions 3 \
  --replication-factor 1
```

### مشاهده جزئیات یک topic
```bash
docker exec microservices-kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic auth.request
```

### ارسال پیام به topic
```bash
docker exec -it microservices-kafka kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic auth.request
```

### دریافت پیام از topic
```bash
docker exec -it microservices-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic auth.request \
  --from-beginning
```

---

## 🔄 مراحل بعدی

### مرحله 1: راه‌اندازی Gateway
```bash
cd gateway
npm init -y
nest new . --skip-git
# ادامه در README اصلی...
```

### مرحله 2: راه‌اندازی Auth Service
```bash
cd auth-service
# دستورات در مرحله 2...
```

### مرحله 3: راه‌اندازی Export Service
```bash
cd export-service
# دستورات در مرحله 3...
```

---

## 📝 نکات مهم

1. همیشه قبل از شروع کار، مطمئن شوید Docker services در حال اجرا هستند
2. برای مشاهده تغییرات realtime در Kafka از UI استفاده کنید: http://localhost:8080
3. برای مدیریت دیتابیس از pgAdmin استفاده کنید: http://localhost:5050
4. اگر مشکلی پیش آمد، ابتدا لاگ‌ها را بررسی کنید

---

**📌 این فایل به‌روز نگه داشته می‌شود. برای جزئیات کامل به `README.md` مراجعه کنید.**
