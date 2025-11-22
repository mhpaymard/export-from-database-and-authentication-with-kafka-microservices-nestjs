# Auth Service

Authentication and Authorization microservice built with NestJS, JWT, and Kafka.

## Features

- ✅ User registration with password hashing (bcrypt)
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, User)
- ✅ Kafka integration for microservices communication
- ✅ PostgreSQL database with TypeORM
- ✅ Input validation with class-validator

## Prerequisites

- Node.js 18+
- PostgreSQL 16 (running on Docker)
- Kafka (running on Docker)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=microservices_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_AUTH_REQUEST_TOPIC=auth.request
KAFKA_AUTH_RESPONSE_TOPIC=auth.response
```

## Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Architecture

### Kafka Message Flow

1. **Register User**
   - Gateway sends to `auth.request` topic:
     ```json
     {
       "correlationId": "uuid",
       "action": "register",
       "data": {
         "username": "john_doe",
         "email": "john@example.com",
         "password": "password123",
         "role": "user"
       }
     }
     ```
   - Auth Service responds on `auth.response` topic:
     ```json
     {
       "correlationId": "uuid",
       "success": true,
       "data": {
         "access_token": "jwt-token",
         "user": { "id": 1, "username": "john_doe", "email": "john@example.com", "role": "user" }
       }
     }
     ```

2. **Login**
   - Gateway sends to `auth.request`:
     ```json
     {
       "correlationId": "uuid",
       "action": "login",
       "data": {
         "username": "john_doe",
         "password": "password123"
       }
     }
     ```

3. **Validate Token**
   - Gateway sends to `auth.request`:
     ```json
     {
       "correlationId": "uuid",
       "action": "validate",
       "data": {
         "token": "jwt-token"
       }
     }
     ```

## Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints (via Gateway)

All requests go through API Gateway at `http://localhost:3000`:

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile (requires JWT token)

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- Input validation on all endpoints
- Role-based access control with guards

## License

MIT
