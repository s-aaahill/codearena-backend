// backend/src/routes/submission.routes.js

import express from 'express';
import { getMySubmissions, submitCode } from '../controllers/submission.controller.js';
import { requireAuth } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/', requireAuth, submitCode);
router.get('/me', requireAuth, getMySubmissions);

export default router;