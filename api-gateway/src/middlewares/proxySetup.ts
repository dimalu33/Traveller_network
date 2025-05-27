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
    onProxyReq: (proxyReq, req: ExpressRequest, res: Response) => {
        const authenticatedReq = req as AuthenticatedRequest;
        console.log(`[API Gateway -> PostService] Proxying: ${authenticatedReq.method} ${proxyReq.path} (Content-Type: ${req.headers['content-type']})`);

        if (authenticatedReq.user && authenticatedReq.user.id) {
            proxyReq.setHeader('X-User-ID', authenticatedReq.user.id);
            console.log(`[API Gateway -> PostService] Forwarding X-User-ID: ${authenticatedReq.user.id}`);
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