import express from 'express';
import cors from 'cors';
import config from './config';
import { connectRabbitMQ } from './rabbitmq/client';
import { startConsumingTasks } from './rabbitmq/consumer';
import path from 'path';
import fs from 'fs';

const app = express();

// CORS конфігурація
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Перевірка та створення папки для зображень
const ensureImageStorageExists = () => {
    if (!fs.existsSync(config.imageStoragePath)) {
        console.log(`[ImageProcessingService] Creating image storage directory: ${config.imageStoragePath}`);
        fs.mkdirSync(config.imageStoragePath, { recursive: true });
    }
    console.log(`[ImageProcessingService] Image storage path: ${config.imageStoragePath}`);
    console.log(`[ImageProcessingService] Image storage exists: ${fs.existsSync(config.imageStoragePath)}`);
};

ensureImageStorageExists();

// Middleware для логування запитів до зображень
app.use('/processed_images', (req, res, next) => {
    const requestedFile = path.join(config.imageStoragePath, req.path);
    console.log(`[ImageProcessingService] Image request:`, {
        requestPath: req.path,
        fullPath: requestedFile,
        exists: fs.existsSync(requestedFile),
        timestamp: new Date().toISOString()
    });
    next();
});

// Налаштування статичних файлів
app.use('/processed_images', express.static(config.imageStoragePath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        console.log(`[ImageProcessingService] Serving file: ${filePath}`);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Ендпоінт для діагностики
app.get('/api/debug/images', (req, res) => {
    try {
        const files = fs.readdirSync(config.imageStoragePath);
        const fileDetails = files.map(file => {
            const filePath = path.join(config.imageStoragePath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                modified: stats.mtime,
                url: `/processed_images/${file}`
            };
        });

        res.json({
            imageStoragePath: config.imageStoragePath,
            imageCount: files.length,
            files: fileDetails,
            currentWorkingDirectory: process.cwd(),
            __dirname,
            timestamp: new Date().toISOString()
        });
    } catch (err: unknown) { // Змінено тут
        let errorMessage = 'An unknown error occurred while fetching debug images.';
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        console.error('[ImageProcessingService] Error in /api/debug/images:', err); // Логуємо повну помилку на сервері
        res.status(500).json({
            error: errorMessage,
            imageStoragePath: config.imageStoragePath,
            exists: fs.existsSync(config.imageStoragePath)
        });
    }
});

// Ендпоінт для перевірки конкретного зображення
app.get('/api/check-image/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(config.imageStoragePath, filename);

    try {
        if (fs.existsSync(imagePath)) {
            const stats = fs.statSync(imagePath);
            res.json({
                exists: true,
                size: stats.size,
                modified: stats.mtime,
                path: `/processed_images/${filename}`,
                fullPath: imagePath
            });
        } else {
            res.status(404).json({
                exists: false,
                searchPath: imagePath,
                storageDirectory: config.imageStoragePath,
                availableFiles: fs.readdirSync(config.imageStoragePath) // Може кинути помилку, якщо storageDirectory не існує
            });
        }
    } catch (err: unknown) { // Змінено тут
        let errorMessage = 'An unknown error occurred while checking the image.';
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        console.error(`[ImageProcessingService] Error in /api/check-image/${filename}:`, err);
        res.status(500).json({
            error: errorMessage,
            searchPath: imagePath
        });
    }
});

app.get('/health', (req, res) => {
    try {
        const storageExists = fs.existsSync(config.imageStoragePath);
        const files = storageExists ? fs.readdirSync(config.imageStoragePath) : [];

        res.status(200).json({
            status: 'UP',
            service: 'Image Processing Service',
            imageStoragePath: config.imageStoragePath,
            storageExists,
            imageCount: files.length,
            port: config.port,
            currentWorkingDirectory: process.cwd(),
            __dirname,
            timestamp: new Date().toISOString()
        });
    } catch (err: unknown) { // Змінено тут
        let errorMessage = 'An unknown error occurred during health check.';
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        console.error('[ImageProcessingService] Error in /health:', err);
        res.status(500).json({
            status: 'ERROR',
            service: 'Image Processing Service',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});

async function startServer() {
    try {
        await connectRabbitMQ();
        await startConsumingTasks();
        app.listen(config.port, () => {
            console.log(`[ImageProcessingService] Server running on port ${config.port}`);
            console.log(`[ImageProcessingService] Serving processed images from ${config.imageStoragePath}`);
            console.log(`[ImageProcessingService] Image storage exists: ${fs.existsSync(config.imageStoragePath)}`);
            console.log(`[ImageProcessingService] Current working directory: ${process.cwd()}`);
            console.log(`[ImageProcessingService] __dirname: ${__dirname}`);
        });
    } catch (err: unknown) { // Змінено тут
        if (err instanceof Error) {
            console.error('[ImageProcessingService] Failed to start. Error:', err.message, err.stack);
        } else {
            console.error('[ImageProcessingService] Failed to start with an unknown error:', err);
        }
        process.exit(1);
    }
}

startServer();