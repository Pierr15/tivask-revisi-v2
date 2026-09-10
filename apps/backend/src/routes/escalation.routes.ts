import { Router } from 'express';
import { resolve } from '../controllers/escalation.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/:id/resolve', resolve);

export default router;
