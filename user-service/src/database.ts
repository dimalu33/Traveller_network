import { Pool } from 'pg';
import config from './config';

export const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: config.db.password,
    port: config.db.port,
});

export async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Database initialized successfully (User Service)');
    } catch (error) {
        console.error('Error initializing database (User Service):', error);
        // Важливо обробити помилку, можливо, завершити роботу, якщо БД критична
        process.exit(1);
    } finally {
        client.release();
    }
}
