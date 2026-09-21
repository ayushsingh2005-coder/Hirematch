# Hirematch Backend

Hirematch is being built as a recruitment platform connecting candidates and recruiters. The backend currently establishes the user account and authentication foundation. Resume upload and resume parsing are the next feature being wired into the platform.

## Current progress

### Implemented

- Express server with JSON parsing and request logging
- MongoDB connection through Mongoose
- User accounts with `candidate` and `recruiter` roles
- Password hashing with bcrypt
- Email signup verification with a six-digit OTP
- OTP expiry and temporary storage in Upstash Redis
- JWT login tokens with a 24-hour expiry
- Protected profile and logout routes
- JWT blacklist support in Redis after logout
- Email delivery through Nodemailer and Brevo SMTP
- Consistent success and error API responses

### In progress: resumes

The initial resume infrastructure is present:

- Cloudinary configuration in `src/config/cloudinary.js`
- PDF-only Multer storage in `src/config/multer.js`
- A 5 MB upload limit
- A resume schema containing the user, Cloudinary URL, file metadata, and extracted text
- Initial resume routes for upload and fetching

The resume controller still needs to be implemented. The intended flow is:

1. Authenticate the user and receive a PDF through Multer.
2. Upload the PDF to Cloudinary as a raw resource.
3. Extract text from the PDF with `pdf-parse`.
4. Upsert the user's resume document in MongoDB.
5. Return the stored resume details.

## Backend structure

- `server.js` starts the server and connects to MongoDB.
- `src/app.js` configures Express and mounts API routes.
- `src/controllers/` contains authentication and resume business logic.
- `src/models/` contains the User and Resume MongoDB schemas.
- `src/routes/` defines authentication and resume endpoints.
- `src/middleware/` contains JWT authentication and request validation.
- `src/config/` contains MongoDB, Redis, SMTP, Cloudinary, and Multer setup.
- `src/utils/` contains OTP generation, email delivery, and API response helpers.

## Running the backend

```bash
npm install
npm run dev
```

The server uses port `3000` by default. Set `PORT` to use another port.

The following environment variables are required:

```env
MONGODB_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
JWT_SECRET=your_jwt_secret
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SENDER_EMAIL=your_sender_email
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

`MONGODB_URI`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` are checked during configuration startup.

## Authentication API

All authentication routes are under `/api/auth`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/send-otp` | No | Send a signup OTP to an unused email |
| `POST` | `/verify-otp` | No | Verify the signup OTP |
| `POST` | `/resend-otp` | No | Send a replacement signup OTP |
| `POST` | `/register` | No | Create a user after OTP verification |
| `POST` | `/login` | No | Authenticate with email and password |
| `GET` | `/profile` | Bearer token | Fetch the authenticated user's profile |
| `POST` | `/logout` | Bearer token | Blacklist the current JWT |

Protected requests use:

```http
Authorization: Bearer <jwt>
```

### Signup flow

1. `POST /api/auth/send-otp` stores an OTP in Redis for five minutes and sends it by email.
2. `POST /api/auth/verify-otp` marks the OTP as verified.
3. `POST /api/auth/register` creates the user, removes the OTP record, and returns a JWT.

OTP records use the key `otp:signup:<email>`. Logged-out tokens use `blacklist:<token>` and are retained for 24 hours.

## Resume API status

The intended resume endpoints are mounted under `/api/resume`:

| Method | Endpoint | Intended purpose |
| --- | --- | --- |
| `POST` | `/upload` | Upload and parse a candidate PDF resume |
| `GET` | `/fetchresume` | Fetch the authenticated user's resume |

These endpoints are not complete yet. The route/controller wiring and authentication behavior must be finished before they are available for use.

## Important implementation note

The resume route is currently scaffolded but not fully wired: `src/app.js` and `src/routes/resume.routes.js` still need their resume imports and controller handlers connected. Until that work is completed, the authentication implementation is the usable part of the backend.

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

If environment credentials are valid, the authentication flow will work correctly.
