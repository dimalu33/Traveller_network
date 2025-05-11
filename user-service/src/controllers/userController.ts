import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export async function handleRegisterUser(req: Request, res: Response, next: NextFunction) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        const user = await userService.registerUser({ name, email, password });
        res.status(201).json(user);
    } catch (error: any) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function handleLoginUser(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { user, token } = await userService.loginUser({ email, password });
        res.json({ ...user, token });
    } catch (error: any) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function handleGetUserById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}