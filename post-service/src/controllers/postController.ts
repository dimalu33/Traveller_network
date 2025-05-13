import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/postService';
import { NewPostData, NewCommentData, NewLikeData } from '../models/postTypes';
import {getLikesForPost} from "../services/postService";

export async function handleCreatePost(req: Request, res: Response, next: NextFunction) {
    // Отримуємо user_id з заголовка, який додав API Gateway
    const userIdFromHeader = req.headers['x-user-id'] as string; // Приводимо до рядка, бо заголовки можуть бути string | string[]

    if (!userIdFromHeader) {
        console.warn('[PostService] X-User-ID header is missing!');
        return res.status(401).json({ error: 'Unauthorized: User ID not provided in headers' });
    }

    const { text, image_url } = req.body;

    if ((!text && !image_url)) { // user_id тепер не перевіряємо тут, бо він з заголовка
        return res.status(400).json({ error: 'Text or image_url are required' });
    }

    const postData: NewPostData = { user_id: userIdFromHeader, text, image_url };

    try {
        const post = await postService.createPost(postData);
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
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
    // Отримуємо user_id з заголовка
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

    if (!text) { // user_id тепер не перевіряємо тут
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

// Контролер для оновлення URL зображення після обробки (для Image Processing Service)
// Це не публічний ендпоінт, а внутрішній або викликається після отримання повідомлення з черги
export async function handleUpdatePostImageUrl(postId: string, imageUrl: string) {
    try {
        const updatedPost = await postService.updatePostImageUrl(postId, imageUrl);
        if (updatedPost) {
            console.log(`Image URL updated for post ${postId}: ${imageUrl}`);
        } else {
            console.warn(`Post ${postId} not found for image URL update.`);
        }
    } catch (error) {
        console.error(`Error updating image URL for post ${postId}:`, error);
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
