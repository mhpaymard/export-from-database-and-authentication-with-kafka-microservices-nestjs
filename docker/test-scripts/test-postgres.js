#!/usr/bin/env node

/**
 * PostgreSQL Connection Test Script
 * Tests connection to PostgreSQL and verifies database structure
 */

const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  database: 'microservices_db',
  user: 'postgres',
  password: 'postgres123',
};

async function testPostgreSQL() {
  const client = new Client(config);
  
  console.log('🔍 Testing PostgreSQL Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}\n`);

  try {
    // Connect to database
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!\n');

    // Test database version
    console.log('📊 Database Information:');
    const versionResult = await client.query('SELECT version()');
    console.log(`  Version: ${versionResult.rows[0].version}\n`);

    // List all tables
    console.log('📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`  Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`    - ${row.table_name}`);
    });
    console.log('');

    // Count records in each table
    console.log('📈 Record counts:');
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  ${tableName}: ${countResult.rows[0].count} records`);
    }
    console.log('');

    // Test sample query on users table
    console.log('🔍 Sample query (users table):');
    const usersResult = await client.query('SELECT id, username, email, role FROM users LIMIT 3');
    console.log(`  Retrieved ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`    - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    console.log('');

    // Test sample query on products table
    console.log('🔍 Sample query (products table):');
    const productsResult = await client.query('SELECT id, name, price, category FROM products LIMIT 3');
    console.log(`  Retrieved ${productsResult.rows.length} products:`);
    productsResult.rows.forEach(product => {
      console.log(`    - ID: ${product.id}, Name: ${product.name}, Price: $${product.price}, Category: ${product.category}`);
    });
    console.log('');

    console.log('✅ All PostgreSQL tests passed successfully!\n');

  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Make sure Docker containers are running: docker-compose ps');
      console.log('   2. Check PostgreSQL logs: docker logs microservices-postgres');
      console.log('   3. Verify port 5432 is not in use by another service\n');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.\n');
  }
}

// Run the test
testPostgreSQL();
