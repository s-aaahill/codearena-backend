// backend/src/routes/problem.routes.js
import express from 'express';
import { getAllProblems, getProblemById } from '../controllers/problem.controller.js';
import { requireAuth } from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/', getAllProblems);

router.get('/:id', requireAuth, getProblemById);

export default router;