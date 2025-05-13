// Файл: post-service/src/models/postTypes.ts

export interface Post {
    id: string;
    user_id: string;
    text: string | null;
    image_url: string | null;
    created_at: Date;
}

export interface NewPostData {
    user_id: string; // Поки що передаємо явно, пізніше буде з токена
    text?: string;
    image_url?: string; // Початково може бути порожнім, оновлюється після обробки
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    text: string;
    created_at: Date;
}

export interface NewCommentData {
    post_id: string; // Буде з параметра URL
    user_id: string; // Поки що передаємо явно, пізніше буде з токена
    text: string;
}

export interface Like {
    id: string;
    post_id: string;
    user_id: string;
    created_at: Date;
}

export interface NewLikeData {
    post_id: string; // Буде з параметра URL
    user_id: string; // Поки що передаємо явно, пізніше буде з токена
}