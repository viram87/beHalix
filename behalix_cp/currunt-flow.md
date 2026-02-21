# Behalix — New User Flow (Current)

This document maps the current new user journey in the Behalix Event RSVP Platform, from initial signup to event participation.

## 1. Signup Phase
The user initiates their journey by providing basic account details.

*   **Endpoint:** `POST /auth/signup`
*   **Action:**
    *   System checks if the email is already registered in the `User` model.
    *   Password is hashed for security.
    *   A `PendingSignup` record is created or updated with the user's email, password hash, gender, and interests.
    *   A 6-digit OTP is generated and saved to the `OTP` model.
    *   The OTP is sent to the user's email address.
*   **Key Business Rules:**
    *   **Pending Signup TTL:** 10 minutes (automatically deleted by database after this period).
    *   **OTP Format:** 6-digit numeric code.
    *   **OTP Rate Limit:** Maximum 5 OTP requests per hour per email.
*   **Edge Cases:**
    *   **Email Exists:** Returns `EMAIL_ALREADY_EXISTS` (409).
    *   **Rate Limit Hit:** Returns `OTP_RATE_LIMIT` (429) if more than 5 requests are made within an hour.

## 2. Email Verification Phase
The user must verify their email to finalize account creation.

*   **Endpoint:** `POST /auth/verify-email`
*   **Action:**
    *   System validates the provided OTP against the `OTP` model (checks for matching email, code, and expiration).
    *   If valid, the OTP is marked as used.
    *   The system retrieves data from the `PendingSignup` record.
    *   A new `User` record is created.
    *   A corresponding `UserDetails` record is created (storing gender and interests).
    *   The `PendingSignup` record is deleted.
*   **Key Business Rules:**
    *   **OTP Expiry:** 10 minutes.
    *   **Atomic Transition:** User is only created after successful OTP verification.
*   **Edge Cases:**
    *   **Invalid/Expired OTP:** Returns `OTP_INVALID` (400).
    *   **Expired Signup:** Returns `PENDING_SIGNUP_NOT_FOUND` (404) if the 10-minute TTL has passed.

## 3. Login Phase
Once verified, the user can access the platform.

*   **Endpoint:** `POST /auth/login`
*   **Action:**
    *   System verifies credentials against the `User` model.
    *   A JWT (JSON Web Token) is generated for the session.
    *   The response includes the token and basic user profile data.
*   **Key Business Rules:**
    *   **JWT Expiry:** 7 days.
*   **Edge Cases:**
    *   **Invalid Credentials:** Returns `INVALID_CREDENTIALS` (401).

## 4. Authenticated Usage Phase
The user interacts with the platform using their JWT.

### Profile Management
*   **Endpoints:**
    *   `GET /user/me`: Retrieves current user profile and details.
    *   `PATCH /user/profile`: Updates gender or interests in `UserDetails`.

### Event Browsing
*   **Endpoints:**
    *   `GET /events`: Lists available events with pagination.
    *   `GET /events/:id`: Retrieves details for a specific event.
*   **Key Business Rules:**
    *   **Gender Filtering:** If the user's gender is "male", events marked as `isWomenOnly` are excluded from the list and return a 404 if accessed directly.

### RSVP Flow
*   **Endpoint:** `POST /events/:id/rsvp`
*   **Action:**
    *   System checks if the event exists and is accessible to the user (gender check).
    *   System checks for an existing `RSVP` record for this user and event.
    *   A new `RSVP` record is created.
*   **Key Business Rules:**
    *   **Duplicate Prevention:** Users cannot RSVP to the same event twice.
    *   **Women-Only Restriction:** Males are blocked from RSVPing to women-only events.
*   **Edge Cases:**
    *   **Already RSVPed:** Returns `ALREADY_RSVPED` (409).
    *   **Restricted Access:** Returns `EVENT_NOT_FOUND` (404) for males attempting to access women-only events.

## Happy Path Flow Diagram

```text
[Signup] 
   |  (email, password, gender, interests)
   v
[PendingSignup Created] + [OTP Sent]
   |  (10 min window)
   v
[Verify Email]
   |  (email, 6-digit code)
   v
[User + UserDetails Created] + [PendingSignup Deleted]
   |
   v
[Login]
   |  (email, password)
   v
[JWT Issued]
   |
   v
[Browse Events] -> [RSVP to Event]
```
