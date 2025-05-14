import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.POST_SERVICE_PORT || 3002,
    db: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),
    },
    jwtSecret: process.env.JWT_SECRET_KEY || 'default_secret_key',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    imageProcessingQueue: 'image_processing_queue', // Та сама назва, що і в image-processor
    imageResultQueue: 'image_result_queue',         // Та сама назва
    temporaryUploadsPath: process.env.TEMPORARY_UPLOADS_PATH || './uploads_temp',
    imageServiceBaseUrl: process.env.IMAGE_SERVICE_BASE_URL || 'http://localhost:3003',
};