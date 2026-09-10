import { Router } from 'express';
import { getStatus, logout } from '../controllers/whatsapp.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/status', getStatus);
router.post('/logout', logout);

export default router;
