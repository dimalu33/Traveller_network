import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoutes';
import { initializeDatabasePostService } from './database';
import config from './config';

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Дозволяє запити з інших доменів (важливо для мікросервісів)

// Ініціалізація БД
initializeDatabasePostService().catch(err => {
    console.error("Failed to initialize Post Service database on startup:", err);
    process.exit(1); // Зупиняємо, якщо БД не ініціалізована
});

// Routes
app.use('/posts', postRoutes); // Всі маршрути для постів будуть починатися з /posts

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'Post Service' });
});

// Global error handler (приклад)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Post Service Error] ${err.message}`, err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: statusCode,
        },
    });
});

export default app;