import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';
import { Request } from 'express';
import config from '../config';

// Опції для User Service
const userServiceProxyOptions: Options = {
    target: config.userServiceUrl,
    changeOrigin: true,
    pathRewrite: {
        // '^/api/users': '/users', // Приклад, якщо шляхи відрізняються. У нас зараз однакові.
    },
    onProxyReq: (proxyReq, req: Request, res) => {
        console.log(`[API Gateway] Proxying to User Service: ${req.method} ${proxyReq.path}`);
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end();
        }
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] User Service Proxy error:', err);
        if (res && !res.headersSent) { // Додано перевірку res
            res.status(500).send('Proxy Error to User Service');
        }
    }
};

// Опції для Post Service
const postServiceProxyOptions: Options = {
    target: config.postServiceUrl,
    changeOrigin: true,
    pathRewrite: {
        // '^/api/posts': '/posts', // Приклад, якщо шляхи відрізняються.
    },
    onProxyReq: (proxyReq, req: Request, res) => {
        console.log(`[API Gateway] Proxying to Post Service: ${req.method} ${proxyReq.path}`);
        // Якщо потрібно передавати токен аутентифікації, його можна тут додати до заголовків
        // if (req.headers.authorization) {
        //   proxyReq.setHeader('Authorization', req.headers.authorization);
        // }
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end();
        }
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] Post Service Proxy error:', err);
        if (res && !res.headersSent) { // Додано перевірку res
            res.status(500).send('Proxy Error to Post Service');
        }
    }
};

export const userServiceProxy: RequestHandler = createProxyMiddleware(userServiceProxyOptions);
export const postServiceProxy: RequestHandler = createProxyMiddleware(postServiceProxyOptions);