import { pool } from '../database';
import { v4 as uuidv4 } from 'uuid';
import { Post, NewPostData, Comment, NewCommentData, Like, NewLikeData } from '../models/postTypes';

export async function createPost(data: NewPostData): Promise<Post> {
    const { user_id, text, image_url } = data;
    const postId = uuidv4();

    const result = await pool.query(
        'INSERT INTO posts (id, user_id, text, image_url, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [postId, user_id, text || null, image_url || null]
    );
    return result.rows[0];
}

export async function getAllPosts(): Promise<Post[]> {
    // Для прикладу, можна додати сортування, пагінацію, деталі користувача тощо
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    return result.rows;
}

// Додатково: отримання одного поста за ID
export async function getPostById(postId: string): Promise<Post | null> {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    return result.rows.length > 0 ? result.rows[0] : null;
}


export async function addCommentToPost(data: NewCommentData): Promise<Comment> {
    const { post_id, user_id, text } = data;
    const commentId = uuidv4();

    // Перевірка існування поста (опціонально, але добре для цілісності)
    const postExists = await getPostById(post_id);
    if (!postExists) {
        const error = new Error('Post not found');
        (error as any).statusCode = 404;
        throw error;
    }

    const result = await pool.query(
        'INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [commentId, post_id, user_id, text]
    );
    return result.rows[0];
}

export async function addLikeToPost(data: NewLikeData): Promise<Like | { message: string }> {
    const { post_id, user_id } = data;

    // Перевірка існування поста (опціонально)
    const postExists = await getPostById(post_id);
    if (!postExists) {
        const error = new Error('Post not found');
        (error as any).statusCode = 404;
        throw error;
    }

    // Перевірка, чи користувач вже лайкав цей пост
    const existingLike = await pool.query(
        'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
        [post_id, user_id]
    );

    if (existingLike.rows.length > 0) {
        // Якщо лайк існує, можна його видалити (тогл лайка) або повернути повідомлення
        await pool.query('DELETE FROM likes WHERE id = $1', [existingLike.rows[0].id]);
        return { message: 'Like removed' };
    } else {
        const likeId = uuidv4();
        const result = await pool.query(
            'INSERT INTO likes (id, post_id, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [likeId, post_id, user_id]
        );
        return result.rows[0];
    }
}

// Додатково: отримання коментарів для поста
export async function getCommentsForPost(postId: string): Promise<Comment[]> {
    const result = await pool.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC', [postId]);
    return result.rows;
}

// Додатково: отримання лайків (або їх кількості) для поста
export async function getLikesForPost(postId: string): Promise<Like[]> {
    const result = await pool.query('SELECT * FROM likes WHERE post_id = $1', [postId]);
    return result.rows;
}

// Додамо функцію для оновлення image_url після обробки зображення
export async function updatePostImageUrl(postId: string, imageUrl: string): Promise<Post | null> {
    const result = await pool.query(
        'UPDATE posts SET image_url = $1 WHERE id = $2 RETURNING *',
        [imageUrl, postId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}