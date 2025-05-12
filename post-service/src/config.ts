import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.POST_SERVICE_PORT || 3002,
    db: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),
    },
    jwtSecret: process.env.JWT_SECRET_KEY || 'default_secret_key',
};