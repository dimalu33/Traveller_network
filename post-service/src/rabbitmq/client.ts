import amqp from 'amqplib';
import config from '../config';
import { ImageProcessingTask } from '../models/postTypes'; // Додамо цей тип пізніше

let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<amqp.Channel> {
    if (channel) return channel;
    try {
        const connection = await amqp.connect(config.rabbitmqUrl);
        channel = await connection.createChannel();
        await channel.assertQueue(config.imageProcessingQueue, { durable: true });
        await channel.assertQueue(config.imageResultQueue, { durable: true });
        console.log('[PostService] Connected to RabbitMQ and queues asserted.');
        return channel;
    } catch (error) {
        console.error('[PostService] Failed to connect to RabbitMQ:', error);
        throw error;
    }
}

export async function getChannel(): Promise<amqp.Channel> {
    if (!channel) {
        return await connectRabbitMQ();
    }
    return channel;
}

export async function publishImageTask(task: ImageProcessingTask) {
    const ch = await getChannel();
    ch.sendToQueue(config.imageProcessingQueue, Buffer.from(JSON.stringify(task)), {
        persistent: true,
    });
    console.log(`[PostService] Sent image task to ${config.imageProcessingQueue}:`, task);
}