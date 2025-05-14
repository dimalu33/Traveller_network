import { ConsumeMessage } from 'amqplib';
import { getChannel } from './client';
import config from '../config';
import { ImageProcessingResult } from '../models/postTypes'; // Додамо цей тип
import { updatePostImageUrl } from '../services/postService';

export async function startConsumingResults() {
    const channel = await getChannel();
    console.log(`[PostService] Waiting for image processing results in ${config.imageResultQueue}.`);

    channel.consume(config.imageResultQueue, async (msg: ConsumeMessage | null) => {
        if (msg !== null) {
            const resultContent = msg.content.toString();
            let result: ImageProcessingResult | null = null;
            try {
                result = JSON.parse(resultContent) as ImageProcessingResult;
                console.log('[PostService] Received image processing result:', result);

                if (result.success && result.processedImageUrl) {
                    // Формуємо повний URL на основі базового URL image-processing-service
                    const fullImageUrl = `${config.imageServiceBaseUrl}${result.processedImageUrl}`;
                    await updatePostImageUrl(result.postId, fullImageUrl);
                    console.log(`[PostService] Post ${result.postId} image_url updated to ${fullImageUrl}`);
                } else {
                    console.error(`[PostService] Image processing failed for post ${result.postId}: ${result.error}`);
                    // Можна встановити image_url в null або спеціальне значення
                    await updatePostImageUrl(result.postId, '');
                }
                channel.ack(msg);
            } catch (error: any) {
                console.error('[PostService] Error processing result message:', error);
                // Якщо помилка при обробці повідомлення, не повертати в чергу, щоб уникнути циклу. Розглянути DLX.
                if (result) {
                    // Можна спробувати якусь логіку відновлення або логування помилки з postId
                }
                channel.ack(msg); // Поки просто підтверджуємо
            }
        }
    }, { noAck: false });
}