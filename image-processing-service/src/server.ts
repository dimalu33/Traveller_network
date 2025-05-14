import express from 'express';
import config from './config';
import { connectRabbitMQ } from './rabbitmq/client';
import { startConsumingTasks } from './rabbitmq/consumer';
import path from 'path'; // Для сервірування статичних файлів

const app = express();

// Middleware для сервірування оброблених зображень
// Це потрібно, щоб Post Service міг сформувати публічний URL на зображення
app.use('/processed_images', express.static(path.join(__dirname, '..', config.imageStoragePath)));
// Зверніть увагу на __dirname, '..', config.imageStoragePath - шлях відносно папки dist після компіляції

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'Image Processing Service' });
});

async function startServer() {
    try {
        await connectRabbitMQ();
        await startConsumingTasks();
        app.listen(config.port, () => {
            console.log(`[ImageProcessingService] Server running on port ${config.port}`);
            console.log(`[ImageProcessingService] Serving processed images from ${path.join(__dirname, '..', config.imageStoragePath)} at /processed_images`);
        });
    } catch (error) {
        console.error('[ImageProcessingService] Failed to start:', error);
        process.exit(1);
    }
}

startServer();