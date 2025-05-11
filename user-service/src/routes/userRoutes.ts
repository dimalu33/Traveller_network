import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.post('/register', userController.handleRegisterUser);
router.post('/login', userController.handleLoginUser);
router.get('/:id', userController.handleGetUserById);

export default router;