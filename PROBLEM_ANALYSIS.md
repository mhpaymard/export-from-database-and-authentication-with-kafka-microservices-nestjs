# 🔍 ریشه‌یابی مشکل Gateway Timeout

## ❌ مشکل اصلی: Request-Reply Pattern نادرست

Gateway از یک **anti-pattern** استفاده می‌کند:
1. برای هر request یک Consumer موقت ایجاد می‌کند
2. Consumer نیاز به 3-4 ثانیه برای join شدن به group دارد  
3. در این مدت، پیام از Auth Service ارسال می‌شود
4. ولی Consumer هنوز ready نیست ← **پیام از دست می‌رود**

## 📊 شواهد از لاگ‌ها:

```
11:29:00 - Auth: Request sent to auth.request
11:29:00 - Auth: Processing message + Query DB
11:29:00 - Auth: Response sent ← ✅ موفق
11:29:02 - Gateway: Consumer joined group ← ⚠️ 2 ثانیه دیر!
11:29:29 - Gateway: Timeout ← ❌ پیام دریافت نشد
```

## ✅ راه‌حل‌های ممکن:

### گزینه 1: Consumer دائمی (بهترین)
```typescript
// در onModuleInit
private responseConsumer: Consumer;
private pendingRequests = new Map<string, {resolve, reject}>();

async onModuleInit() {
  this.responseConsumer = this.kafka.consumer({ 
    groupId: 'gateway-response-consumer' 
  });
  await this.responseConsumer.subscribe({ topic: 'auth.response' });
  await this.responseConsumer.run({
    eachMessage: async ({ message }) => {
      const response = JSON.parse(message.value);
      const pending = this.pendingRequests.get(response.correlationId);
      if (pending) {
        pending.resolve(response.data);
        this.pendingRequests.delete(response.correlationId);
      }
    }
  });
}

sendRequest() {
  return new Promise((resolve, reject) => {
    const correlationId = uuid();
    this.pendingRequests.set(correlationId, {resolve, reject});
    // Send message
    this.producer.send({...});
  });
}
```

### گزینه 2: افزایش timeout + صبر بیشتر
```typescript
// کاری که الان کردیم ولی کافی نیست
await new Promise(resolve => setTimeout(resolve, 4000));
```

### گزینه 3: استفاده از HTTP بجای Kafka برای sync requests
Auth Service یک REST API هم expose کند.

## 🎯 توصیه

**گزینه 1** را پیاده‌سازی کنیم - Consumer دائمی که همیشه ready است.

---

**تاریخ:** 22 نوامبر 2025  
**وضعیت:** مشکل شناسایی شد - نیاز به refactor
