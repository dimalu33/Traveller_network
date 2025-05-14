import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/postService';
import { NewPostData, NewCommentData, NewLikeData, ImageProcessingTask } from '../models/postTypes';
import { publishImageTask } from '../rabbitmq/client'; // Додано
import fs from 'fs'; // Для видалення файлу в разі помилки
import path from 'path';

export async function handleCreatePost(req: Request, res: Response, next: NextFunction) {
    const userIdFromHeader = req.headers['x-user-id'] as string;
    if (!userIdFromHeader) {
        // Якщо файл був завантажений, видалити його, бо запит не авторизований
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => { if(err) console.error("Error deleting temp file for unauthorized request:", err);});
        }
        return res.status(401).json({ error: 'Unauthorized: User ID not provided' });
    }

    const { text } = req.body;
    const imageFile = req.file; // Файл від multer

    if (!text && !imageFile) {
        return res.status(400).json({ error: 'Text or imageFile is required' });
    }

    const postData: NewPostData = {
        user_id: userIdFromHeader,
        text: text || null,
        image_url: '', // Початково null, оновиться після обробки
    };

    let createdPostId: string | null = null;

    try {
        const post = await postService.createPost(postData);
        createdPostId = post.id;

        if (imageFile) {
            const absoluteImagePath = path.resolve(imageFile.path); // Отримати абсолютний шлях
            const task: ImageProcessingTask = {
                postId: post.id,
                originalImagePath: absoluteImagePath, // Передаємо абсолютний шлях
                originalFileName: imageFile.originalname,
            };
            await publishImageTask(task);
            console.log(`[PostService] Image task for post ${post.id} sent to queue. Path: ${absoluteImagePath}`);
        }
        res.status(201).json(post);
    } catch (error) {
        console.error('[PostService] Error in handleCreatePost:', error);
        // Якщо пост був створений, але відправка в чергу не вдалася,
        // або якщо файл був, але сталася інша помилка.
        // В ідеалі, потрібна транзакційність або механізм компенсації.
        // Поки що, якщо файл є, спробуємо його видалити.
        if (imageFile && imageFile.path) {
            fs.unlink(imageFile.path, (unlinkErr) => {
                if (unlinkErr) console.error("[PostService] Error deleting temp file after controller error:", unlinkErr);
            });
        }
        // Можливо, варто видалити пост, якщо він був створений, а обробка зображення не почалася.
        // if (createdPostId) { /* ... логіка видалення поста ... */ }
        next(error);
    }
}

export async function handleGetPosts(req: Request, res: Response, next: NextFunction) {
    try {
        const posts = await postService.getAllPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error getting posts:', error);
        next(error);
    }
}

export async function handleAddLike(req: Request, res: Response, next: NextFunction) {
    const { postId } = req.params;
    const userIdFromHeader = req.headers['x-user-id'] as string;

    if (!userIdFromHeader) {
        console.warn('[PostService] X-User-ID header is missing in handleAddLike!');
        return res.status(401).json({ error: 'Unauthorized: User ID not provided in headers' });
    }

    const likeData: NewLikeData = { post_id: postId, user_id: userIdFromHeader };

    try {
        const result = await postService.addLikeToPost(likeData);
        res.status(result.hasOwnProperty('id') ? 201 : 200).json(result);
    } catch (error: any) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Error adding/removing like:', error);
        next(error);
    }
}

export async function handleAddComment(req: Request, res: Response, next: NextFunction) {
    const { postId } = req.params;
    const userIdFromHeader = req.headers['x-user-id'] as string;
    const { text } = req.body;

    if (!userIdFromHeader) {
        console.warn('[PostService] X-User-ID header is missing in handleAddComment!');
        return res.status(401).json({ error: 'Unauthorized: User ID not provided in headers' });
    }

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const commentData: NewCommentData = { post_id: postId, user_id: userIdFromHeader, text };

    try {
        const comment = await postService.addCommentToPost(commentData);
        res.status(201).json(comment);
    } catch (error: any) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Error adding comment:', error);
        next(error);
    }
}

export async function handleGetCommentsForPost(req: Request, res: Response, next: NextFunction) {
    const { postId } = req.params;

    try {
        const comments = await postService.getCommentsForPost(postId);
        res.json(comments);
    } catch (error) {
        console.error('Error getting comments for post:', error);
        next(error);
    }
}

export async function handleGetLikesForPost(req: Request, res: Response, next: NextFunction) {
    const { postId } = req.params;

    try {
        const likeCount = await postService.getLikesForPost(postId);
        res.json({ postId, likeCount });
    } catch (error) {
        console.error('Error getting likes for post:', error);
        next(error);
    }
}
