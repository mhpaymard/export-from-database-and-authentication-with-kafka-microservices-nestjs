# Test Scripts

This directory contains test scripts to verify PostgreSQL and Kafka connections.

## Prerequisites

Install dependencies:
```bash
npm install
```

## Running Tests

### Test PostgreSQL Connection
```bash
npm run test:postgres
```

### Test Kafka Connection
```bash
npm run test:kafka
```

### Test Both
```bash
npm run test:all
```

## What Each Test Does

### PostgreSQL Test (`test-postgres.js`)
- Connects to PostgreSQL database
- Displays database version
- Lists all tables
- Shows record counts
- Queries sample data from users and products tables

### Kafka Test (`test-kafka.js`)
- Connects to Kafka broker
- Shows cluster information
- Creates microservices topics (auth.request, auth.response, export.request, export.response)
- Tests producer by sending a message
- Tests consumer by receiving a message

## Troubleshooting

If tests fail, make sure:
1. Docker containers are running: `docker-compose ps`
2. PostgreSQL is healthy: `docker logs microservices-postgres`
3. Kafka is healthy: `docker logs microservices-kafka`
4. Wait 20-30 seconds after starting containers for Kafka to be ready
