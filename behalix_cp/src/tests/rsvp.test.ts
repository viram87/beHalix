import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import supertest from 'supertest';
import User from '../models/User';
import UserDetails from '../models/UserDetails';
import Event from '../models/Event';
import RSVP from '../models/RSVP';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    jest.restoreAllMocks();
    await User.deleteMany({});
    await UserDetails.deleteMany({});
    await Event.deleteMany({});
    await RSVP.deleteMany({});
});

const generateTestToken = async (gender: 'male' | 'female' | 'other') => {
    const user = new User({
        email: `test_${gender}_${Date.now()}_${Math.random()}@example.com`,
        passwordHash: 'hashedpassword',
        isVerified: true
    });
    await user.save();

    const userDetails = new UserDetails({
        userId: user._id,
        gender: gender,
        interests: ['coding']
    });
    await userDetails.save();

    return { 
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }),
        userId: user._id
    };
};

describe('RSVP Endpoints', () => {
    let eventId: string;
    let womenOnlyEventId: string;

    beforeEach(async () => {
        const creator = await generateTestToken('female');
        
        // Create general event
        const eventRes = await supertest(app)
            .post('/events')
            .set('Authorization', `Bearer ${creator.token}`)
            .field('title', 'General Event')
            .field('timestamp', new Date(Date.now() + 86400000).toISOString())
            .field('isWomenOnly', 'false')
            .field('address', JSON.stringify({ line1: '123 St', city: 'City', state: 'ST', zipCode: '00000' }));
        eventId = eventRes.body._id;

        // Create women only event
        const woRes = await supertest(app)
            .post('/events')
            .set('Authorization', `Bearer ${creator.token}`)
            .field('title', 'Women Only')
            .field('timestamp', new Date(Date.now() + 86400000).toISOString())
            .field('isWomenOnly', 'true')
            .field('address', JSON.stringify({ line1: '123 St', city: 'City', state: 'ST', zipCode: '00000' }));
        womenOnlyEventId = woRes.body._id;
    });

    describe('POST /events/:id/rsvp', () => {
        it('should allow user to RSVP to an event', async () => {
            const { token } = await generateTestToken('male');
            
            const res = await supertest(app)
                .post(`/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'attending' });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('RSVP successful');
            expect(res.body.rsvp).toBeDefined();
        });

        it('should prevent male users from RSVPing to women-only events', async () => {
            const { token } = await generateTestToken('male');
            
            const res = await supertest(app)
                .post(`/events/${womenOnlyEventId}/rsvp`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'attending' });

            expect(res.status).toBe(404); // Should be not found as they can't see it
        });

        it('should allow female users to RSVP to women-only events', async () => {
            const { token } = await generateTestToken('female');
            
            const res = await supertest(app)
                .post(`/events/${womenOnlyEventId}/rsvp`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'attending' });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('RSVP successful');
        });

        it('should not allow double RSVP', async () => {
            const { token } = await generateTestToken('female');
            
            await supertest(app)
                .post(`/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'attending' });

            const res = await supertest(app)
                .post(`/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'attending' });

            expect(res.status).toBe(409);
            expect(res.body.code).toBe('ALREADY_RSVPED');
        });
    });

    describe('GET /events/:id/attendees', () => {
        it('should list attendees for an event', async () => {
            const { token } = await generateTestToken('female');
            
            // Add an attendee
            const attendee = await generateTestToken('male');
            await supertest(app)
                .post(`/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${attendee.token}`)
                .send({ status: 'attending' });

            const res = await supertest(app)
                .get(`/events/${eventId}/rsvps`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.rsvps).toHaveLength(1);
            expect(res.body.rsvps[0].email).toBeDefined();
        });
    });
});
