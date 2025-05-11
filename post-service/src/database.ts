import { Pool } from 'pg';
import config from './config';

export const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: String(config.db.password),
    port: config.db.port,
});

export async function initializeDatabasePostService() {
    const client = await pool.connect();
    try {
        // Таблиця posts
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                text TEXT,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблиця comments
        await client.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id UUID PRIMARY KEY,
                post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблиця likes
        await client.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY,
                post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (post_id, user_id) -- Забороняє дублювання лайків
            )
        `);

        console.log('Database tables for Post Service initialized successfully');
    } catch (error) {
        console.error('Error initializing database tables for Post Service:', error);
        process.exit(1); // Зупиняємо сервіс, якщо БД не може бути ініціалізована
    } finally {
        client.release();
    }
}