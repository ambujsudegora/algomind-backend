import express from 'express';
import { getAIDailyInsightQuote } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/daily-insight', getAIDailyInsightQuote);

export default router;
