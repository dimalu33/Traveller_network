// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8000';
export const IMAGE_SERVICE_BASE_URL = process.env.REACT_APP_IMAGE_SERVICE_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Функція для додавання JWT токена до заголовків
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Обробка помилок відповіді
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Токен недійсний, очищуємо localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.reload(); // Перезавантажуємо сторінку для повернення до логіну
        }
        return Promise.reject(error);
    }
);

// Типи
export interface User {
    id: string;
    name: string;
    email: string;
    created_at: string;
}

export interface Post {
    id: string;
    user_id: string;
    text: string | null;
    image_url: string | null;
    created_at: string;
    like_count?: number;
    comment_count?: number;
    comments?: Comment[];
    likes?: LikeInfo;
    author?: User; // Додаємо інформацію про автора
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    text: string;
    created_at: string;
    user?: User; // Додаємо інформацію про автора коментаря
}

export interface LikeInfo {
    postId: string;
    likeCount: number;
    isLikedByUser?: boolean;
}

// Кеш для користувачів, щоб не робити зайві запити
const userCache = new Map<string, User>();

// --- API функції ---

// Користувачі
export const loginUser = async (credentials: { email: string, password: string }): Promise<{ user: User, token: string }> => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
};

export const getUserById = async (userId: string): Promise<User> => {
    // Перевіряємо кеш
    if (userCache.has(userId)) {
        return userCache.get(userId)!;
    }

    const response = await apiClient.get(`/users/${userId}`);
    const user = response.data;

    // Зберігаємо в кеш
    userCache.set(userId, user);

    return user;
};

// Пости
export const getPosts = async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts');
    const posts = response.data;

    // Збагачуємо пости інформацією про авторів
    const postsWithAuthors = await Promise.all(
        posts.map(async (post: Post) => {
            try {
                const author = await getUserById(post.user_id);
                return { ...post, author };
            } catch (error) {
                console.error(`Failed to fetch author for post ${post.id}:`, error);
                return post; // Повертаємо пост без автора у випадку помилки
            }
        })
    );

    return postsWithAuthors;
};

// Лайки
export const getLikesForPost = async (postId: string): Promise<LikeInfo> => {
    const response = await apiClient.get(`/posts/${postId}/likes`);
    return response.data;
};

export const toggleLikePost = async (postId: string): Promise<any> => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
};

// Коментарі
export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    const comments = response.data;

    // Збагачуємо коментарі інформацією про авторів
    const commentsWithAuthors = await Promise.all(
        comments.map(async (comment: Comment) => {
            try {
                const user = await getUserById(comment.user_id);
                return { ...comment, user };
            } catch (error) {
                console.error(`Failed to fetch user for comment ${comment.id}:`, error);
                return comment; // Повертаємо коментар без автора у випадку помилки
            }
        })
    );

    return commentsWithAuthors;
};

export const addCommentToPost = async (postId: string, text: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { text });
    const comment = response.data;

    // Додаємо інформацію про поточного користувача до коментаря
    try {
        const user = await getUserById(comment.user_id);
        return { ...comment, user };
    } catch (error) {
        console.error(`Failed to fetch user for new comment:`, error);
        return comment;
    }
};

export default apiClient;