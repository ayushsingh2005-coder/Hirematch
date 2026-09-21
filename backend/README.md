# Hirematch Authentication Implementation Guide

This document explains the authentication flow implemented in the Hirematch backend, from OTP request to login and profile access.

---

## 1. Project overview

The authentication module is built to support:

- Email signup with OTP verification
- User registration after OTP validation
- Login with JWT token generation
- Protected routes using auth middleware
- Logout with token blacklist support
- Redis-based temporary OTP storage
- Email sending through SMTP using Nodemailer

The backend is organized as follows:

- `server.js` → starts the Express server and connects MongoDB
- `src/app.js` → mounts the auth routes
- `src/controllers/auth.controller.js` → business logic for auth
- `src/models/user.model.js` → MongoDB user schema and password/JWT methods
- `src/routes/auth.user.js` → endpoint definitions
- `src/middleware/auth.middleware.js` → JWT validation middleware
- `src/middleware/validate.middleware.js` → request validation rules
- `src/config/redis.js` → Upstash Redis client
- `src/config/nodemailer.js` → SMTP transporter
- `src/utils/*` → OTP generation, email delivery, API responses

---

## 2. Full authentication flow

### Step 1: Send OTP to email

Route:

- `POST /api/auth/send-otp`

Logic:

1. Receive `email` from the request.
2. Run validation to ensure it is a valid email.
3. Check whether email already exists in MongoDB.
4. Generate a 6-digit OTP.
5. Store OTP in Redis under a key like `otp:signup:<email>` with TTL 300 seconds.
6. Send the OTP to the user email using Nodemailer.
7. Return a success response.

Example response:

```json
{
  "success": true,
  "message": "OTP sent successfully to email",
  "data": {
    "email": "user@example.com"
  }
}
```

### Step 2: Verify OTP

Route:

- `POST /api/auth/verify-otp`

Logic:

1. Receive `email` and `otp`.
2. Read the Redis key `otp:signup:<email>`.
3. If the key is missing, response is `OTP expired or invalid`.
4. Compare the submitted OTP with the stored OTP.
5. If valid, update Redis data with `verified: true`.
6. Return success message.

This step is required before registration is allowed.

### Step 3: Register user

Route:

- `POST /api/auth/register`

Logic:

1. Validate username, email, password, and optional role.
2. Check whether the user already exists by email or username.
3. Fetch the OTP record from Redis for the email.
4. Confirm the OTP was verified.
5. Create the new user in MongoDB.
6. Delete the OTP from Redis after successful registration.
7. Generate JWT token.
8. Return the token and user data.

Example response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "mongo_id",
      "username": "john",
      "email": "john@example.com",
      "role": "candidate"
    }
  }
}
```

### Step 4: Login

Route:

- `POST /api/auth/login`

Logic:

1. Receive `email` and `password`.
2. Fetch user with password selected explicitly because the schema uses `select: false` for password.
3. Compare the supplied password with the stored bcrypt hash.
4. If valid, generate a JWT token.
5. Return token and user details.

### Step 5: Protected access

Routes:

- `GET /api/auth/profile`
- `POST /api/auth/logout`

Middleware:

- `authMiddleware`

The middleware does the following:

1. Reads the `Authorization` header.
2. Extracts the JWT token.
3. Checks whether the token is blacklisted in Redis.
4. Verifies the JWT signature using `JWT_SECRET`.
5. Validates that the user still exists in MongoDB.
6. Attaches the user object to `req.user`.
7. Allows access to the protected route.

For logout, the token is added to Redis with a blacklist key such as:

- `blacklist:<token>`

This prevents the token from being reused.

---

## 3. Redis usage in this backend

The backend uses Upstash Redis to temporarily store OTPs and blacklist tokens.

### Important Redis keys

- `otp:signup:<email>`
  - Stores the OTP for signup
  - Example value:

```json
{ "otp": "123456", "verified": false }
```

- `blacklist:<token>`
  - Stores invalidated JWTs when a user logs out

### Why Redis is used here

Redis is used because OTPs are temporary and should expire quickly. It is better than storing verification data in MongoDB for short-lived email flows.

### TTL configuration

- OTP TTL: 300 seconds (5 minutes)
- Blacklisted token TTL: 86400 seconds (24 hours)

### Redis file behavior

The file `src/config/redis.js` creates an Upstash client with:

- URL from `UPSTASH_REDIS_REST_URL`
- Token from `UPSTASH_REDIS_REST_TOKEN`
- `automaticDeserialization: false`

This is useful because the code stores JSON strings explicitly and reads them manually.

---

## 4. Email sending setup

The backend uses Nodemailer with Brevo (SendinBlue) SMTP relay.

File:

- `src/config/nodemailer.js`

The transporter is configured with:

- `host: smtp-relay.brevo.com`
- `port: 587`
- SMTP credentials from environment variables

The utility file `src/utils/sendEmail.js` sends the actual email message.

---

## 5. JWT and password handling

### Password hashing

The user model uses bcrypt before saving the password.

### JWT generation

Every user has a method:

- `generateAuthToken()`

This generates a JWT with:

- user id
- role
- expiry: 24 hours

### Compare password

The model also includes:

- `comparePassword(password)`

This compares the entered password to the hashed version in MongoDB.

---

## 6. API routes currently implemented

### Public routes

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`

### Protected routes

- `POST /api/auth/logout`
- `GET /api/auth/profile`

These are mounted in `src/routes/auth.user.js`.

---

## 7. Installed packages and modules

The backend package includes the following modules:

```json
{
  "@upstash/redis": "^1.38.4",
  "bcrypt": "^6.0.0",
  "cookie-parser": "^1.4.7",
  "cors": "^1.8.6",
  "dotenv": "^18.0.1",
  "express": "^5.2.1",
  "express-validator": "^7.3.2",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.10.1",
  "morgan": "^1.12.1",
  "nodemailer": "^10.0.10"
}
```

### What each is used for

- `express` → API server
- `mongoose` → MongoDB connection and schema
- `bcrypt` → password hashing and comparison
- `jsonwebtoken` → JWT creation and validation
- `express-validator` → request validation
- `dotenv` → environment variables
- `cors` → cross-origin request handling
- `cookie-parser` → cookie support if needed later
- `morgan` → request logging
- `nodemailer` → email delivery
- `@upstash/redis` → Redis OTP store and blacklisting

---

## 8. Environment variables required

The backend expects these variables in a `.env` file:

```env
MONGODB_URI=
JWT_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SMTP_USER=
SMTP_PASS=
PORT=
```

Important note:

- Do not commit real secret values to GitHub.
- Use a `.env` file locally or a proper secret manager in production.

---

## 9. Problems identified in the Hirematch backend

The following issues were found during review and were corrected or noted:

### Problem 1: Half-written auth flow

The original auth controller was incomplete and had missing logic for OTP, validation, and registration. It also used a mixed CommonJS/ESM pattern.

Solution:

- Rebuilt the controller logic in ES module style.
- Added all missing functions:
  - `sendOtp`
  - `verifyOtp`
  - `resendOtp`
  - `register`
  - `login`
  - `logout`
  - `getProfile`

### Problem 2: Missing auth route wiring

The route file previously had an empty `POST /register` route.

Solution:

- Wired the route file to the actual controller functions.
- Added validation middlewares.

### Problem 3: Wrong or missing imports for JWT and bcrypt

The model file originally used JWT and bcrypt without proper imports or a working token generation flow.

Solution:

- Added `import bcrypt from 'bcrypt'`
- Added `import jwt from 'jsonwebtoken'`
- Corrected JWT token structure and password compare logic

### Problem 4: Redis config mismatch

The Redis file relied on a config import structure that was inconsistent with the project setup.

Solution:

- Updated the config file to validate required env values.
- Corrected the Redis client initialization to use the actual environment variables.

### Problem 5: Auth flow lacked a real OTP lifecycle

The core requirement was to send OTP, verify OTP, and only then create the user.

Solution:

- OTP is stored in Redis with TTL 300 seconds.
- Verification is done against the Redis record.
- Registration checks `verified === true` before creating the user.
- OTP is deleted after registration.

### Problem 6: Missing email utility and OTP generator

The project had no reusable utilities for OTP generation and email sending.

Solution:

- Created `src/utils/generateOtp.js`
- Created `src/utils/sendEmail.js`
- Created `src/utils/apiResponse.js`

---

## 10. Current conclusion

The Hirematch authentication implementation now follows the correct flow:

1. User requests OTP
2. OTP is generated and stored in Upstash Redis
3. User receives OTP via email
4. User verifies OTP
5. OTP validity is checked in Redis
6. User is registered only after OTP verification
7. User logs in with JWT token
8. Protected routes validate the token
9. Logout invalidates the token using Redis blacklist

This is a robust, production-friendly pattern for email-based signup authentication.

The backend is functioning as a proper OTP-based auth system, but it still depends on the developer providing valid environment values and a working MongoDB + Upstash + SMTP configuration.

---

## 11. Final note

This project is now aligned with the same general working pattern used in the Zuno authentication flow, but adapted to the current Hirematch codebase structure and ESM setup.

If environment credentials are valid, the authentication flow will work correctly.
