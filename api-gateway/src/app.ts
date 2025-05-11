import express from 'express';
import cors from 'cors';
import { userServiceProxy } from './middlewares/proxySetup'; // postServiceProxy

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Для парсингу JSON тіла запиту перед проксуванням, якщо потрібно

app.use((req, res, next) => {
    console.log(`[API Gateway] Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

// Routes & Proxying
// Усі запити, що починаються з /users, будуть перенаправлені до User Service
app.use('/users', userServiceProxy);

// Приклад для Post Service, коли він буде:
// app.use('/posts', postServiceProxy);

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('[API Gateway] Health check requested');
    res.status(200).json({ status: 'UP', service: 'API Gateway' });
});

// Catch-all для невідомих маршрутів (опціонально)
app.use((req, res) => {
    console.warn(`[API Gateway] Unknown route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found' });
});

export default app;