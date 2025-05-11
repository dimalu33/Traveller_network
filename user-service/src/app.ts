import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import { initializeDatabase } from './database';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Database
initializeDatabase().catch(err => {
    console.error("Failed to initialize database on startup:", err);
    process.exit(1);
});

// Routes
app.use('/users', userRoutes);

// Global error handler (приклад)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});


export default app;