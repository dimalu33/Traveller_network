import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';
// Request з 'express' вже включає властивість body, якщо відповідний middleware (express.json()) був використаний.
// Тому можна спростити імпорти, якщо AuthenticatedRequest правильно розширює express.Request
import { Request as ExpressRequest, Response } from 'express'; // Додамо Response для повноти типів у onProxyReq
import config from '../config';
import { AuthenticatedRequest } from './authMiddleware'; // Переконайтесь, що AuthenticatedRequest розширює ExpressRequest

// Опції для User Service
const userServiceProxyOptions: Options = {
    target: config.userServiceUrl,
    changeOrigin: true,
    pathRewrite: {
        // ваші pathRewrite правила, якщо є
    },
    onProxyReq: (proxyReq, req: ExpressRequest, res: Response) => { // Використовуємо ExpressRequest
        console.log(`[API Gateway] Proxying to User Service: ${req.method} ${proxyReq.path}`);
        // req.body тут буде доступний, якщо express.json() спрацював раніше
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end(); // ВАЖЛИВО: Завершити запит після запису тіла
        } else {
            // Якщо тіло не записувалося, все одно потрібно завершити проксі-запит,
            // щоб він був відправлений (наприклад, для GET-запитів або POST без тіла).
            proxyReq.end();
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
    // pathRewrite: { ... },
    onProxyReq: (proxyReq, req: ExpressRequest, res: Response) => {
        const authenticatedReq = req as AuthenticatedRequest; // Кастуємо до нашого типу

        console.log(`[API Gateway -> PostService] Proxying: ${authenticatedReq.method} ${proxyReq.path}`);

        if (authenticatedReq.user && authenticatedReq.user.id) {
            proxyReq.setHeader('X-User-ID', authenticatedReq.user.id);
            console.log(`[API Gateway -> PostService] Forwarding X-User-ID: ${authenticatedReq.user.id}`);
        }

        // authenticatedReq.body буде доступний, оскільки AuthenticatedRequest має розширювати ExpressRequest,
        // а express.json() middleware вже відпрацював.
        if (authenticatedReq.body && Object.keys(authenticatedReq.body).length > 0) {
            const bodyToSend = { ...authenticatedReq.body };
            // Розкоментуйте, якщо потрібно видалити user_id з тіла,
            // оскільки він тепер передається через заголовок X-User-ID.
            // delete bodyToSend.user_id;

            const bodyData = JSON.stringify(bodyToSend);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end(); // ВАЖЛИВО: Завершити запит після запису тіла
        } else {
            // Якщо тіло не записувалося (наприклад, для GET-запитів або POST без тіла),
            // все одно потрібно завершити проксі-запит.
            proxyReq.end();
        }
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] Post Service Proxy error:', err);
        if (res && !res.headersSent) {
            res.status(500).send('Proxy Error to Post Service');
        }
    }
};


export const userServiceProxy: RequestHandler = createProxyMiddleware(userServiceProxyOptions);
export const postServiceProxy: RequestHandler = createProxyMiddleware(postServiceProxyOptions);