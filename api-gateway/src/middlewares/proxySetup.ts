// api-gateway/src/middlewares/proxySetup.ts
import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';
import { Request as ExpressRequest, Response } from 'express'; // Додамо Response для повноти типів у onProxyReq
import config from '../config';
import { AuthenticatedRequest } from './authMiddleware';

const userServiceProxyOptions: Options = {
    target: config.userServiceUrl,
    changeOrigin: true,
    onProxyReq: (proxyReq, req: ExpressRequest, res: Response) => {
        console.log(`[API Gateway] Proxying to User Service: ${req.method} ${proxyReq.path}`);
        if (req.body && Object.keys(req.body).length > 0 && req.headers['content-type']?.includes('application/json')) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] User Service Proxy error:', err);
        if (res && !res.headersSent) {
            res.status(500).send('Proxy Error to User Service');
        }
    }
};

// Опції для Post Service
const postServiceProxyOptions: Options = {
    target: config.postServiceUrl,
    changeOrigin: true,
    onProxyReq: (proxyReq, req: ExpressRequest, res: Response) => { // Використовуємо ExpressRequest для req
        const authenticatedReq = req as AuthenticatedRequest; // Якщо потрібен req.user
        console.log(`[API Gateway -> PostService] Proxying: ${authenticatedReq.method} ${proxyReq.path} (Original Content-Type: ${req.headers['content-type']})`);

        // Встановлення X-User-ID
        if (authenticatedReq.user && authenticatedReq.user.id) {
            proxyReq.setHeader('X-User-ID', authenticatedReq.user.id);
            console.log(`[API Gateway -> PostService] Forwarding X-User-ID: ${authenticatedReq.user.id}`);
        }

        // Явна передача тіла запиту, якщо воно є і Content-Type - JSON
        // Це важливо для POST/PUT/PATCH запитів з тілом
        if (req.body && Object.keys(req.body).length > 0 && req.headers['content-type']?.includes('application/json')) {
            const bodyData = JSON.stringify(req.body);
            // HPM зазвичай сам встановлює Content-Type з оригінального запиту,
            // але для надійності можна встановити його явно.
            // Якщо оригінальний Content-Type був application/json, то proxyReq його вже матиме.
            // proxyReq.setHeader('Content-Type', 'application/json'); // Розкоментуйте, якщо є сумніви
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            console.log(`[API Gateway -> PostService] Writing body to proxy request: ${bodyData.substring(0,100)}...`);
            proxyReq.write(bodyData);
            // proxyReq.end(); // НЕ викликайте end() тут, якщо HPM має обробляти стрімінг або інші випадки.
            // HPM сам викличе end(), коли оригінальний запит завершиться.
            // Однак, якщо ви повністю переписуєте тіло, end() може бути потрібен.
            // Для початку спробуйте без end().
        } else if (req.body && Object.keys(req.body).length > 0) {
            // Логування для випадків, коли тіло є, але Content-Type не JSON (наприклад, form-data)
            // HPM має обробляти це автоматично, але для діагностики корисно знати.
            console.log(`[API Gateway -> PostService] Request has body, but Content-Type is not JSON: ${req.headers['content-type']}. Letting HPM handle body piping.`);
        }
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] Post Service Proxy error:', err);
        if (res && !res.headersSent) {
            // Перевірте, чи res є 'instanceof ServerResponse' перед викликом status/send
            // для уникнення помилок, якщо res - це, наприклад, WebSocket відповідь.
            // В контексті HTTP проксі це зазвичай безпечно.
            res.status(500).send('Proxy Error to Post Service');
        }
    }
};


export const userServiceProxy: RequestHandler = createProxyMiddleware(userServiceProxyOptions);
export const postServiceProxy: RequestHandler = createProxyMiddleware(postServiceProxyOptions);