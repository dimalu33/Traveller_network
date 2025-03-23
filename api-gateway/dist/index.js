"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Service routes configuration
const routes = {
    '/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
            '^/users': '/users' // keep the same path
        }
    },
    // In the future, you would add routes for other services
    // Example:
    // '/posts': {
    //   target: 'http://localhost:3002',
    //   changeOrigin: true,
    //   pathRewrite: {
    //     '^/posts': '/posts'
    //   }
    // },
};
// Setup proxy routes
Object.entries(routes).forEach(([path, config]) => {
    app.use(path, (0, http_proxy_middleware_1.createProxyMiddleware)(config));
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.send({ status: 'UP' });
});
// Start server
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
