import { pool } from '../database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, NewUser } from '../models/user';

export async function registerUser(userData: NewUser): Promise<User> {
    const { name, email, password } = userData;

    const emailExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
        const error = new Error('User with this email already exists');
        (error as any).statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await pool.query(
        'INSERT INTO users (id, name, email, password, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email, created_at',
        [userId, name, email, hashedPassword]
    );
    return result.rows[0];
}

export async function loginUser(credentials: Pick<NewUser, 'email' | 'password'>): Promise<{ user: User, token: string }> {
    const { email, password } = credentials;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        const error = new Error('Invalid email or password');
        (error as any).statusCode = 401;
        throw error;
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        const error = new Error('Invalid email or password');
        (error as any).statusCode = 401;
        throw error;
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '24h' }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
}

export async function getUserById(id: string): Promise<User | null> {
    const result = await pool.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [id]
    );
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}