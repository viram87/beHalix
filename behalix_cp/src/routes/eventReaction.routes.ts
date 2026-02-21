import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getEventReactions, setEventReaction } from '../controllers/eventReaction.controller';

const router = Router();

router.use(authenticate);

router.get('/:id/reactions', getEventReactions);
router.post('/:id/reactions', setEventReaction);

export default router;
