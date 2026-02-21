import { Router } from 'express';
import { rsvpToEvent, cancelRSVP, getEventRSVPs, getEventAttendeesPreview } from '../controllers/rsvp.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: RSVP
 *   description: Event RSVP management
 */

/**
 * @swagger
 * /events/{id}/rsvp:
 *   post:
 *     summary: RSVP to an event
 *     tags: [RSVP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       201:
 *         description: RSVP successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rsvp:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [confirmed, waitlist]
 *       400:
 *         description: Event full or past
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post('/:id/rsvp', rsvpToEvent);

/**
 * @swagger
 * /events/{id}/rsvp:
 *   delete:
 *     summary: Cancel RSVP
 *     tags: [RSVP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: RSVP cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: RSVP or Event not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/rsvp', cancelRSVP);

router.get('/:id/attendees-preview', getEventAttendeesPreview);

/**
 * @swagger
 * /events/{id}/rsvps:
 *   get:
 *     summary: Get all RSVPs for an event (Creator only)
 *     tags: [RSVP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of RSVPs
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
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       status:
 *                         type: string
 *       403:
 *         description: Forbidden - Not the creator
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/rsvps', getEventRSVPs);

export default router;
