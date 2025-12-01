/**
 * Interactive Database Setup Script
 * Prompts for PostgreSQL password and sets up the database
 */

import { Pool } from 'pg';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupDatabase() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     SERENITY ERP - DATABASE SETUP                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('PostgreSQL 17 detected on your system.');
  console.log('Please enter the password you set during PostgreSQL installation.\n');

  const password = await question('PostgreSQL postgres user password: ');

  console.log('\n🔌 Testing connection...');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ Connection successful!\n');

    // Check if database exists
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'serenity_erp'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating serenity_erp database...');
      await pool.query('CREATE DATABASE serenity_erp');
      console.log('✅ Database created');
    } else {
      console.log('✅ Database serenity_erp already exists');
    }

    await pool.end();

    // Connect to new database and enable extension
    const appPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'serenity_erp'
    });

    console.log('🔧 Enabling uuid-ossp extension...');
    await appPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extension enabled');

    await appPool.end();

    // Update .env file
    const envPath = path.join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@localhost:5432/serenity_erp`;
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${dbUrl}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with DATABASE_URL');

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     DATABASE SETUP COMPLETE!                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('  1. Run migrations: npx tsx src/database/run-migrations.ts');
    console.log('  2. Seed data: npx tsx src/database/seeds/seed-initial-data.ts');
    console.log('  3. Start server: npm run dev:api\n');

  } catch (error) {
    const err = error as Error;
    console.error('\n❌ Connection failed:', err.message);

    if (err.message.includes('password authentication failed')) {
      console.log('\n💡 The password you entered is incorrect.');
      console.log('   Please try again with the correct password.');
    }
  }

  rl.close();
}

setupDatabase();
