import amqp from 'amqplib';
import config from '../config';
import { ImageProcessingResult } from '../types';

let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<amqp.Channel> {
    if (channel) return channel;
    try {
        const connection = await amqp.connect(config.rabbitmqUrl);
        channel = await connection.createChannel();
        // Переконуємося, що черги існують (створює, якщо немає, durable - зберігати при перезапуску Rabbit)
        await channel.assertQueue(config.imageProcessingQueue, { durable: true });
        await channel.assertQueue(config.imageResultQueue, { durable: true });
        console.log('[ImageProcessingService] Connected to RabbitMQ and queues asserted.');
        return channel;
    } catch (error) {
        console.error('[ImageProcessingService] Failed to connect to RabbitMQ:', error);
        throw error; // Дозволити обробку помилки вище
    }
}

export async function getChannel(): Promise<amqp.Channel> {
    if (!channel) {
        return await connectRabbitMQ();
    }
    return channel;
}

export async function publishToResultQueue(result: ImageProcessingResult) {
    const ch = await getChannel();
    ch.sendToQueue(config.imageResultQueue, Buffer.from(JSON.stringify(result)), {
        persistent: true,
    });
    console.log(`[ImageProcessingService] Sent result to ${config.imageResultQueue}:`, result);
}