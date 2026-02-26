import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import supertest from 'supertest';
import User from '../models/User';
import UserDetails from '../models/UserDetails';
import Event from '../models/Event';
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

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
};

describe('Event Endpoints', () => {

    describe('POST /events', () => {
        it('should create an event successfully', async () => {
            const token = await generateTestToken('female');
            
            const res = await supertest(app)
                .post('/events')
                .set('Authorization', `Bearer ${token}`)
                .field('title', 'Yoga Workshop')
                .field('description', 'A relaxing yoga session')
                .field('timestamp', new Date(Date.now() + 86400000).toISOString())
                .field('isWomenOnly', 'true')
                .field('address', JSON.stringify({ 
                    line1: '123 Main St', 
                    city: 'Tech City', 
                    state: 'CA', 
                    zipCode: '90210' 
                }));
            
            expect(res.status).toBe(201);
            expect(res.body.title).toBe('Yoga Workshop');
            expect(res.body.isWomenOnly).toBe(true);
        });

        it('should fail if timestamp is in the past', async () => {
            const token = await generateTestToken('male');
            
             const res = await supertest(app)
                .post('/events')
                .set('Authorization', `Bearer ${token}`)
                .field('title', 'Past Event')
                .field('description', 'This happened yesterday')
                .field('timestamp', new Date(Date.now() - 86400000).toISOString())
                .field('isWomenOnly', 'false')
                .field('address', JSON.stringify({ 
                    line1: '123 Main St', 
                    city: 'Tech City', 
                    state: 'CA', 
                    zipCode: '90210' 
                }));

             expect(res.status).toBe(400);
             expect(res.body.code).toBe('EVENT_PAST');
        });
    });

    describe('GET /events (Gender Filtering)', () => {
        beforeEach(async () => {
            // Create a male user and a female user (tokens generated in tests)
            const creatorToken = await generateTestToken('female');
            
            // Create 3 events: 
            // 1. General Event
            // 2. Women Only Event
            // 3. General Event 2

            await supertest(app).post('/events').set('Authorization', `Bearer ${creatorToken}`)
                .field('title', 'General Meetup').field('timestamp', new Date(Date.now() + 86400000).toISOString()).field('isWomenOnly', 'false')
                .field('address', JSON.stringify({ line1: '123 St', city: 'City', state: 'ST', zipCode: '00000' }));
            
            await supertest(app).post('/events').set('Authorization', `Bearer ${creatorToken}`)
                .field('title', 'Women Tech Talk').field('timestamp', new Date(Date.now() + 86400000).toISOString()).field('isWomenOnly', 'true')
                .field('address', JSON.stringify({ line1: '123 St', city: 'City', state: 'ST', zipCode: '00000' }));
                
            await supertest(app).post('/events').set('Authorization', `Bearer ${creatorToken}`)
                .field('title', 'Open Coding').field('timestamp', new Date(Date.now() + 86400000).toISOString()).field('isWomenOnly', 'false')
                .field('address', JSON.stringify({ line1: '123 St', city: 'City', state: 'ST', zipCode: '00000' }));
        });

        it('should allow females to see all events', async () => {
             // We need a NEW token for the reader, ensuring we don't reuse the creator's if that matters, 
             // but here we just need a female user.
             // Note: generateTestToken creates a NEW user every time.
             const token = await generateTestToken('female');

             const res = await supertest(app)
                .get('/events')
                .set('Authorization', `Bearer ${token}`);

             expect(res.status).toBe(200);
             expect(res.body.events).toHaveLength(3);
        });

        it('should hide women-only events from males', async () => {
             const token = await generateTestToken('male');

             const res = await supertest(app)
                .get('/events')
                .set('Authorization', `Bearer ${token}`);

             expect(res.status).toBe(200);
             // Should only see the 2 general events
             expect(res.body.events).toHaveLength(2);
             const titles = res.body.events.map((e: any) => e.title);
             expect(titles).not.toContain('Women Tech Talk');
        });
    });

    describe('PATCH /events/:id', () => {
        it('should allow creator to update event fields', async () => {
            const token = await generateTestToken('female');
            const createRes = await supertest(app)
                .post('/events')
                .set('Authorization', `Bearer ${token}`)
                .field('title', 'Original Title')
                .field('description', 'Original description')
                .field('timestamp', new Date(Date.now() + 86400000).toISOString())
                .field('isWomenOnly', 'false')
                .field('address', JSON.stringify({
                    line1: '123 Main St',
                    city: 'Tech City',
                    state: 'CA',
                    zipCode: '90210'
                }));

            const eventId = createRes.body._id;
            const patchRes = await supertest(app)
                .patch(`/events/${eventId}`)
                .set('Authorization', `Bearer ${token}`)
                .field('title', 'Updated Title')
                .field('description', 'Updated description')
                .field('assemblyTime', '6:45 PM')
                .field('tags', JSON.stringify(['tech', 'networking']));

            expect(patchRes.status).toBe(200);
            expect(patchRes.body.event.title).toBe('Updated Title');
            expect(patchRes.body.event.description).toBe('Updated description');
            expect(patchRes.body.event.assemblyTime).toBe('6:45 PM');
            expect(patchRes.body.event.tags).toEqual(['tech', 'networking']);
        });

        it('should reject updates from non-creator', async () => {
            const creatorToken = await generateTestToken('female');
            const otherToken = await generateTestToken('female');

            const createRes = await supertest(app)
                .post('/events')
                .set('Authorization', `Bearer ${creatorToken}`)
                .field('title', 'Creator Event')
                .field('timestamp', new Date(Date.now() + 86400000).toISOString())
                .field('isWomenOnly', 'false')
                .field('address', JSON.stringify({
                    line1: '123 Main St',
                    city: 'Tech City',
                    state: 'CA',
                    zipCode: '90210'
                }));

            const patchRes = await supertest(app)
                .patch(`/events/${createRes.body._id}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .field('title', 'Should Not Update');

            expect(patchRes.status).toBe(403);
            expect(patchRes.body.code).toBe('FORBIDDEN');
        });

        it('should support adding and removing images in a single update', async () => {
            const token = await generateTestToken('female');
            const createRes = await supertest(app)
                .post('/events')
                .set('Authorization', `Bearer ${token}`)
                .field('title', 'Image Event')
                .field('timestamp', new Date(Date.now() + 86400000).toISOString())
                .field('isWomenOnly', 'false')
                .field('address', JSON.stringify({
                    line1: '123 Main St',
                    city: 'Tech City',
                    state: 'CA',
                    zipCode: '90210'
                }))
                .attach('images', Buffer.from('fake-image-1'), 'one.jpg');

            expect(createRes.status).toBe(201);
            expect(createRes.body.images).toHaveLength(1);

            const existingPublicId = createRes.body.images[0].publicId;
            const patchRes = await supertest(app)
                .patch(`/events/${createRes.body._id}`)
                .set('Authorization', `Bearer ${token}`)
                .field('removeImagePublicIds', JSON.stringify([existingPublicId]))
                .attach('images', Buffer.from('fake-image-2'), 'two.jpg');

            expect(patchRes.status).toBe(200);
            expect(patchRes.body.event.images).toHaveLength(1);
        });
    });
});
