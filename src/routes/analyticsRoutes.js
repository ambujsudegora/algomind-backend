import express from 'express';
import { getAnalyticsDashboard, useStreakFreeze } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getAnalyticsDashboard);
router.post('/use-freeze', useStreakFreeze);

export default router;
