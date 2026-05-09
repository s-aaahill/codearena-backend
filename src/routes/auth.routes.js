// backend/src/routes/auth.routes.js
import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/me', requireAuth, getMe);

export default router;