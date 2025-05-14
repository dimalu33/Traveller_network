import { ConsumeMessage } from 'amqplib';
import { getChannel, publishToResultQueue } from './client';
import config from '../config';
import { ImageProcessingTask, ImageProcessingResult } from '../types';
import { resizeAndSaveImage } from '../imageProcessor';

export async function startConsumingTasks() {
    const channel = await getChannel();
    console.log(`[ImageProcessingService] Waiting for tasks in ${config.imageProcessingQueue}.`);

    channel.consume(config.imageProcessingQueue, async (msg: ConsumeMessage | null) => {
        if (msg !== null) {
            const taskContent = msg.content.toString();
            let task: ImageProcessingTask | null = null;
            try {
                task = JSON.parse(taskContent) as ImageProcessingTask;
                console.log('[ImageProcessingService] Received task:', task);

                const processedImageUrl = await resizeAndSaveImage(task.originalImagePath, task.originalFileName);

                const result: ImageProcessingResult = {
                    postId: task.postId,
                    processedImageUrl: processedImageUrl,
                    success: true,
                };
                await publishToResultQueue(result);
                channel.ack(msg);
            } catch (error: any) {
                console.error('[ImageProcessingService] Error processing task or image:', error);
                const result: ImageProcessingResult = {
                    postId: task ? task.postId : 'unknown_post_id_due_to_parse_error',
                    success: false,
                    error: error.message || 'Unknown processing error',
                };
                if (task) { // Якщо завдання було розпарсено, відправляємо результат з помилкою
                    await publishToResultQueue(result);
                }
                // Якщо помилка була до парсингу, або задача критична, можна nack з requeue=false
                // або відправити в Dead Letter Queue
                channel.ack(msg); // Поки що просто ack, щоб не зациклюватись на битому повідомленні
            }
        }
    }, { noAck: false }); // Ручне підтвердження
}