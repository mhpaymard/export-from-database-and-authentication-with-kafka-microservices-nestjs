# Kafka Topics Setup

## Initial Setup (یک بار اجرا)

فقط کافی است کل Docker stack را بالا بیاورید. سرویس `kafka-init` به صورت خودکار پس از آماده شدن Kafka اجرا می‌شود و topicهای زیر را می‌سازد:

- `auth.request`
- `auth.response`
- `export.request`
- `export.response`

### دستور راه‌اندازی

```bash
cd docker
docker-compose up -d
```

لاگ `kafka-init` را می‌توانید با دستور زیر ببینید تا مطمئن شوید ساخت topic موفق بوده است:

```bash
docker logs microservices-kafka-init
```

بعد از اولین اجرا، `kafka-init` دیگر اجرا نمی‌شود مگر اینکه volumes را پاک کنید (`docker-compose down -v`).

## راه‌اندازی‌های بعدی

```bash
cd docker
docker-compose up -d
```

چون topicها در volume ذخیره شده‌اند، نیازی به کار اضافه‌ای نیست.

## Troubleshooting

اگر خطای "UNKNOWN_TOPIC_OR_PARTITION" دریافت کردید:

1. بررسی کنید topicها وجود دارند:
```bash
docker exec microservices-kafka sh -c "/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list"
```

2. اگر topicها وجود ندارند، می‌توانید `kafka-init` را دوباره اجرا کنید:
```bash
docker-compose up -d kafka-init
```
یا دستورهای ساخت topic را دستی اجرا کنید.

## Auto-Create Topics

Kafka با `KAFKA_AUTO_CREATE_TOPICS_ENABLE: true` تنظیم شده است. Topic های جدید خودکار ساخته می‌شوند، اما موضوع‌های اصلی پروژه از طریق `kafka-init` تضمین می‌شوند تا race condition بین سرویس‌ها رخ ندهد.

## Kafka UI

بعد از راه‌اندازی، Kafka UI در آدرس زیر در دسترس است:
```
http://localhost:8080
```

در آنجا می‌توانید تمام topicها، consumer groups، و پیام‌ها را ببینید.
