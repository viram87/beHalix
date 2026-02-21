import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import supertest from 'supertest';
import User from '../models/User';
import PendingSignup from '../models/PendingSignup';
import OTP from '../models/OTP';

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
    await PendingSignup.deleteMany({});
    await OTP.deleteMany({});
});

describe('Auth Endpoints', () => {
    
    describe('POST /api/auth/signup', () => {
        it('should create a pending signup and send OTP', async () => {
            const res = await supertest(app)
                .post('/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'Password123',
                    gender: 'male'
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toMatch(/Verification OTP sent/);

            const pending = await PendingSignup.findOne({ email: 'test@example.com' });
            expect(pending).toBeTruthy();
            
            const otp = await OTP.findOne({ email: 'test@example.com' });
            expect(otp).toBeTruthy();
        });

        // The controller implements upsert for pending signups, so a second request 
        // with the same email updates the pending signup and resends OTP, 
        // rather than failing with 400.
        it('should update pending signup and resend OTP if tried again', async () => {
             await supertest(app)
                .post('/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'Password123',
                    gender: 'male'
                });

             const res = await supertest(app)
                .post('/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'Password123',
                    gender: 'male'
                });
            
             expect(res.status).toBe(201);
        });
    });

    describe('POST /api/auth/verify-email', () => {
        it('should create user when OTP is correct', async () => {
            // 1. Signup to create pending record + OTP
            await supertest(app)
                .post('/auth/signup')
                .send({
                    email: 'verify@example.com',
                    password: 'SecurePass123',
                    gender: 'female'
                });

            // 2. Fetch the OTP from DB directly
            const otpRecord = await OTP.findOne({ email: 'verify@example.com' });
            expect(otpRecord).toBeTruthy();

            // 3. Verify
            const res = await supertest(app)
                .post('/auth/verify-email')
                .send({
                    email: 'verify@example.com',
                    code: otpRecord!.code
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/Email verified successfully/);
            
            const user = await User.findOne({ email: 'verify@example.com' });
            expect(user).toBeTruthy();
        });

        it('should fail with invalid OTP', async () => {
            await supertest(app)
                .post('/auth/signup')
                .send({
                    email: 'wrongotp@example.com',
                    password: 'Password123',
                    gender: 'male'
                });

            const res = await supertest(app)
                .post('/auth/verify-email')
                .send({
                    email: 'wrongotp@example.com',
                    code: '000000'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/Invalid or expired OTP/);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
             await supertest(app)
                .post('/auth/signup')
                .send({
                    email: 'login@example.com',
                    password: 'Password123',
                    gender: 'male'
                });
             
             const otp = await OTP.findOne({ email: 'login@example.com' });
             await supertest(app)
                .post('/auth/verify-email')
                .send({ email: 'login@example.com', code: otp!.code });
        });

        it('should login with correct credentials', async () => {
            const res = await supertest(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with wrong password', async () => {
            const res = await supertest(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });
});
