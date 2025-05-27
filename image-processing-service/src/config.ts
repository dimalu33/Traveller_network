import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Визначаємо абсолютний шлях до папки processed_images
// відносно папки з кодом (src), а не поточної робочої директорії
const getImageStoragePath = () => {
    if (process.env.IMAGE_STORAGE_PATH) {
        // Якщо шлях абсолютний, використовуємо його
        if (path.isAbsolute(process.env.IMAGE_STORAGE_PATH)) {
            return process.env.IMAGE_STORAGE_PATH;
        }
        // Якщо відносний, розв'язуємо відносно кореня проекту
        return path.resolve(process.cwd(), process.env.IMAGE_STORAGE_PATH);
    }

    // За замовчуванням: папка processed_images в корені проекту image-processing-service
    return path.resolve(__dirname, '..', '..', 'processed_images');
};

export default {
    port: process.env.PORT || 3003,
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    imageProcessingQueue: 'image_processing_queue',
    imageResultQueue: 'image_result_queue',
    imageStoragePath: getImageStoragePath(),
};