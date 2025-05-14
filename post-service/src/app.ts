import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoutes';
import { initializeDatabasePostService } from './database';
import config from './config';
import { connectRabbitMQ } from './rabbitmq/client';         // <--- Додано
import { startConsumingResults } from './rabbitmq/resultConsumer'; // <--- Додано
import fs from 'fs';                                        // <--- Додано

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Створити папку для тимчасових завантажень, якщо її немає
if (!fs.existsSync(config.temporaryUploadsPath)){
    fs.mkdirSync(config.temporaryUploadsPath, { recursive: true });
    console.log(`[PostService] Created temporary uploads directory: ${config.temporaryUploadsPath}`);
}

// Ініціалізація БД та RabbitMQ
async function initializeApp() {
    try {
        await initializeDatabasePostService();
        await connectRabbitMQ();
        await startConsumingResults(); // Запустити слухача результатів
        console.log("[PostService] Database and RabbitMQ initialized successfully.");
    } catch (err) {
        console.error("Failed to initialize Post Service dependencies on startup:", err);
        process.exit(1);
    }
}
initializeApp();

app.use('/posts', postRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'Post Service' });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[PostService Error] ${err.message}`, err.stack);

    // Якщо є завантажений файл і сталася помилка, видалити його
    if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error("[PostService] Error deleting temp file on error:", unlinkErr);
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: statusCode,
        },
    });
});

export default app;
