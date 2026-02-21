import { Router } from 'express';
import { body } from 'express-validator';
import { getMe, updateProfile } from '../controllers/user.controller';
import { getUserRSVPs } from '../controllers/rsvp.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 details:
 *                   $ref: '#/components/schemas/UserDetails'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', getMe);

/**
 * @swagger
 * /users/me/rsvps:
 *   get:
 *     summary: Get current user's RSVPs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's RSVPs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rsvps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       event:
 *                         $ref: '#/components/schemas/Event'
 *                       status:
 *                         type: string
 *                         enum: [confirmed, cancelled]
 *       401:
 *         description: Unauthorized
 */
router.get('/me/rsvps', getUserRSVPs);

/**
 * @swagger
 * /users/me/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 details:
 *                   $ref: '#/components/schemas/UserDetails'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/me/profile',
  [
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('interests').optional().isArray({ max: 10 }).withMessage('Max 10 interests allowed'),
    body('interests.*').isString().isLength({ max: 50 }).withMessage('Interest max 50 chars'),
  ],
  validate,
  updateProfile
);

export default router;
