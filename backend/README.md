# Pollify Backend

![Node.js](https://img.shields.io/badge/Node.js-22%2B-green)
![Express](https://img.shields.io/badge/Express-5.x-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**Enterprise-grade backend API for the Pollify polling web application.** Built with Clean Architecture, SOLID principles, and production-ready security standards. Deployed on Vercel with GitHub Actions CI/CD.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Folder Structure](#folder-structure)
5. [Installation](#installation)
6. [Docker](#docker)
7. [Environment Variables](#environment-variables)
8. [Running Locally](#running-locally)
9. [Swagger & API Documentation](#swagger--api-documentation)
10. [Testing](#testing)
11. [CI/CD](#cicd)
12. [Deployment](#deployment)
13. [Screenshots](#screenshots)
14. [License](#license)
15. [Contributing](#contributing)
16. [Future Roadmap](#future-roadmap)

---

## Project Overview

Pollify Backend is a RESTful API service that powers the Pollify polling platform. It handles user authentication, poll creation and voting, real-time analytics, comments, bookmarks, search, notifications, and admin moderation — all secured with enterprise-grade controls.

### Key Characteristics

- **Clean Architecture** — modules, services, repositories, controllers, and middlewares are strictly separated
- **Security-first** — JWT + HttpOnly cookies, CSRF protection, rate limiting, input sanitization, account lockout
- **Scalable** — stateless serverless-ready design with MongoDB Atlas support
- **Observable** — structured logging with Pino, correlation IDs, and audit trails
- **Production-ready** — Docker, CI/CD, health checks, graceful shutdown, error normalization

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────┐
│                   Client                    │
│      (Web / Mobile / Third-party)           │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / REST
                   ▼
┌─────────────────────────────────────────────┐
│              Express 5.x App                │
│  ┌────────────────────────────────────────┐ │
│  │          Middleware Layer              │ │
│  │  Helmet • CORS • Rate Limit • CSRF     │ │
│  │  Mongo Sanitize • Body Parser • Auth   │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │           Routes Layer                 │ │
│  │  /api/v1/{auth,user,vote,comment,...}  │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │        Controllers Layer               │ │
│  │  Thin HTTP layer — delegates to Service│ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │         Services Layer                 │ │
│  │  Business logic, validation, orchestration│ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │         Repositories Layer              │ │
│  │  Direct MongoDB/Mongoose data access   │ │
│  └────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              MongoDB Atlas                  │
│    (Users, Polls, Votes, Comments, etc.)    │
└─────────────────────────────────────────────┘
```

### Design Patterns

| Pattern                  | Usage                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Clean Architecture**   | Modules are self-contained with their own routes, controllers, services, repositories, validations, and middlewares |
| **Repository Pattern**   | All database access is abstracted behind repository classes                                                         |
| **Service Layer**        | Business logic is isolated from HTTP concerns                                                                       |
| **Middleware Pipeline**  | Cross-cutting concerns (auth, validation, CSRF, rate limiting) are composable                                       |
| **Dependency Injection** | Services instantiate their own repositories; controllers consume services                                           |
| **Factory Pattern**      | JWT service, mail service, and Cloudinary service encapsulate third-party client creation                           |
| **Strategy Pattern**     | Multiple chart types (pie, bar, line, area) and time analytics intervals                                            |

---

## Features

### Authentication & Authorization

- Email/password registration with OTP verification
- JWT access tokens (15 min) + HttpOnly refresh tokens (7 days)
- Login with username or email
- Account lockout after failed login attempts
- Password reset with secure time-limited tokens
- Role-based access control: `user`, `admin`, `super_admin`
- CSRF double-submit cookie protection

### Polling & Voting

- Create polls with multiple options, types, and categories
- Single-choice, multiple-choice, and anonymous voting
- Vote change and removal
- Duplicate vote prevention
- Poll lifecycle: draft → active → expired → closed
- Soft delete with audit trail

### Comments & Engagement

- Add, edit, delete comments with soft delete
- One-level nested replies
- Like/unlike comments
- Pin comments (poll owner only)
- Report comments for moderation

### Search & Discovery

- Global search across polls, users, and categories
- Trending, popular, and latest polls
- Search suggestions and search history
- Recently viewed polls tracking
- Category-based filtering

### Bookmarks

- Save and remove bookmarks
- View saved polls with pagination
- Bookmark statistics

### Notifications

- In-app notifications for votes, comments, poll updates
- Notification preferences (email, push, vote, comment, poll, system, marketing)
- Mark as read / mark all as read
- Unread count endpoint

### Analytics

- Poll overview with metadata and engagement stats
- Live results with vote percentages
- Time-based analytics (daily, weekly, monthly, hourly)
- Voter analytics (unique, anonymous, registered)
- Chart-ready data for pie, bar, line, and area charts
- Owner dashboard with growth metrics

### Admin & Moderation

- Admin dashboard with platform statistics
- User management (suspend, unsuspend, delete, role updates)
- Poll management (delete, restore, feature, close)
- Comment moderation (delete, restore)
- Category CRUD operations
- Report review and moderation actions
- Audit logs for all admin actions
- System settings management

---

## Folder Structure

```
polling-backend/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, format, audit on every push
│       └── cd.yml                  # Auto-deploy to Vercel after CI
├── .husky/                         # Git hooks (commitlint, lint-staged)
├── src/
│   ├── app.js                      # Express app, security, CORS, routes
│   ├── server.js                   # Entry point, Vercel/serverless compat
│   ├── config/
│   │   ├── db.config.js            # MongoDB connection (Atlas / local)
│   │   └── env.js                  # Centralized env config with validation
│   ├── middlewares/
│   │   ├── authenticate.middleware.js   # JWT token verification
│   │   ├── authorize.middleware.js      # Role-based access control
│   │   ├── csrf.middleware.js           # CSRF double-submit cookie
│   │   ├── error.middleware.js          # Centralized error normalization
│   │   ├── upload.js                    # Multer + Cloudinary config
│   │   └── validate.middleware.js       # Zod schema validation
│   ├── models/                     # 16 Mongoose schemas
│   │   ├── User.js
│   │   ├── Poll.js
│   │   ├── Vote.js
│   │   ├── Comment.js
│   │   ├── CommentLike.js
│   │   ├── CommentReport.js
│   │   ├── Bookmark.js
│   │   ├── Notification.js
│   │   ├── Report.js
│   │   ├── Category.js
│   │   ├── AuditLog.js
│   │   ├── SearchHistory.js
│   │   ├── RecentlyViewed.js
│   │   ├── RefreshToken.js
│   │   ├── VerificationToken.js
│   │   └── PasswordResetToken.js
│   ├── modules/                    # Feature modules (Clean Architecture)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── vote/
│   │   ├── analytics/
│   │   ├── comment/
│   │   ├── bookmark/
│   │   ├── notification/
│   │   ├── search/
│   │   ├── admin/
│   │   └── report/
│   ├── services/
│   │   ├── jwt.service.js
│   │   ├── mail.service.js
│   │   ├── mail.templates.js
│   │   ├── otp.service.js
│   │   └── cloudinary.service.js
│   └── utils/
│       ├── apiError.js
│       ├── cookie.util.js
│       ├── generateOTP.js
│       ├── logger.js
│       ├── otp.util.js
│       ├── passwordStrength.js
│       ├── response.js
│       └── token.util.js
├── Dockerfile                      # Multi-stage Node.js 22 Alpine build
├── docker-compose.yml              # Backend + MongoDB orchestration
├── vercel.json                     # Vercel serverless deployment config
├── .env.example                    # Environment variable template
├── package.json
├── yarn.lock
└── README.md
```

---

## Installation

### Prerequisites

| Requirement | Version | Purpose                                        |
| ----------- | ------- | ---------------------------------------------- |
| Node.js     | 22.x+   | Runtime                                        |
| Yarn        | 1.x+    | Package manager                                |
| MongoDB     | 5.x+    | Primary database (local or Atlas)              |
| SMTP        | —       | Email delivery (Gmail, SendGrid, Resend, etc.) |
| Cloudinary  | —       | Image upload and CDN                           |

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/umarxcodes/polling-backend.git
cd polling-backend

# 2. Install dependencies
yarn install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start development server with hot reload
yarn dev
```

The server starts at `http://localhost:5000`.

---

## Docker

### Production Docker Image (Multi-Stage)

```bash
docker build -t polling-backend:latest .
```

### Docker Compose (Backend + MongoDB)

```bash
# Start all services (backend + MongoDB)
docker compose up --build

# Stop services
docker compose down

# Stop services and remove volumes (WARNING: deletes data)
docker compose down -v
```

### Docker Compose (Backend only, using external MongoDB)

If you want to run only the backend container and connect to an existing MongoDB (e.g., Atlas):

```bash
docker compose up --build backend
```

Update `.env` to point to your external database:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pollify
```

---

## Environment Variables

Create a `.env` file in the project root. All variables are required unless marked optional.

### Server

| Variable        | Default                 | Description                                                 |
| --------------- | ----------------------- | ----------------------------------------------------------- |
| `NODE_ENV`      | `development`           | `development` \| `production`                               |
| `PORT`          | `5000`                  | Server port (Vercel injects this automatically)             |
| `CORS_ORIGIN`   | `http://localhost:5173` | Comma-separated allowed origins                             |
| `FRONTEND_URL`  | `http://localhost:5173` | Used for email links and redirects                          |
| `COOKIE_SECURE` | auto                    | `true` in production; set explicitly for other environments |

### Database

| Variable    | Description                                |
| ----------- | ------------------------------------------ |
| `MONGO_URI` | MongoDB connection string (Atlas or local) |

### JWT

| Variable             | Default | Description                                                   |
| -------------------- | ------- | ------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`  | —       | Secret for access token signing (**required**, min 32 chars)  |
| `JWT_REFRESH_SECRET` | —       | Secret for refresh token signing (**required**, min 32 chars) |
| `JWT_ACCESS_EXPIRY`  | `15m`   | Access token TTL                                              |
| `JWT_REFRESH_EXPIRY` | `7d`    | Refresh token TTL                                             |

### Security

| Variable                      | Default | Description                   |
| ----------------------------- | ------- | ----------------------------- |
| `BCRYPT_SALT_ROUNDS`          | `12`    | Password hashing cost factor  |
| `OTP_SALT_ROUNDS`             | `10`    | OTP hashing cost factor       |
| `OTP_EXPIRY_IN_MINUTES`       | `10`    | OTP validity window           |
| `OTP_MAX_ATTEMPTS`            | `5`     | Max OTP verification attempts |
| `OTP_RESEND_COOLDOWN_SECONDS` | `60`    | Cooldown before OTP resend    |
| `LOGIN_MAX_ATTEMPTS`          | `5`     | Failed logins before lockout  |
| `LOGIN_LOCK_MINUTES`          | `15`    | Account lockout duration      |

### Email (SMTP)

| Variable      | Default | Description                               |
| ------------- | ------- | ----------------------------------------- |
| `SMTP_HOST`   | —       | SMTP server hostname                      |
| `SMTP_PORT`   | `587`   | SMTP port (587 for STARTTLS, 465 for SSL) |
| `SMTP_SECURE` | `false` | `true` for port 465 (implicit TLS)        |
| `SMTP_USER`   | —       | SMTP authentication username              |
| `SMTP_PASS`   | —       | SMTP authentication password              |
| `SMTP_FROM`   | —       | Sender email address                      |

### Cloudinary

| Variable                | Description           |
| ----------------------- | --------------------- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`    | Cloudinary API key    |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## Running Locally

```bash
# Install dependencies
yarn install

# Copy environment file and edit
cp .env.example .env

# Start development server (nodemon with hot reload)
yarn dev

# Start production server
yarn start

# Health check
yarn health
```

### Development Server

`yarn dev` uses `nodemon` to watch for file changes and restart the server automatically.

### Production Server

`yarn start` runs `node src/server.js`. In production, set:

```env
NODE_ENV=production
COOKIE_SECURE=true
CORS_ORIGIN=https://your-production-domain.com
```

### Health Check

```bash
curl http://localhost:5000/health
```

Returns:

```json
{
  "success": true,
  "message": "Pollify API is healthy",
  "timestamp": "2026-07-30T02:00:00.000Z"
}
```

---

## Swagger & API Documentation

The API follows RESTful conventions with consistent response shapes.

### Response Format

**Success:**

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Base URL

```
http://localhost:5000/api/v1
```

### Key Endpoints

#### Authentication

| Method | Endpoint                    | Auth   | Description                          |
| ------ | --------------------------- | ------ | ------------------------------------ |
| POST   | `/auth/register`            | No     | Register new user with OTP           |
| POST   | `/auth/verify-email`        | No     | Verify email with OTP                |
| POST   | `/auth/resend-verification` | No     | Resend verification OTP              |
| POST   | `/auth/login`               | No     | Login with username/email + password |
| POST   | `/auth/refresh-token`       | Cookie | Rotate access token                  |
| POST   | `/auth/logout`              | Cookie | Revoke refresh session               |
| POST   | `/auth/forgot-password`     | No     | Request password reset               |
| POST   | `/auth/reset-password`      | No     | Reset with token                     |
| PATCH  | `/auth/change-password`     | Yes    | Change password                      |
| GET    | `/auth/me`                  | Yes    | Get current user                     |
| PATCH  | `/auth/profile`             | Yes    | Update profile                       |

#### Votes

| Method | Endpoint                       | Auth | Description      |
| ------ | ------------------------------ | ---- | ---------------- |
| POST   | `/votes/polls/:pollId/vote`    | Yes  | Cast vote        |
| PATCH  | `/votes/polls/:pollId/vote`    | Yes  | Change vote      |
| DELETE | `/votes/polls/:pollId/vote`    | Yes  | Remove vote      |
| GET    | `/votes/polls/:pollId/my-vote` | Yes  | Get my vote      |
| GET    | `/votes/polls/:pollId/voters`  | No   | Get voters       |
| GET    | `/votes/polls/:pollId/results` | No   | Get poll results |

#### Comments

| Method | Endpoint                           | Auth | Description      |
| ------ | ---------------------------------- | ---- | ---------------- |
| POST   | `/comments/polls/:pollId/comments` | Yes  | Add comment      |
| GET    | `/comments/polls/:pollId/comments` | No   | Get comments     |
| PATCH  | `/comments/:commentId`             | Yes  | Edit comment     |
| DELETE | `/comments/:commentId`             | Yes  | Delete comment   |
| POST   | `/comments/:commentId/replies`     | Yes  | Reply to comment |
| POST   | `/comments/:commentId/like`        | Yes  | Like comment     |
| DELETE | `/comments/:commentId/like`        | Yes  | Unlike comment   |
| PATCH  | `/comments/:commentId/pin`         | Yes  | Pin comment      |
| POST   | `/comments/:commentId/report`      | Yes  | Report comment   |

#### Search

| Method | Endpoint              | Auth | Description             |
| ------ | --------------------- | ---- | ----------------------- |
| GET    | `/search`             | No   | Global search           |
| GET    | `/search/polls`       | No   | Search polls            |
| GET    | `/search/users`       | No   | Search users            |
| GET    | `/search/categories`  | No   | Get categories          |
| GET    | `/search/trending`    | No   | Trending polls          |
| GET    | `/search/popular`     | No   | Popular polls           |
| GET    | `/search/latest`      | No   | Latest polls            |
| GET    | `/search/ending-soon` | No   | Polls ending within 24h |
| GET    | `/search/suggestions` | No   | Search suggestions      |

#### Admin

| Method | Endpoint                   | Auth        | Description          |
| ------ | -------------------------- | ----------- | -------------------- |
| GET    | `/admin/dashboard`         | Admin       | Dashboard statistics |
| GET    | `/admin/users`             | Admin       | User management      |
| PATCH  | `/admin/users/:id/role`    | Super Admin | Update role          |
| PATCH  | `/admin/users/:id/suspend` | Admin       | Suspend user         |
| DELETE | `/admin/users/:id`         | Super Admin | Delete user          |
| GET    | `/admin/polls`             | Admin       | Poll management      |
| GET    | `/admin/comments`          | Admin       | Comment management   |
| GET    | `/admin/categories`        | Admin       | Category management  |
| GET    | `/admin/audit-logs`        | Super Admin | Audit trail          |
| GET    | `/admin/analytics`         | Admin       | Admin analytics      |

### Error Codes

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Success               |
| 201    | Created               |
| 202    | Accepted              |
| 400    | Validation Error      |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 409    | Conflict              |
| 413    | Payload Too Large     |
| 423    | Locked                |
| 429    | Too Many Requests     |
| 500    | Internal Server Error |

---

## Testing

### Run Tests

```bash
yarn test
```

### Run Linter

```bash
yarn lint          # Check for issues
yarn lint:fix      # Auto-fix issues
```

### Run Formatter

```bash
yarn format        # Auto-format with Prettier
yarn format:check  # Check formatting without writing
```

### Run Security Audit

```bash
yarn audit --level moderate
```

### Manual API Testing

The project has been production-level tested with curl against all modules (Auth, Vote, Analytics, Comments, Bookmarks, Notifications, Search, Reports, Admin, 404 handling). Test scripts are available at `/tmp/test_all_modules_v2.sh` for reference.

---

## CI/CD

### GitHub Actions Workflows

| Workflow | File                       | Trigger                             | Purpose                            |
| -------- | -------------------------- | ----------------------------------- | ---------------------------------- |
| CI       | `.github/workflows/ci.yml` | Push/PR to `main`, `development`    | Lint, format check, security audit |
| CD       | `.github/workflows/cd.yml` | CI success on `main`, `development` | Deploy to Vercel                   |

### CI Pipeline

1. Checkout repository
2. Setup Node.js 20.x with Yarn cache
3. Install dependencies with `HUSKY=0 yarn install --frozen-lockfile`
4. Run ESLint
5. Run Prettier format check
6. Run security audit (`yarn audit --level moderate`)
7. Upload source artifact

### CD Pipeline

1. Triggered after CI success
2. Checkout repository at the commit SHA
3. Install Vercel CLI
4. Pull Vercel environment variables
5. Build project on Vercel
6. Deploy to Vercel
7. Output deployment URL

**Branch Strategy:**

| Branch        | Environment | Auto-Deploy    |
| ------------- | ----------- | -------------- |
| `main`        | Production  | Yes (after CI) |
| `development` | Preview     | Yes (after CI) |

### Required GitHub Secrets

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret              | Description                             |
| ------------------- | --------------------------------------- |
| `VERCEL_TOKEN`      | Vercel access token (scoped to project) |
| `VERCEL_ORG_ID`     | Vercel team or user ID                  |
| `VERCEL_PROJECT_ID` | Vercel project ID                       |

---

## Deployment

### Vercel (Recommended)

The project is configured for Vercel serverless deployment.

**Setup:**

1. Import repository from GitHub in Vercel Dashboard
2. Framework preset: **Other**
3. Root directory: `.`
4. Add environment variables in Vercel Dashboard (see [Environment Variables](#environment-variables))
5. Connect `development` branch for preview deploys
6. Connect `main` branch for production deploys

**Local Vercel CLI:**

```bash
vercel login
vercel link
vercel --prod
```

### Docker

```bash
# Build image
docker build -t polling-backend:latest .

# Run container
docker run -p 5000:5000 --env-file .env polling-backend:latest
```

### Docker Compose (Full Stack)

```bash
docker compose up --build
```

Services:

- `backend` — Pollify API on port 5000
- `mongo` — MongoDB 7 on port 27017 with persistent volume

---

## Screenshots

> Placeholder for application screenshots and deployment previews.

| Section             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| API Health Check    | `GET /health` returning 200 OK                         |
| Authentication Flow | Register → Verify OTP → Login → Access Protected Route |
| Poll Creation       | Create poll with multiple options                      |
| Voting              | Cast vote and view live results                        |
| Comments            | Add comment with nested replies and likes              |
| Search              | Global search with suggestions and filters             |
| Admin Dashboard     | Platform statistics and user management                |
| Vercel Deployment   | Live production URL                                    |
| GitHub Actions      | CI/CD pipeline passing                                 |

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and ensure all CI checks pass
4. Commit using Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
5. Push to your fork and open a Pull Request against `development`

### Commit Convention

| Type       | Description              |
| ---------- | ------------------------ |
| `feat`     | New feature              |
| `fix`      | Bug fix                  |
| `docs`     | Documentation changes    |
| `refactor` | Code refactoring         |
| `test`     | Adding or updating tests |
| `chore`    | Maintenance tasks        |

### Code Standards

- Follow ESLint and Prettier configurations
- Use Clean Architecture and SOLID principles
- Write modular, reusable, and testable code
- Never commit secrets or credentials
- Update this README when adding new features

---

## Future Roadmap

### Phase 1 — Foundation (Current)

- [x] User authentication with JWT + OTP
- [x] Poll creation and voting
- [x] Comments and engagement
- [x] Search and discovery
- [x] Bookmarks and notifications
- [x] Admin panel and moderation
- [x] Docker and Vercel deployment
- [x] CI/CD with GitHub Actions

### Phase 2 — Real-time & Scale

- [ ] WebSocket support with Socket.IO for live poll updates
- [ ] Redis caching for trending and popular polls
- [ ] Horizontal scaling with Redis session store
- [ ] Webhook integrations for third-party services
- [ ] Advanced analytics with export to CSV/PDF

### Phase 3 — Enterprise Features

- [ ] Multi-tenant support for organizations
- [ ] SSO integration (Google, GitHub, Microsoft)
- [ ] Advanced permission system with custom roles
- [ ] Rate limiting tiers based on user plans
- [ ] Audit log export and compliance reporting
- [ ] API versioning strategy

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Author

Built by **Muhammad Umar** as part of the Pollify polling web application.

For questions or support, open an issue on [GitHub](https://github.com/umarxcodes/polling-backend/issues).
