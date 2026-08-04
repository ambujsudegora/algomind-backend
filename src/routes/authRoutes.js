import express from 'express';
import { register, login, getMe, getUserSettings, updateUserSettings } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);
router.get('/settings', protect, getUserSettings);
router.put('/settings', protect, updateUserSettings);

export default router;
