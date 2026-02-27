import { Router } from 'express';
import { syncUser, verifyToken } from '../controllers/authController';

const router = Router();

// Sync user from Google OAuth
router.post('/sync', syncUser);

// Verify JWT token
router.get('/verify', verifyToken);

export default router;
