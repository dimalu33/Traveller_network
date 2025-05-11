import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request } from 'express';
import config from '../config';

const userServiceProxyOptions: Options = {
    target: config.userServiceUrl,
    changeOrigin: true,
    pathRewrite: {
        // Якщо потрібно переписати шлях, наприклад, якщо '/api/users' мапиться на '/' в User Service
        // '^/api/users': '/users', // Приклад: якщо API Gateway приймає /api/users, а User Service очікує /users
    },
    onProxyReq: (proxyReq, req: Request, res) => {
        console.log(`[API Gateway] Proxying to User Service: ${req.method} ${proxyReq.path}`);
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json'); // Важливо вказати тип контенту
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end();
        }
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] User Service Proxy error:', err);
        if (!res.headersSent) {
            res.status(500).send('Proxy Error to User Service');
        }
    }
};

export const userServiceProxy = createProxyMiddleware(userServiceProxyOptions);

// Тут можна додати проксі для інших сервісів, наприклад, Post Service
// export const postServiceProxy = createProxyMiddleware({ target: config.postServiceUrl, ... });