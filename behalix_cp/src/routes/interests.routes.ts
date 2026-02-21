import { Router, Request, Response } from 'express';

const router = Router();

const MASTER_INTERESTS = [
  'Music', 'Tech', 'Hiking', 'Travel', 'Photography', 'Cooking', 'Reading',
  'Sports', 'Gaming', 'Art', 'Movies', 'Fitness', 'Yoga', 'Writing',
  'Volunteering', 'Networking', 'Startups', 'Design', 'Food', 'Coffee',
];

/**
 * @openapi
 * /interests:
 *   get:
 *     summary: Get master list of interests
 *     tags: [Interests]
 *     responses:
 *       200:
 *         description: List of suggested interests for profiles
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ interests: MASTER_INTERESTS });
});

export default router;
