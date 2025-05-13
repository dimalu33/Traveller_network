// api-gateway/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'; // Імпортуємо типи помилок
import config from '../config'; // Ваш файл конфігурації


interface TokenPayload {
    id: string;
    email?: string;
    role?: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[AuthMiddleware] No Bearer token provided');
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Перевіряємо, що config.jwtSecret визначений
        if (!config.jwtSecret) {
            console.error('[AuthMiddleware] JWT_SECRET is not defined in config!');
            return res.status(500).json({ error: 'Internal Server Error: JWT secret not configured.' });
        }

        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
        req.user = decoded; // Зберігаємо весь декодований пейлоад в req.user
        console.log(`[AuthMiddleware] User ${decoded.id} authenticated.`);
        next(); // Користувач аутентифікований, передаємо управління далі
    } catch (error) {
        // Обробка помилок від jwt.verify
        if (error instanceof TokenExpiredError) {
            console.warn('[AuthMiddleware] Token expired:', error.message);
            return res.status(401).json({ error: 'Unauthorized: Token expired' });
        }
        if (error instanceof JsonWebTokenError) { // Включає NotBeforeError, JsonWebTokenError
            console.warn('[AuthMiddleware] Invalid token:', error.message);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        // Для інших непередбачених помилок
        console.error('[AuthMiddleware] Unexpected error during token verification:', error);
        return res.status(500).json({ error: 'Internal Server Error during token verification' });
    }
};