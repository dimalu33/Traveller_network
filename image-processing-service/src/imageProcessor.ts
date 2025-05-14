import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import config from './config';

async function ensureStoragePathExists() {
    try {
        await fs.access(config.imageStoragePath);
    } catch {
        console.log(`[ImageProcessingService] Storage path ${config.imageStoragePath} does not exist. Creating...`);
        await fs.mkdir(config.imageStoragePath, { recursive: true });
    }
}

export async function resizeAndSaveImage(originalTempPath: string, originalFileName: string): Promise<string> {
    await ensureStoragePathExists();

    const fileExt = path.extname(originalFileName);
    const newFileName = `${uuidv4()}${fileExt}`;
    const outputPath = path.join(config.imageStoragePath, newFileName);

    try {
        // Перевірка чи файл існує (на Post Service, звідки ми його "віртуально" беремо)
        // У реальному сценарії, файл би передавався, або цей сервіс мав би доступ до сховища
        // Зараз ми симулюємо, що originalTempPath - це шлях до файлу, доступного цьому сервісу.
        // Оскільки сервіси окремі, Post Service має зробити файл доступним (напр. через спільний volume або тимчасовий HTTP доступ)
        // Для простоти, Post Service збереже його локально, а Image Processing Service його "прочитає" з цього ж шляху.
        // ВАЖЛИВО: В реальному проекті з окремими контейнерами/машинами так не спрацює без спільного сховища.
        // Припустимо, що Post Service зберігає файл в папку, яку Image Processor може читати.
        // Або, краще, Post Service відправляє сам файл (бінарні дані) в повідомленні, якщо він невеликий,
        // або завантажує в S3 і передає ключ.
        // Для нашого завдання, PostService передасть шлях до файлу, збереженого ним тимчасово.
        // І цей ImageProcessingService видалить цей тимчасовий файл після обробки.

        await fs.access(originalTempPath); // Перевірка, чи Post Service дійсно зберіг файл там

        const metadata = await sharp(originalTempPath).metadata();

        if (metadata.width && metadata.width > 1200) {
            await sharp(originalTempPath)
                .resize({ width: 1200 })
                .toFile(outputPath);
        } else {
            await fs.copyFile(originalTempPath, outputPath); // Якщо ресайз не потрібен, просто копіюємо
        }

        console.log(`[ImageProcessingService] Image processed and saved to ${outputPath}`);

        // Видалити тимчасовий файл, який створив Post Service
        await fs.unlink(originalTempPath);
        console.log(`[ImageProcessingService] Original temporary image ${originalTempPath} deleted.`);

        // Повертаємо відносний шлях, який буде сервуватися Image Processing Service
        // або іншим файловим сервером
        return `/processed_images/${newFileName}`;
    } catch (error) {
        console.error(`[ImageProcessingService] Error processing image ${originalTempPath}:`, error);
        // Спробувати видалити оригінал, якщо він ще існує
        try {
            await fs.access(originalTempPath);
            await fs.unlink(originalTempPath);
        } catch (cleanupError) {
            // ігнорувати помилку очищення
        }
        throw error;
    }
}