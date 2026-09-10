import { Router } from 'express';
import { getAll, create, update } from '../controllers/menu.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);

export default router;
