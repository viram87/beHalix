import { Router } from 'express';
import { body } from 'express-validator';
import { createEvent, getEvents, getEvent, deleteEvent, saveEvent, unsaveEvent } from '../controllers/event.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - timestamp
 *               - address
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               isWomenOnly:
 *                 type: boolean
 *               address:
 *                 type: string
 *                 description: "JSON stringified address object with fields: line1, line2, city, state, zipCode"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  upload.array('images', 5),
  [
    body('title').notEmpty().isLength({ max: 200 }).withMessage('Title required, max 200 chars'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Desc max 2000 chars'),
    body('timestamp').isISO8601().toDate().withMessage('Invalid timestamp'),
    body('isWomenOnly').isBoolean().withMessage('isWomenOnly must be boolean'),
    // Address validation is tricky with multipart/form-data as it might come as a JSON string
    // Simplified check here, detailed check in controller if needed or custom validator
  ],
  validate,
  createEvent
);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for location-based search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for location-based search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in km
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', optionalAuthenticate, getEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event details
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', optionalAuthenticate, getEvent);

router.post('/:id/save', authenticate, saveEvent);
router.delete('/:id/save', authenticate, unsaveEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden - Not the creator
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, deleteEvent);

export default router;
