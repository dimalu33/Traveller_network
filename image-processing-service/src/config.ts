import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3003,
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    imageProcessingQueue: 'image_processing_queue', // Черга для завдань
    imageResultQueue: 'image_result_queue',       // Черга для результатів
    imageStoragePath: process.env.IMAGE_STORAGE_PATH || './processed_images',
};