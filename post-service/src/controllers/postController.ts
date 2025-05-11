import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/postService';
import { NewPostData, NewCommentData, NewLikeData } from '../models/postTypes';

export async function handleCreatePost(req: Request, res: Response, next: NextFunction) {
    // ПОКИ ЩО: user_id беремо з тіла запиту. Пізніше це буде з JWT токена.
    const { user_id, text, image_url } = req.body;

    if (!user_id || (!text && !image_url)) { // user_id обов'язковий, і хоча б текст або зображення
        return res.status(400).json({ error: 'User ID and text or image_url are required' });
    }

    const postData: NewPostData = { user_id, text, image_url };

    try {
        // Тут буде логіка відправки image_url в RabbitMQ, якщо він є
        // Поки що просто створюємо пост
        const post = await postService.createPost(postData);
        // Якщо image_url є, то тут потрібно буде відправити повідомлення в чергу RabbitMQ
        // для Image Processing Service. Наприклад:
        // if (image_url) {
        //   await sendMessageToImageQueue({ postId: post.id, imageUrl: image_url });
        // }
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        next(error); // Передаємо помилку централізованому обробнику
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
    // ПОКИ ЩО: user_id беремо з тіла запиту.
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const likeData: NewLikeData = { post_id: postId, user_id };

    try {
        const result = await postService.addLikeToPost(likeData);
        res.status(result.hasOwnProperty('id') ? 201 : 200).json(result); // 201 для створення, 200 для видалення
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
    // ПОКИ ЩО: user_id беремо з тіла запиту.
    const { user_id, text } = req.body;

    if (!user_id || !text) {
        return res.status(400).json({ error: 'User ID and text are required' });
    }

    const commentData: NewCommentData = { post_id: postId, user_id, text };

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