// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:3000'; // API Gateway
export const IMAGE_SERVICE_BASE_URL = process.env.REACT_APP_IMAGE_SERVICE_BASE_URL || 'http://localhost:3003'; // Для зображень

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Функція для додавання JWT токена до заголовків
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Або з AuthContext
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Типи для постів, коментарів, лайків (потрібно узгодити з бекендом)
export interface Post {
    id: string;
    user_id: string; // Можливо, тут буде об'єкт користувача після POPULATE на бекенді
    text: string | null;
    image_url: string | null; // Це буде відносний шлях, додамо IMAGE_SERVICE_BASE_URL
    created_at: string;
    like_count?: number; // Додамо пізніше
    comment_count?: number; // Додамо пізніше
    comments?: Comment[]; // Для завантажених коментарів
    likes?: LikeInfo;     // Для інформації про лайки
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string; // Аналогічно, може бути об'єкт користувача
    text: string;
    created_at: string;
    user?: { name: string }; // Опціонально, якщо бекенд повертає дані юзера
}

export interface LikeInfo {
    postId: string;
    likeCount: number;
    // Можливо, isLikedByUser: boolean - якщо бекенд повертає
}

export interface User {
    id: string;
    name: string;
    email: string;
}

// --- API функції ---

// Користувачі (якщо потрібна реєстрація/логін з фронтенду)
export const loginUser = async (credentials: { email: string, password: string }): Promise<{ user: User, token: string }> => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
};

// Пости
export const getPosts = async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts');
    return response.data;
};

// Лайки
export const getLikesForPost = async (postId: string): Promise<LikeInfo> => {
    const response = await apiClient.get(`/posts/${postId}/likes`);
    return response.data; // Очікуємо { postId, likeCount }
};

export const toggleLikePost = async (postId: string): Promise<any> => { // Тип відповіді залежить від бекенду
    // Зауваж: X-User-ID встановлюється на API Gateway з токену
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
};

// Коментарі
export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    return response.data;
};

export const addCommentToPost = async (postId: string, text: string): Promise<Comment> => {
    // Зауваж: X-User-ID встановлюється на API Gateway з токену
    const response = await apiClient.post(`/posts/${postId}/comments`, { text });
    return response.data;
};

export default apiClient;