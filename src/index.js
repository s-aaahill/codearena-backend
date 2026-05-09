//backend/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';

const app = express();

app.use(express.json());         
app.use(cookieParser());          
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'https://codearena-frontend-jet.vercel.app'
    ],
    credentials: true               
}));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({status: 'OK', message: 'CodeArena API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
