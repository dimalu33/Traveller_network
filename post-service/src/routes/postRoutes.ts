import { Router } from 'express';
import * as postController from '../controllers/postController';
// Тут можна додати middleware для аутентифікації, коли він буде

const router = Router();

router.post('/', postController.handleCreatePost); // Створення нового поста
router.get('/', postController.handleGetPosts);     // Отримання списку постів

router.post('/:postId/like', postController.handleAddLike);         // Лайк поста
router.post('/:postId/comments', postController.handleAddComment); // Додавання коментаря до поста

router.get('/:postId/comments', postController.handleGetCommentsForPost);
router.get('/:postId/likes', postController.handleGetLikesForPost);


export default router;