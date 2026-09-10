import { Router } from 'express';
import { getAll, getOne, reply } from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/:id/reply', reply);

export default router;
