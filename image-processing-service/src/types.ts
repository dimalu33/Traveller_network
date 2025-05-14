// Повідомлення, яке надходить від Post Service
export interface ImageProcessingTask {
    postId: string;
    originalImagePath: string; // Шлях до тимчасового файлу на Post Service
    originalFileName: string;  // Для визначення розширення
}

// Повідомлення, яке відправляється назад до Post Service
export interface ImageProcessingResult {
    postId: string;
    processedImageUrl?: string; // Відносний шлях до обробленого зображення
    success: boolean;
    error?: string;
}