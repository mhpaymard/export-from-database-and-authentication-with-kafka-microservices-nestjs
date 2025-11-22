# Feature Testing Guide - Export Service Enhancements

## Overview
This document covers testing for newly implemented export service features:
1. JSON data parsing
2. Database schema metadata API
3. Date range filtering
4. Download mode (inline vs file download)

---

## Prerequisites

### 1. Start Infrastructure
```bash
cd docker
docker-compose up -d
```

Verify services:
- Kafka UI: http://localhost:8080
- pgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432
- Gateway: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs

### 2. Create Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "SecurePass123",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Save the returned JWT token for authenticated requests.

### 3. Create Test Data (Optional)
```bash
# Register additional users for export testing
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user_1",
    "email": "test1@example.com",
    "password": "pass123",
    "role": "user",
    "firstName": "Test",
    "lastName": "One"
  }'

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user_2",
    "email": "test2@example.com",
    "password": "pass123",
    "role": "user",
    "firstName": "Test",
    "lastName": "Two"
  }'
```

---

## Test 1: JSON Data Parsing

### Purpose
Verify that JSON exports return parsed JavaScript objects instead of stringified JSON.

### Before Enhancement
```json
{
  "success": true,
  "data": "[{\"id\":1,\"username\":\"john\"}]"  // ❌ String
}
```

### After Enhancement
```json
{
  "success": true,
  "data": [{"id":1,"username":"john"}]  // ✅ Parsed array
}
```

### Test Steps

**1. Export users as JSON (inline)**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "table": "users",
  "format": "json",
  "recordCount": 3,
  "data": [
    {
      "id": 1,
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "admin",
      "firstName": "Admin",
      "lastName": "User",
      "created_at": "2025-11-22T10:15:08.000Z",
      "updated_at": "2025-11-22T10:15:08.000Z"
    },
    {
      "id": 2,
      "username": "test_user_1",
      "email": "test1@example.com",
      "role": "user",
      "firstName": "Test",
      "lastName": "One",
      "created_at": "2025-11-22T10:16:00.000Z",
      "updated_at": "2025-11-22T10:16:00.000Z"
    }
  ],
  "contentType": "application/json",
  "filename": "users.json"
}
```

**Validation:**
- ✅ `data` is an array of objects (not a string)
- ✅ `recordCount` matches array length
- ✅ All fields are accessible as object properties

---

## Test 2: Database Schema Metadata API

### Purpose
Retrieve complete database schema including tables, columns, data types, and row counts.

### API Endpoint
`POST /api/export/schema`

### Test Steps

**1. Get full database schema**
```bash
curl -X POST http://localhost:3000/api/export/schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "tables": [
    {
      "tableName": "users",
      "rowCount": 3,
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
        },
        {
          "name": "email",
          "type": "character varying",
          "nullable": false
        },
        {
          "name": "password",
          "type": "character varying",
          "nullable": false
        },
        {
          "name": "role",
          "type": "character varying",
          "nullable": false
        },
        {
          "name": "firstName",
          "type": "character varying",
          "nullable": true
        },
        {
          "name": "lastName",
          "type": "character varying",
          "nullable": true
        },
        {
          "name": "created_at",
          "type": "timestamp without time zone",
          "nullable": false
        },
        {
          "name": "updated_at",
          "type": "timestamp without time zone",
          "nullable": false
        }
      ]
    }
  ]
}
```

**Validation:**
- ✅ All tables in database are listed
- ✅ Each table has accurate `rowCount`
- ✅ All columns with correct data types
- ✅ `nullable` flag matches database constraints

**2. Test with non-admin user (should fail)**
```bash
# First create a regular user and get their token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "regular_user",
    "email": "regular@example.com",
    "password": "pass123",
    "role": "user",
    "firstName": "Regular",
    "lastName": "User"
  }'

# Try to access schema with user token
curl -X POST http://localhost:3000/api/export/schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer REGULAR_USER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "message": "Admin role required for schema access",
  "error": "Forbidden"
}
```

---

## Test 3: Date Range Filtering

### Purpose
Filter exported data by date range using `fromDate`, `toDate`, and `dateColumn` parameters.

### Parameters
- `fromDate` (optional): ISO 8601 date string (e.g., "2025-11-22T00:00:00.000Z")
- `toDate` (optional): ISO 8601 date string
- `dateColumn` (optional): Column name for filtering (default: `created_at`)

### Test Steps

**1. Export users created today**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "fromDate": "2025-11-22T00:00:00.000Z",
    "toDate": "2025-11-22T23:59:59.999Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "table": "users",
  "format": "json",
  "recordCount": 3,
  "data": [
    // Users created today
  ]
}
```

**2. Export users created before a specific date**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "toDate": "2025-11-21T23:59:59.999Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "recordCount": 0,
  "data": []
}
```

**3. Export users created after a specific date**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "fromDate": "2025-11-22T10:15:00.000Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "recordCount": 2,
  "data": [
    // Users created after 10:15 AM
  ]
}
```

**4. Custom date column filtering**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "fromDate": "2025-11-22T00:00:00.000Z",
    "dateColumn": "updated_at"
  }'
```

**Validation:**
- ✅ `fromDate` filters records >= specified date
- ✅ `toDate` filters records <= specified date
- ✅ Both parameters work together for range filtering
- ✅ Custom `dateColumn` is respected
- ✅ Invalid date formats return error

---

## Test 4: Download Mode (Inline vs File Download)

### Purpose
Control whether data is returned inline (JSON response) or as a downloadable file.

### Parameters
- `download`: boolean (default: `false`)
  - `false` → Inline JSON response
  - `true` → File attachment with download headers

### Test Steps

**1. Inline JSON response (download=false)**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "download": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "table": "users",
  "format": "json",
  "recordCount": 3,
  "data": [...]
}
```

**Headers:**
- `Content-Type: application/json`
- No `Content-Disposition` header

**2. CSV file download (download=true)**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "csv",
    "download": true
  }' \
  -o users.csv
```

**Expected Response:**
- Raw CSV data downloaded to `users.csv`
- File contains:
  ```csv
  id,username,email,role,firstName,lastName,created_at,updated_at
  1,admin_user,admin@example.com,admin,Admin,User,2025-11-22T10:15:08.000Z,2025-11-22T10:15:08.000Z
  2,test_user_1,test1@example.com,user,Test,One,2025-11-22T10:16:00.000Z,2025-11-22T10:16:00.000Z
  ```

**Headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="users.csv"`

**3. Excel file download (download=true)**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "excel",
    "download": true
  }' \
  -o users.xlsx
```

**Expected Response:**
- Binary Excel file downloaded to `users.xlsx`
- Open with Excel/LibreOffice to verify data

**Headers:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="users.xlsx"`

**4. CSV inline response (download=false)**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "csv",
    "download": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "table": "users",
  "format": "csv",
  "recordCount": 3,
  "data": "id,username,email,...\n1,admin_user,admin@example.com,...",
  "contentType": "text/csv",
  "filename": "users.csv"
}
```

**Validation:**
- ✅ `download=false` always returns JSON response (regardless of format)
- ✅ `download=true` with CSV/Excel sends file attachment
- ✅ `download=true` with JSON still returns inline (JSON format exception)
- ✅ Correct `Content-Type` and `Content-Disposition` headers
- ✅ Downloaded files are valid and openable

---

## Test 5: Combined Features

### Purpose
Test multiple features working together.

**1. Date-filtered CSV download**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "csv",
    "download": true,
    "fromDate": "2025-11-22T00:00:00.000Z",
    "toDate": "2025-11-22T23:59:59.999Z",
    "columns": ["id", "username", "email", "created_at"]
  }' \
  -o users_today.csv
```

**Expected:**
- CSV file with only specified columns
- Only users created today
- Downloaded as `users_today.csv`

**2. Date-filtered JSON with custom date column**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "json",
    "fromDate": "2025-11-22T10:00:00.000Z",
    "dateColumn": "updated_at",
    "limit": 10
  }'
```

**Expected:**
- Parsed JSON array
- Max 10 records
- Filtered by `updated_at >= 2025-11-22T10:00:00.000Z`

**3. Excel export with WHERE clause and date filter**
```bash
curl -X POST http://localhost:3000/api/export/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "table": "users",
    "format": "excel",
    "download": true,
    "where": "role = '\''admin'\''",
    "fromDate": "2025-11-22T00:00:00.000Z"
  }' \
  -o admin_users.xlsx
```

**Expected:**
- Excel file with admin users only
- Created today or later
- Downloaded as `admin_users.xlsx`

---

## Testing Checklist

### JSON Parsing
- [ ] JSON format returns parsed array/object
- [ ] CSV format returns string data
- [ ] Excel format returns base64 string
- [ ] Invalid JSON gracefully falls back to string

### Schema Metadata
- [ ] Schema endpoint returns all tables
- [ ] Row counts are accurate
- [ ] Column types match database
- [ ] Nullable flags are correct
- [ ] Non-admin users are denied access

### Date Filtering
- [ ] `fromDate` filters correctly
- [ ] `toDate` filters correctly
- [ ] Range filtering works (both dates)
- [ ] Custom `dateColumn` works
- [ ] Invalid dates return error
- [ ] Missing date fields don't break query

### Download Mode
- [ ] `download=false` returns inline JSON
- [ ] `download=true` + CSV sends file
- [ ] `download=true` + Excel sends file
- [ ] JSON format always inline (even with download=true)
- [ ] Correct Content-Type headers
- [ ] Correct Content-Disposition headers
- [ ] Downloaded files are valid

### Combined Features
- [ ] Date filter + CSV download
- [ ] Date filter + columns selection
- [ ] Date filter + WHERE clause
- [ ] Schema API + export workflow
- [ ] All features work with pagination (limit/offset)

---

## Troubleshooting

### Issue: "Admin role required"
**Solution:** Ensure you're using a JWT token from an admin user. Check token with:
```bash
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d
```
Verify `"role": "admin"` in payload.

### Issue: Date filtering returns no results
**Solution:**
- Check date format is ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Verify `dateColumn` exists in table
- Check database records actually exist in date range

### Issue: Downloaded file is corrupted
**Solution:**
- For CSV: Check encoding (should be UTF-8)
- For Excel: Ensure binary mode (`-o` flag in curl)
- Verify base64 encoding/decoding

### Issue: Schema endpoint timeout
**Solution:**
- Large databases may take time
- Check Export Service logs for errors
- Verify PostgreSQL connection

---

## Next Steps

1. **Performance Testing**
   - Export large tables (>10,000 rows)
   - Measure response times
   - Test with concurrent requests

2. **Additional Features** (Future)
   - PDF export format
   - Custom column ordering
   - Aggregate functions (SUM, AVG, COUNT)
   - Scheduled exports

3. **Documentation**
   - Update Swagger docs with examples
   - Add to main README.md
   - Create video walkthrough

---

## Summary

All four major enhancements are production-ready:
1. ✅ **JSON Parsing** - Returns parsed objects instead of strings
2. ✅ **Schema API** - Complete database metadata extraction
3. ✅ **Date Filtering** - Flexible date range queries
4. ✅ **Download Mode** - Toggle between inline and file download

Test thoroughly before deploying to production!
