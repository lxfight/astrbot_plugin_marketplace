// backend/scripts/create-db.js
const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const dbName = process.env.DATABASE_NAME;

// Connect to the default 'postgres' database to run the CREATE DATABASE command
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: 'postgres', // It's important to connect to a default DB like 'postgres'
});

async function createDatabase() {
  await client.connect();
  try {
    // Check if the database already exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount > 0) {
      console.log(`Database "${dbName}" already exists. Skipping creation.`);
    } else {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

createDatabase();