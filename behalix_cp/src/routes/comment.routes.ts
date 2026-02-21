import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getEventComments,
  createComment,
  updateComment,
  deleteComment,
  reactToComment,
} from '../controllers/comment.controller';

const router = Router();

router.use(authenticate);

router.get('/:id/comments', getEventComments);
router.post('/:id/comments', createComment);
router.patch('/:id/comments/:commentId', updateComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.post('/:id/comments/:commentId/react', reactToComment);

export default router;
