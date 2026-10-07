import { Router } from 'express';
import { register, login, getProfile } from './auth.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, getProfile);

export default router;