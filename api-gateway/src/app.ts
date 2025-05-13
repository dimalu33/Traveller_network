import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { userServiceProxy, postServiceProxy } from './middlewares/proxySetup';
import { authMiddleware } from './middlewares/authMiddleware';

const app = express();

// Middleware
app.use(cors()); // Дозволяє запити з усіх джерел
app.use(express.json()); // Для парсингу JSON тіла запиту перед проксуванням

// Логування вхідних запитів
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[API Gateway] Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/users', userServiceProxy);

app.post('/posts', authMiddleware, postServiceProxy);
app.post('/posts/:postId/like', authMiddleware, postServiceProxy);
app.post('/posts/:postId/comments', authMiddleware, postServiceProxy);

app.get('/posts', postServiceProxy);                // Отримання списку постів
app.get('/posts/:postId/comments', postServiceProxy); // Отримання коментарів до поста
app.get('/posts/:postId/likes', postServiceProxy);    // Отримання лайків для поста

app.get('/health', (req: Request, res: Response) => {
    console.log('[API Gateway] Health check requested');
    res.status(200).json({ status: 'UP', service: 'API Gateway' });
});

// Catch-all для невідомих маршрутів
app.use((req: Request, res: Response) => {
    console.warn(`[API Gateway] Unknown route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found on API Gateway' });
});

// Глобальний обробник помилок для API Gateway (якщо помилка не оброблена проксі)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[API Gateway] Unhandled error:", err.stack);
    if (!res.headersSent) {
        res.status(err.status || 500).json({
            error: {
                message: err.message || "Internal Server Error on API Gateway",
            },
        });
    }
});


export default app;