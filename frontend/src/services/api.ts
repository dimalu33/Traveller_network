// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8000';
export const IMAGE_SERVICE_BASE_URL = process.env.REACT_APP_IMAGE_SERVICE_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

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

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

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
    image_url: string | null; // Може бути null, особливо для нових постів
    created_at: string;
    like_count?: number;
    comment_count?: number;
    comments?: Comment[];
    likes?: LikeInfo;
    author?: User;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    text: string;
    created_at: string;
    user?: User;
}

export interface LikeInfo {
    postId: string;
    likeCount: number;
    isLikedByUser?: boolean;
}

const userCache = new Map<string, User>();

export const loginUser = async (credentials: { email: string, password: string }): Promise<{ user: User, token: string }> => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
};

export const getUserById = async (userId: string): Promise<User> => {
    if (userCache.has(userId)) {
        return userCache.get(userId)!;
    }
    const response = await apiClient.get(`/users/${userId}`);
    const user = response.data;
    userCache.set(userId, user);
    return user;
};

export const getPosts = async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts');
    const posts: Post[] = response.data || []; // Переконуємось, що posts це масив
    const postsWithAuthors = await Promise.all(
        posts.map(async (post: Post) => {
            try {
                const author = await getUserById(post.user_id);
                return { ...post, author };
            } catch (error) {
                console.error(`Failed to fetch author for post ${post.id}:`, error);
                return post;
            }
        })
    );
    // Сортування постів від новіших до старіших
    return postsWithAuthors.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const createPost = async (formData: FormData): Promise<Post> => {
    const response = await apiClient.post('/posts/', formData, { // Ваш ендпоінт з Postman
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    const newPost: Post = response.data;
    // Спробуємо отримати автора для нового поста, використовуючи user_id з відповіді
    // user_id в newPost буде user_id поточного користувача (з токена на бекенді)
    try {
        const author = await getUserById(newPost.user_id);
        return { ...newPost, author };
    } catch (error) {
        console.error(`Failed to fetch author for new post ${newPost.id}:`, error);
        return newPost; // Повертаємо пост, навіть якщо автора не вдалося отримати
    }
};

export const getLikesForPost = async (postId: string): Promise<LikeInfo> => {
    const response = await apiClient.get(`/posts/${postId}/likes`);
    return response.data;
};

export const toggleLikePost = async (postId: string): Promise<any> => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
};

export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    const comments: Comment[] = response.data || [];
    const commentsWithAuthors = await Promise.all(
        comments.map(async (comment: Comment) => {
            try {
                const user = await getUserById(comment.user_id);
                return { ...comment, user };
            } catch (error) {
                console.error(`Failed to fetch user for comment ${comment.id}:`, error);
                return comment;
            }
        })
    );
    return commentsWithAuthors;
};

export const addCommentToPost = async (postId: string, text: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${postId}/comments`, { text });
    const comment: Comment = response.data;
    try {
        const user = await getUserById(comment.user_id); // user_id з відповіді
        return { ...comment, user };
    } catch (error) {
        console.error(`Failed to fetch user for new comment:`, error);
        return comment;
    }
};

export default apiClient;