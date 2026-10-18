import { Router } from 'express';
import { register, login, getMe, registerSchema, loginSchema } from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
