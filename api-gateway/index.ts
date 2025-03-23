import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[API Gateway] ${req.method} ${req.url}`);
    next();
});

// Перенаправлення всіх запитів на /users до User Service
app.use('/users', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Якщо тіло запиту вже було прочитано і проаналізовано
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            // Оновлюємо content-length
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // Записуємо тіло в запит
            proxyReq.write(bodyData);
            proxyReq.end();
        }
        console.log(`[API Gateway] Proxying to User Service: ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] Proxy error:', err);
        res.status(500).send('Proxy Error');
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('[API Gateway] Health check requested');
    res.send({ status: 'UP' });
});

// Start server
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});