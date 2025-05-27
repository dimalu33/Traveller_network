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
    console.log(`[SVC_getPostById] Attempting to fetch post. PostID: ${postId}`);
    try {
        const result = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
        if (result.rows.length > 0) {
            console.log(`[SVC_getPostById] Post found. PostID: ${postId}`);
            return result.rows[0];
        }
        console.log(`[SVC_getPostById] Post NOT found. PostID: ${postId}`);
        return null;
    } catch (error: any) {
        console.error(`[SVC_getPostById] ERROR fetching post. PostID: ${postId}. Message: ${error.message}. Stack: ${error.stack}`);
        // Перекидаємо помилку, щоб її обробив викликаючий код
        throw error;
    }
}

export async function addCommentToPost(data: NewCommentData): Promise<Comment> {
    const { post_id, user_id, text } = data;
    const commentId = uuidv4();
    console.log(`[SVC_addCommentToPost] START. UserID: ${user_id}, PostID: ${post_id}, Generated CommentID: ${commentId}, Text: "${text ? text.substring(0, 50) + '...' : 'N/A'}"`);

    try {
        // 1. Перевірка існування поста
        console.log(`[SVC_addCommentToPost] Step 1: Checking existence of post ${post_id}...`);
        const postExists = await getPostById(post_id); // Виклик функції з логуванням
        if (!postExists) {
            console.warn(`[SVC_addCommentToPost] Post ${post_id} not found. Aborting comment creation.`);
            const error = new Error('Post not found');
            (error as any).statusCode = 404;
            throw error;
        }
        console.log(`[SVC_addCommentToPost] Step 1: Post ${post_id} confirmed to exist.`);

        // 2. Вставка коментаря
        const query = 'INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *';
        const values = [commentId, post_id, user_id, text];
        console.log(`[SVC_addCommentToPost] Step 2: Executing INSERT query for comment ${commentId}. Query: ${query}, Values: ${JSON.stringify(values)}`);

        const result = await pool.query(query, values);
        console.log(`[SVC_addCommentToPost] Step 2: INSERT query for comment ${commentId} executed. Rows returned: ${result.rows.length}`);

        if (result.rows.length === 0) {
            // Це дуже малоймовірно з RETURNING *, але для повноти
            console.error(`[SVC_addCommentToPost] CRITICAL: No rows returned after INSERT RETURNING * for comment ${commentId}. This should not happen.`);
            throw new Error('Failed to create comment, no data returned from DB. This indicates a serious DB issue.');
        }

        const newComment = result.rows[0];
        console.log(`[SVC_addCommentToPost] END. Comment ${commentId} created successfully. Data: ${JSON.stringify(newComment)}`);
        return newComment;

    } catch (error: any) {
        console.error(`[SVC_addCommentToPost] OVERALL ERROR during comment creation. PostID: ${post_id}, UserID: ${user_id}, CommentID: ${commentId}.`);
        console.error(`[SVC_addCommentToPost] Error Message: ${error.message}`);
        // Не потрібно дублювати стек, якщо він вже залогований в getPostById або буде залогований глобальним обробником
        // console.error(`[SVC_addCommentToPost] Error Stack: ${error.stack}`);

        // Переконаємося, що помилка має statusCode для контролера
        if (!(error as any).statusCode) {
            (error as any).statusCode = 500; // Загальна помилка сервера
        }
        throw error; // Перекидаємо помилку для обробки в контролері
    }
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

export async function getCommentsForPost(postId: string): Promise<Comment[]> {
    const result = await pool.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC', [postId]);
    return result.rows;
}

export async function getLikesForPost(postId: string): Promise<number> {
    const result = await pool.query(
        'SELECT COUNT(*) FROM likes WHERE post_id = $1',
        [postId]
    );

    return parseInt(result.rows[0].count, 10);
}

// Додамо функцію для оновлення image_url після обробки зображення
export async function updatePostImageUrl(postId: string, imageUrl: string): Promise<Post | null> {
    const result = await pool.query(
        'UPDATE posts SET image_url = $1 WHERE id = $2 RETURNING *',
        [imageUrl, postId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}