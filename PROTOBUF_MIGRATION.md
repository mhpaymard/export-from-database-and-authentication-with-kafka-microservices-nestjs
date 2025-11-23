# Protobuf Migration Guide

## نمای کلی (Overview)

این پروژه از **Protocol Buffers (Protobuf)** برای سریالیزه کردن پیام‌های Kafka استفاده می‌کند. Protobuf یک فرمت باینری کارآمد است که مزایای زیر را دارد:

- ✅ **کاهش حجم پیام‌ها**: 30-50% کوچک‌تر از JSON
- ✅ **سرعت بیشتر**: سریالیزه/دسریالیزه کردن سریع‌تر
- ✅ **Type Safety**: بررسی نوع داده در زمان کامپایل
- ✅ **Schema Evolution**: امکان تغییر Schema بدون شکستن سازگاری
- ✅ **زبان‌ناشناس**: قابل استفاده در زبان‌های مختلف

---

## ساختار پروژه (Project Structure)

```
project-root/
├── protos/                          # Proto schema files (مشترک بین تمام سرویس‌ها)
│   ├── auth.proto                   # Auth message schemas
│   └── export.proto                 # Export message schemas
│
├── gateway/
│   └── src/
│       ├── proto/
│       │   ├── proto.service.ts     # Proto loader service
│       │   └── proto.module.ts      # Proto module (Global)
│       └── kafka/kafka.service.ts   # Kafka with Protobuf encoding/decoding
│
├── auth-service/
│   └── src/
│       ├── proto/
│       │   ├── proto.service.ts     # Proto loader service
│       │   └── proto.module.ts      # Proto module (Global)
│       └── kafka/kafka.service.ts   # Kafka with Protobuf encoding/decoding
│
└── export-service/
    └── src/
        ├── proto/
        │   ├── proto.service.ts     # Proto loader service
        │   └── proto.module.ts      # Proto module (Global)
        └── kafka/kafka.service.ts   # Kafka with Protobuf encoding/decoding
```

---

## Proto Schemas

### 1. `auth.proto`

```protobuf
syntax = "proto3";

package auth;

// Register Request
message RegisterRequest {
  string username = 1;
  string email = 2;
  string password = 3;
  optional string role = 4;
  optional string firstName = 5;
  optional string lastName = 6;
}

// Register Response
message RegisterResponse {
  bool success = 1;
  optional string message = 2;
  optional User user = 3;
  optional string error = 4;
}

// Login Request
message LoginRequest {
  string username = 1;
  string password = 2;
}

// Login Response
message LoginResponse {
  bool success = 1;
  optional string token = 2;
  optional User user = 3;
  optional string error = 4;
}

// Verify Token Request
message VerifyTokenRequest {
  string token = 1;
}

// Verify Token Response
message VerifyTokenResponse {
  bool success = 1;
  optional User user = 2;
  optional string error = 3;
}

// User Model
message User {
  int32 id = 1;
  string username = 2;
  string email = 3;
  optional string role = 4;
  optional string firstName = 5;
  optional string lastName = 6;
  string createdAt = 7;
  string updatedAt = 8;
}
```

### 2. `export.proto`

```protobuf
syntax = "proto3";

package export;

// Export Query Request
message ExportQueryRequest {
  string table = 1;
  optional string columns = 2;
  optional string where = 3;
  optional string fromDate = 4;
  optional string toDate = 5;
  optional string dateColumn = 6;
  optional string format = 7;
  optional string download = 8;
  optional int32 limit = 9;
  optional int32 offset = 10;
  string token = 11;
}

// Export Query Response
message ExportQueryResponse {
  bool success = 1;
  optional bytes data = 2;           // Binary data (PDF, Excel)
  optional bool isBase64 = 3;
  optional string contentType = 4;
  optional string filename = 5;
  optional string format = 6;
  optional string error = 7;
}

// Schema Request
message SchemaRequest {
  string token = 1;
}

// Schema Response
message SchemaResponse {
  bool success = 1;
  repeated TableSchema tables = 2;
  optional string error = 3;
}

// Table Schema (nested message)
message TableSchema {
  string tableName = 1;
  repeated ColumnSchema columns = 2;
}

// Column Schema (nested message)
message ColumnSchema {
  string columnName = 1;
  string dataType = 2;
  bool isNullable = 3;
}
```

---

## نحوه کار (How It Works)

### 1. **Gateway → Auth/Export Service (Request)**

```typescript
// Gateway sends Protobuf-encoded request
const response = await this.kafkaService.sendRequest(
  'auth.request',
  'auth.response',
  { username: 'john', password: 'pass123' },  // Payload (plain object)
  'LoginRequest',                              // Message type
  30000                                        // Timeout
);
```

**Kafka Message:**
```
Headers:
  - correlationId: "1234567890-abc123"
  - messageType: "LoginRequest"
  - timestamp: "1736157600000"

Value: <binary protobuf data>
```

### 2. **Auth/Export Service Processes Request**

```typescript
// Service decodes Protobuf message
const request = this.protoService.decode(
  this.protoService.LoginRequest,
  Buffer.from(message.value)
);

// Process request
const result = await this.authService.login(request);

// Send Protobuf-encoded response
await this.sendResponse(correlationId, 'LoginResponse', result);
```

### 3. **Gateway Receives Response**

```typescript
// Gateway decodes Protobuf response automatically
const response = this.protoService.decode(
  this.protoService.LoginResponse,
  Buffer.from(message.value)
);

// Resolve pending request
pending.resolve(response);
```

---

## Message Flow Diagram

```
┌──────────────┐                      ┌──────────────┐
│   Gateway    │                      │ Auth Service │
└──────────────┘                      └──────────────┘
       │                                     │
       │  1. Encode LoginRequest             │
       │     (username, password)            │
       │─────────────────────────────────────>│
       │     Kafka: auth.request             │
       │     Headers: correlationId,         │
       │              messageType            │
       │                                     │
       │                                     │ 2. Decode LoginRequest
       │                                     │    Process login
       │                                     │    Encode LoginResponse
       │                                     │
       │<─────────────────────────────────────│
       │     Kafka: auth.response            │
       │     Headers: correlationId,         │
       │              messageType            │
       │  3. Decode LoginResponse            │
       │     Return to client                │
       │                                     │
```

---

## ProtoService Usage

### Encoding (تبدیل به باینری)

```typescript
const payload = {
  username: 'john_doe',
  password: 'securepass123',
};

const encoded = this.protoService.encode(
  this.protoService.LoginRequest,
  payload
);
// Result: Buffer <binary data>
```

### Decoding (تبدیل از باینری)

```typescript
const decoded = this.protoService.decode<LoginRequest>(
  this.protoService.LoginRequest,
  encodedBuffer
);
// Result: { username: 'john_doe', password: 'securepass123' }
```

---

## Testing

### تست با Kafka UI

1. باز کردن Kafka UI: http://localhost:8080
2. رفتن به Topics → `auth.request`
3. مشاهده پیام‌های باینری (به جای JSON)
4. بررسی Headers:
   - `correlationId`
   - `messageType`
   - `timestamp`

### تست با curl

```bash
# Register user (پیام داخلی به صورت Protobuf ارسال می‌شود)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "Test@123"
  }'
```

---

## مقایسه JSON vs Protobuf

### پیام JSON (قبل از Protobuf)

```json
{
  "correlationId": "1736157600000-abc123",
  "action": "login",
  "data": {
    "username": "john_doe",
    "password": "securepass123"
  },
  "timestamp": 1736157600000
}
```
**Size:** ~150 bytes

### پیام Protobuf (بعد از Protobuf)

```
Headers:
  correlationId: "1736157600000-abc123"
  messageType: "LoginRequest"
  timestamp: "1736157600000"

Value: <0a 08 6a 6f 68 6e 5f 64 6f 65 12 0e 73 65 63 75 72 65 70 61 73 73 31 32 33>
```
**Size:** ~80 bytes (47% کوچک‌تر)

---

## Migration Checklist ✅

- [x] Create `protos/` directory
- [x] Define `auth.proto` schema
- [x] Define `export.proto` schema
- [x] Install `protobufjs` in all services
- [x] Create `ProtoService` for Gateway
- [x] Create `ProtoService` for Auth Service
- [x] Create `ProtoService` for Export Service
- [x] Register `ProtoModule` in all `AppModule`
- [x] Update Gateway `KafkaService` (encode/decode)
- [x] Update Auth Service `KafkaService` (encode/decode)
- [x] Update Export Service `KafkaService` (encode/decode)
- [x] Update Gateway controllers to use message types
- [x] Move `correlationId` to message headers
- [x] Build all services without errors
- [ ] Test register endpoint
- [ ] Test login endpoint
- [ ] Test profile endpoint
- [ ] Test export endpoint
- [ ] Test schema endpoint

---

## Dependencies

```json
{
  "protobufjs": "^7.4.0"
}
```

**Note:** فایل `@types/protobufjs` نیاز نیست چون `protobufjs` به صورت built-in type definitions دارد.

---

## Benefits Summary

| Feature              | JSON     | Protobuf |
|----------------------|----------|----------|
| Message Size         | 150 bytes| 80 bytes |
| Serialization Speed  | Medium   | Fast     |
| Type Safety          | Runtime  | Compile  |
| Schema Validation    | Manual   | Auto     |
| Language Support     | Limited  | Multi    |
| Binary Format        | ❌       | ✅       |

---

## Troubleshooting

### خطا: "Protobuf validation error"
- بررسی کنید که تمام فیلدهای required پر شده باشند
- بررسی کنید که نوع داده‌ها مطابق schema باشند

### خطا: "Unknown message type"
- بررسی کنید که `messageType` در headers صحیح باشد
- بررسی کنید که ProtoService تمام message types را load کرده باشد

### پیام در Kafka ارسال نمی‌شود
- بررسی کنید که Kafka در حال اجرا باشد
- بررسی کنید که ProtoModule در AppModule import شده باشد

---

## Future Improvements

- [ ] Add message compression (gzip)
- [ ] Add message encryption
- [ ] Add schema versioning
- [ ] Performance benchmarking
- [ ] Add Protobuf documentation generator
