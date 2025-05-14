import { Router } from 'express';
import * as postController from '../controllers/postController';
import multer from 'multer';
import config from '../config'; // Потрібен для шляху завантаження
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // для унікальних імен файлів

const router = Router();

// Налаштування Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.temporaryUploadsPath); // Використовуємо шлях з конфігу
    },
    filename: function (req, file, cb) {
        // Генеруємо унікальне ім'я файлу, щоб уникнути колізій, зберігаючи розширення
        const uniqueSuffix = Date.now() + '-' + uuidv4();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB ліміт
    fileFilter: fileFilter
});

// 'imageFile' - це ім'я поля в multipart/form-data, яке містить файл
router.post('/', upload.single('imageFile'), postController.handleCreatePost); // Створення нового поста з зображенням

// Інші маршрути
router.get('/', postController.handleGetPosts);     // Отримання списку постів
router.post('/:postId/like', postController.handleAddLike);         // Лайк поста
router.post('/:postId/comments', postController.handleAddComment); // Додавання коментаря до поста

router.get('/:postId/comments', postController.handleGetCommentsForPost);
router.get('/:postId/likes', postController.handleGetLikesForPost);

export default router;
