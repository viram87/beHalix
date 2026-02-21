import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCommunity,
  getCommunities,
  getDiscoverCommunities,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  deleteCommunity,
} from '../controllers/community.controller';

const router = Router();

router.use(authenticate);

router.post('/', createCommunity);
router.get('/', getCommunities);
router.get('/discover', getDiscoverCommunities);
router.get('/:id', getCommunity);
router.patch('/:id', updateCommunity);
router.delete('/:id', deleteCommunity);
router.post('/:id/join', joinCommunity);
router.delete('/:id/leave', leaveCommunity);

export default router;
