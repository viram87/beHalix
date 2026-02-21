# PRD: Event RSVP Platform (MVP)

## Overview
A simple backend API for users to create events, manage preferences, and RSVP to events. Women-only events are hidden from male users.

**Tech Stack:** Node.js + Express + TypeScript + Mongoose + MongoDB Atlas

---

## Core Entities

### 1. User (Auth Data - Core)
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  passwordHash: String (required),
  createdAt: Date
}
```

**Indexes:**
- `email` (unique)

---

### 2. UserDetails (Profile/Preferences - Extensible)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (references User._id, required, unique),
  gender: String (enum: "male" | "female" | "other", required),
  interests: [String] (default: [], max 10 items, each max 50 chars),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (unique)

**Validation:**
- `gender` must be one of: "male", "female", "other"
- `interests` max 10 items, each item max 50 characters

---

### 3. PendingSignup (Temporary - TTL 10 minutes)
```javascript
{
  _id: ObjectId,
  email: String (required),
  passwordHash: String (required),
  gender: String (enum: "male" | "female" | "other", required),
  interests: [String] (default: []),
  createdAt: Date (TTL index - auto-delete after 600 seconds)
}
```

**Indexes:**
- `createdAt` (TTL index with `expireAfterSeconds: 600`)
- `email` (for lookup during verification)

---

### 4. OTP (Email Verification Codes)
```javascript
{
  _id: ObjectId,
  email: String (required),
  code: String (6-digit numeric string, required),
  expiresAt: Date (required),
  isUsed: Boolean (default: false),
  createdAt: Date
}
```

**Indexes:**
- `email` (for lookup)
- `createdAt` (for cleanup)

**Business Rules:**
- OTP valid for 10 minutes
- Rate limit: Max 5 OTP requests per email per hour

---

### 5. Event
```javascript
{
  _id: ObjectId,
  createdBy: ObjectId (references User._id, required),
  title: String (required, max 200 chars),
  description: String (optional, max 2000 chars),
  timestamp: Date (required, must be future date),
  isWomenOnly: Boolean (default: false),
  address: {
    line1: String (required, max 100 chars),
    line2: String (optional, max 100 chars),
    city: String (required, max 50 chars),
    state: String (required, max 50 chars),
    zipCode: String (required, max 10 chars)
  },
  images: [
    {
      url: String (Cloudinary URL),
      publicId: String (Cloudinary public ID),
      uploadedAt: Date
    }
  ] (default: [], max 5 images),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `timestamp` (for sorting/filtering)
- `createdBy` (for user's events)
- `isWomenOnly` (for filtering)

**Validation:**
- `timestamp` must be in the future at creation
- Maximum 5 images per event

---

### 6. RSVP
```javascript
{
  _id: ObjectId,
  userId: ObjectId (references User._id, required),
  eventId: ObjectId (references Event._id, required),
  createdAt: Date
}
```

**Indexes:**
- Compound unique index: `{ userId, eventId }` (prevents duplicate RSVPs)
- `eventId` (for fetching event attendees)
- `userId` (for fetching user's RSVPs)

---

## User Flows

### 1. Signup & Email Verification Flow

```
User → POST /auth/signup
  ↓
Create PendingSignup record
  ↓
Generate 6-digit OTP
  ↓
Save OTP to database (expires in 10 min)
  ↓
Send OTP email
  ↓
Return success response

User → POST /auth/verify-email
  ↓
Validate OTP (check expiry, isUsed)
  ↓
Fetch PendingSignup by email
  ↓
Create User record
  ↓
Create UserDetails record
  ↓
Mark OTP as used
  ↓
Delete PendingSignup
  ↓
Return success response
```

---

### 2. Login Flow

```
User → POST /auth/login
  ↓
Find User by email
  ↓
Compare password with hash
  ↓
Generate JWT (expires in 7 days)
  ↓
Fetch UserDetails
  ↓
Return token + user data
```

---

### 3. Event Creation Flow

```
Authenticated User → POST /events
  ↓
Validate request body
  ↓
Upload images to Cloudinary (if provided)
  ↓
Create Event record
  ↓
Return event details
```

---

### 4. Event Listing Flow (with Women-Only Filter)

```
Authenticated User → GET /events?page=1&limit=20
  ↓
Fetch UserDetails to get gender
  ↓
Build query:
  - If gender = "male": { isWomenOnly: false }
  - Else: {} (show all events)
  ↓
Fetch events with pagination
  ↓
For each event: calculate RSVP count
  ↓
Return events + pagination metadata
```

---

### 5. RSVP Flow

```
Authenticated User → POST /events/:id/rsvp
  ↓
Fetch event by ID
  ↓
Check event visibility (women-only filter)
  ↓
Check if already RSVPed (duplicate check)
  ↓
Create RSVP record
  ↓
Return success response
```

---

## API Endpoints

### Auth Endpoints

#### POST `/auth/signup`
Create a new user account and send verification OTP.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!",
  "gender": "female",
  "interests": ["music", "tech"]  // optional, can be empty
}
```

**Validation:**
- Email: valid email format, max 255 chars
- Password: min 8 chars, must contain uppercase + lowercase + number
- Gender: must be "male", "female", or "other"
- Interests: optional array, max 10 items

**Response (201):**
```json
{
  "message": "Verification OTP sent to email",
  "email": "alice@example.com"
}
```

**Errors:**
- `400` - Validation error
- `409` - Email already exists (in User or PendingSignup)
- `429` - Too many OTP requests (rate limit)

---

#### POST `/auth/verify-email`
Verify email with OTP code and create user account.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now login."
}
```

**Errors:**
- `400` - Invalid OTP code
- `400` - OTP expired
- `404` - Pending signup not found
- `409` - Email already verified

---

#### POST `/auth/login`
Login with email and password, receive JWT token.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "alice@example.com",
    "gender": "female",
    "interests": ["music", "tech"]
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

### User Profile Endpoints

#### GET `/users/me`
Get current user's profile (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "alice@example.com",
  "gender": "female",
  "interests": ["music", "tech"],
  "createdAt": "2025-02-10T10:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized (invalid/missing token)

---

#### PATCH `/users/me/profile`
Update user profile (gender, interests).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (all fields optional):**
```json
{
  "gender": "other",
  "interests": ["music", "sports", "travel"]
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "gender": "other",
    "interests": ["music", "sports", "travel"],
    "updatedAt": "2025-02-11T12:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized

---

### Event Endpoints

#### POST `/events`
Create a new event (requires auth).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data  // if uploading images
```

**Request Body:**
```json
{
  "title": "Women in Tech Meetup",
  "description": "Networking event for women in technology",
  "timestamp": "2025-03-15T18:00:00Z",
  "isWomenOnly": true,
  "address": {
    "line1": "123 Main St",
    "line2": "Suite 400",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105"
  },
  "images": [File, File]  // optional, max 5 files
}
```

**Response (201):**
```json
{
  "id": "65f1a2b3c4d5e6f7g8h9i0j1",
  "createdBy": "507f1f77bcf86cd799439011",
  "title": "Women in Tech Meetup",
  "description": "Networking event for women in technology",
  "timestamp": "2025-03-15T18:00:00Z",
  "isWomenOnly": true,
  "address": {
    "line1": "123 Main St",
    "line2": "Suite 400",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105"
  },
  "images": [
    {
      "url": "https://res.cloudinary.com/demo/image/upload/v1234/event_image_1.jpg",
      "publicId": "event_image_1",
      "uploadedAt": "2025-02-11T10:30:00Z"
    }
  ],
  "createdAt": "2025-02-11T10:30:00Z"
}
```

**Errors:**
- `400` - Validation error
- `400` - Timestamp must be in future
- `401` - Unauthorized
- `413` - Too many images (max 5)

---

#### GET `/events`
List all events with pagination (requires auth, filters women-only events for male users).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?page=1          // default: 1
&limit=20        // default: 20, max: 100
```

**Response (200):**
```json
{
  "events": [
    {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Women in Tech Meetup",
      "description": "Networking event...",
      "timestamp": "2025-03-15T18:00:00Z",
      "isWomenOnly": true,
      "address": {
        "city": "San Francisco",
        "state": "CA"
      },
      "images": [...],
      "rsvpCount": 12,
      "createdAt": "2025-02-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Business Rules:**
- If user gender = "male", only return events where `isWomenOnly: false`
- If user gender = "female" or "other", return all events

**Errors:**
- `401` - Unauthorized

---

#### GET `/events/:id`
Get single event details (requires auth, respects women-only filter).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "65f1a2b3c4d5e6f7g8h9i0j1",
  "createdBy": "507f1f77bcf86cd799439011",
  "title": "Women in Tech Meetup",
  "description": "Networking event for women in technology",
  "timestamp": "2025-03-15T18:00:00Z",
  "isWomenOnly": true,
  "address": {
    "line1": "123 Main St",
    "line2": "Suite 400",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105"
  },
  "images": [...],
  "rsvpCount": 12,
  "createdAt": "2025-02-11T10:30:00Z"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Event not found (or hidden due to women-only filter)

---

#### DELETE `/events/:id`
Delete an event (only creator can delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not the creator)
- `404` - Event not found

---

### RSVP Endpoints

#### POST `/events/:id/rsvp`
RSVP to an event (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (201):**
```json
{
  "message": "RSVP successful",
  "rsvp": {
    "id": "75a2b3c4d5e6f7g8h9i0j1k2",
    "userId": "507f1f77bcf86cd799439011",
    "eventId": "65f1a2b3c4d5e6f7g8h9i0j1",
    "createdAt": "2025-02-11T10:35:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Event not found (or hidden due to women-only filter)
- `409` - Already RSVPed to this event

---

#### DELETE `/events/:id/rsvp`
Cancel RSVP to an event (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "RSVP cancelled successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - RSVP not found

---

#### GET `/events/:id/rsvps`
Get all RSVPs for an event (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
// Option 1: Paginated
?page=1&limit=50

// Option 2: Full list
?all=true
```

**Response (200) - Paginated:**
```json
{
  "rsvps": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "email": "alice@example.com",
      "gender": "female",
      "interests": ["music", "tech"],
      "rsvpedAt": "2025-02-11T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  }
}
```

**Response (200) - Full List:**
```json
{
  "rsvps": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "email": "alice@example.com",
      "gender": "female",
      "interests": ["music", "tech"],
      "rsvpedAt": "2025-02-11T10:35:00Z"
    }
    // All RSVPs, no pagination
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Event not found

---

#### GET `/users/me/rsvps`
Get current user's RSVPs (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?page=1&limit=20
```

**Response (200):**
```json
{
  "rsvps": [
    {
      "rsvpId": "75a2b3c4d5e6f7g8h9i0j1k2",
      "event": {
        "id": "65f1a2b3c4d5e6f7g8h9i0j1",
        "title": "Women in Tech Meetup",
        "timestamp": "2025-03-15T18:00:00Z",
        "address": {
          "city": "San Francisco",
          "state": "CA"
        }
      },
      "rsvpedAt": "2025-02-11T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Errors:**
- `401` - Unauthorized

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `OTP_EXPIRED` | 400 | OTP code has expired |
| `OTP_INVALID` | 400 | Invalid OTP code |
| `OTP_RATE_LIMIT` | 429 | Too many OTP requests |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `EVENT_NOT_FOUND` | 404 | Event doesn't exist or hidden |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Not authorized for this action |
| `ALREADY_RSVPED` | 409 | User already RSVPed to event |
| `RSVP_NOT_FOUND` | 404 | RSVP doesn't exist |
| `PENDING_SIGNUP_NOT_FOUND` | 404 | No pending signup for email |
| `EVENT_PAST` | 400 | Event timestamp is in the past |
| `TOO_MANY_IMAGES` | 413 | Max 5 images per event |

---

## Security & Technical Requirements

### Authentication & Authorization
- **Password hashing:** bcrypt with 10 salt rounds
- **JWT:** HS256 algorithm, expires in 7 days
- **OTP:** 6-digit random numeric code, expires in 10 minutes
- **Rate limiting:** Max 5 OTP requests per email per hour

### Data Validation
- **Email:** Valid email format, max 255 characters
- **Password:** Min 8 chars, must contain: uppercase, lowercase, number
- **Event timestamp:** Must be in the future at creation time
- **Interests:** Max 10 items per user, each max 50 characters
- **Event images:** Max 5 images, uploaded to Cloudinary

### Database Indexes
```javascript
// User
db.users.createIndex({ email: 1 }, { unique: true });

// UserDetails
db.userdetails.createIndex({ userId: 1 }, { unique: true });

// PendingSignup
db.pendingsignups.createIndex({ email: 1 });
db.pendingsignups.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });

// OTP
db.otps.createIndex({ email: 1 });
db.otps.createIndex({ createdAt: 1 });

// Event
db.events.createIndex({ timestamp: 1 });
db.events.createIndex({ createdBy: 1 });
db.events.createIndex({ isWomenOnly: 1 });

// RSVP
db.rsvps.createIndex({ userId: 1, eventId: 1 }, { unique: true });
db.rsvps.createIndex({ eventId: 1 });
db.rsvps.createIndex({ userId: 1 });
```

### Performance
- **RSVP count:** Calculated on-the-fly using `countDocuments()` with index
- **Pagination:** Default limit 20, max limit 100
- **Image storage:** Cloudinary (free tier: 25GB storage, 25GB bandwidth/month)
- **Expected response times:** <200ms for simple queries, <500ms for complex queries

### Environment Variables
```
# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
OTP_RATE_LIMIT_WINDOW=3600000  # 1 hour in ms
OTP_RATE_LIMIT_MAX=5

# Server
PORT=3000
NODE_ENV=production
```

---

## Out of Scope (Future Versions)

### Authentication
- Social login (Google, Facebook, Apple)
- Two-factor authentication (2FA)
- Password reset flow
- Magic link login

### User Features
- User profiles with photos/avatars
- User bio and extended profile fields
- Follow/friend system
- User blocking/reporting

### Event Features
- Event categories/tags/topics
- Event search by keyword
- Filter events by distance/location
- Event capacity limits
- Waitlist functionality
- Recurring events
- Event comments/discussion
- Event updates/announcements

### RSVP Features
- RSVP with "+1" guests
- RSVP status (going/maybe/not going)
- Check-in at event

### Notifications
- Email notifications for new events
- Email reminders before events
- Push notifications (mobile)
- In-app notifications

### Social Features
- Share events to social media
- Invite friends to events
- Event chat/messaging
- Photo sharing at events

### Admin Features
- Admin dashboard
- User moderation
- Event moderation/approval
- Analytics and reporting

### Recommendations
- Recommended events based on interests
- "People you may know" suggestions
- ML-based event recommendations

---

## Success Criteria (POC)

### Functional Requirements
- ✅ Users can sign up with email + password + gender
- ✅ Email verification via OTP works
- ✅ Users can login and receive JWT token
- ✅ Users can update their profile (gender, interests)
- ✅ Users can create events with address and images
- ✅ Male users cannot see women-only events
- ✅ Users can RSVP to events they can see
- ✅ Users can cancel their RSVP
- ✅ Users can see who RSVPed to an event
- ✅ Pagination works for all list endpoints

### Non-Functional Requirements
- ✅ API responds in <200ms for simple queries
- ✅ Passwords are properly hashed (bcrypt)
- ✅ JWT tokens expire after 7 days
- ✅ OTP codes expire after 10 minutes
- ✅ Rate limiting prevents OTP spam
- ✅ MongoDB indexes optimize query performance
- ✅ OpenAPI spec is complete and accurate

### Deployment
- ✅ Backend deployed to Vercel
- ✅ MongoDB Atlas (free tier) configured
- ✅ Cloudinary configured for image uploads
- ✅ Environment variables properly set
- ✅ CORS configured for frontend (when ready)

---

## Implementation Notes

### Tech Stack Summary
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB Atlas (free tier)
- **ODM:** Mongoose
- **Auth:** JWT (jsonwebtoken), bcrypt
- **Email:** Nodemailer
- **Image Storage:** Cloudinary
- **Validation:** express-validator or Joi
- **API Docs:** Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express)
- **Deployment:** Vercel (serverless functions)

### Project Structure
```
src/
├── config/
│   ├── database.ts
│   ├── cloudinary.ts
│   └── email.ts
├── models/
│   ├── User.ts
│   ├── UserDetails.ts
│   ├── PendingSignup.ts
│   ├── OTP.ts
│   ├── Event.ts
│   └── RSVP.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── event.routes.ts
│   └── rsvp.routes.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── event.controller.ts
│   └── rsvp.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
├── services/
│   ├── email.service.ts
│   ├── otp.service.ts
│   └── cloudinary.service.ts
├── utils/
│   ├── jwt.util.ts
│   ├── password.util.ts
│   └── validators.util.ts
└── app.ts
```

### Key Considerations
1. **Women-only filtering:** Always join User + UserDetails to get gender before filtering events
2. **RSVP count:** Use `Model.countDocuments()` with proper indexing - fast enough for MVP
3. **Image uploads:** Use multer middleware → upload to Cloudinary → store URL in Event
4. **Pending signups:** MongoDB TTL index auto-deletes after 10 minutes
5. **OTP cleanup:** Add cron job or manual cleanup for old OTPs (no TTL to preserve audit trail)
6. **Vercel deployment:** Use serverless functions, ensure MongoDB connection pooling

---

**This PRD is locked for MVP. Ship it. 🚀**
