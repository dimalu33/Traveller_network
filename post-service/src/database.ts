// Файл: src/database.ts (або еквівалент)
import { Pool } from 'pg';
import config from './config'; // Припускаю, що config.db містить ваші налаштування

export const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: String(config.db.password), // Важливо, якщо пароль може бути числом
    port: config.db.port,

    // === ДОДАЙТЕ ЦІ ТАЙМАУТИ ===
    // Максимальний час очікування на встановлення з'єднання з БД (в мілісекундах)
    connectionTimeoutMillis: 5000, // 5 секунд

    // Максимальний час виконання одного запиту на сервері БД (PostgreSQL сам його перерве)
    statement_timeout: 15000, // 15 секунд (або інше розумне значення)

    // Максимальний час очікування клієнтом відповіді на запит (включає час на мережу та виконання)
    query_timeout: 15000, // 15 секунд

    // Максимальний час простою клієнта в пулі перед тим, як він буде закритий
    idleTimeoutMillis: 30000, // 30 секунд

    // Максимальна кількість клієнтів у пулі (стандартно 10, можна налаштувати)
    // max: 20, // Якщо у вас багато одночасних запитів
});

// Опціонально, але корисно: слухачі подій пулу
pool.on('connect', (client) => {
    console.log(`[DB Pool] Client connected. Total clients: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
    // Можна спробувати встановити statement_timeout для кожного клієнта,
    // хоча statement_timeout в конфігурації пулу має працювати глобально.
    // client.query(`SET statement_timeout = ${15000};`);
});

pool.on('acquire', (client) => {
    // console.log(`[DB Pool] Client acquired. Total clients: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
});

pool.on('error', (err, client) => {
    console.error('[DB Pool] Unexpected error on idle client', err);
    // process.exit(-1); // Розгляньте, чи потрібно зупиняти додаток
});

pool.on('remove', (client) => {
    // console.log(`[DB Pool] Client removed. Total clients: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
});


// Ваша функція ініціалізації бази даних
export async function initializeDatabasePostService() {
    let client; // Оголошуємо client поза try для доступу в finally
    try {
        console.log('[DB_INIT] Attempting to connect to DB for initialization...');
        client = await pool.connect();
        console.log('[DB_INIT] Connected to DB. Initializing tables...');

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
        console.log('[DB_INIT] Table "posts" checked/created.');

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
        console.log('[DB_INIT] Table "comments" checked/created.');

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
        console.log('[DB_INIT] Table "likes" checked/created.');

        console.log('[DB_INIT] Database tables for Post Service initialized successfully.');
    } catch (error) {
        console.error('[DB_INIT] FATAL: Error initializing database tables for Post Service:', error);
        process.exit(1); // Зупиняємо сервіс, якщо БД не може бути ініціалізована
    } finally {
        if (client) { // Перевіряємо, чи client був успішно отриманий
            client.release(); // Завжди звільняйте клієнта!
            console.log('[DB_INIT] DB client released after initialization.');
        }
    }
}