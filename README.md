# 🚀 Express Node.js & MongoDB Backend Boilerplate

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg)](https://mongoosejs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

An **enterprise-grade, production-ready REST API boilerplate** built with Node.js (ESM), Express 5, MongoDB / Mongoose, and Clean Architecture principles. Designed to serve as a secure, scalable, and standardized baseline for building modern backend services.

---

## 📋 Table of Contents

1. [Overview & Highlights](#-overview--highlights)
2. [Tech Stack](#-tech-stack)
3. [Architecture & Design Patterns](#-architecture--design-patterns)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Environment Variables](#-environment-variables)
7. [NPM Scripts Reference](#-npm-scripts-reference)
8. [Security Controls](#-security-controls)
9. [API Response & Error Format](#-api-response--error-format)
10. [Docker & Containerization](#-docker--containerization)
11. [Deployment (Vercel & Cloud)](#-deployment-vercel--cloud)
12. [Code Quality & Git Hooks](#-code-quality--git-hooks)
13. [License](#-license)

---

## 🌟 Overview & Highlights

This boilerplate provides a solid foundation for enterprise backend applications, removing boilerplate setup work while enforcing clean code structure and security best practices out of the box:

- **Clean Architecture & Domain Driven Design**: Separation of concerns across controllers, services, repositories, models, and routes.
- **ES Modules (ESM)**: Modern JavaScript syntax (`import/export`) running natively on Node 22+.
- **Security Hardened**: Built-in HTTP header protection, CORS configuration, rate limiting, NoSQL injection defense, and input validation.
- **Database Ready**: Preconfigured MongoDB connection via Mongoose with connection pooling and graceful error handling.
- **Observability & Error Handling**: Global exception capture, standardized error responses, and clean process lifecycle handling.
- **DevOps Ready**: Pre-built Docker containerization, Docker Compose, and Vercel serverless integration.

---

## 💻 Tech Stack

| Domain             | Technology / Library                             | Description                                                    |
| :----------------- | :----------------------------------------------- | :------------------------------------------------------------- |
| **Runtime**        | Node.js (v22+)                                   | Native ES Modules execution environment                        |
| **Framework**      | Express 5.x                                      | Web framework with improved async error handling               |
| **Database**       | MongoDB & Mongoose (v9.x)                        | NoSQL Document Store with Schema Modeling                      |
| **Security**       | Helmet, CORS, Express-Rate-Limit, Mongo-Sanitize | Defense-in-depth security layer                                |
| **Validation**     | Zod                                              | TypeScript-first Schema Validation                             |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcrypt`      | Secure authentication token generation and password hashing    |
| **File Storage**   | Multer & Cloudinary                              | File upload middleware and cloud CDN media management          |
| **Mail Service**   | Nodemailer                                       | Transactional email & OTP delivery                             |
| **Code Quality**   | ESLint 10, Prettier, Husky, Commitlint           | Automated linting, code formatting, and conventional git hooks |
| **Testing**        | Node Native Test Runner (`node --test`)          | Zero-dependency high performance test suite                    |

---

## 🏗️ Architecture & Design Patterns

The architecture follows strict separation of concerns to allow teams to scale features independently:

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                       │
│              (Web / Mobile / Frontend SPA)              │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / REST APIs
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Express 5 App Layer                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                  Middleware Pipeline                │ │
│ │    Helmet • CORS • Rate Limit • Mongo Sanitize      │ │
│ │         Cookie Parser • Body Parser • Auth          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                     Router Layer                    │ │
│ │            (/api/v1/auth, /api/v1/users)            │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                  Controller Layer                   │ │
│ │     Parses HTTP Request & Maps API Response         │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                    Service Layer                    │ │
│ │           Encapsulates Core Business Logic          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                  Repository Layer                   │ │
│ │        Direct Data Access Abstraction (Mongoose)    │ │
│ └─────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────┘
                             │ Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   MongoDB Database                      │
│             (Local Mongo Instance / Atlas)              │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
backend/
├── .github/
│   └── workflows/
│       ├── ci.yml               # Automated Lint, Format & Security Audit CI Pipeline
│       └── cd.yml               # Automated Deployment Pipeline
├── .husky/                      # Git hooks (commitlint, lint-staged)
├── src/
│   ├── app.js                   # Express application setup & middleware stack
│   ├── server.js                # Server startup, database connection & shutdown handlers
│   ├── config/                  # DB, Environment & Third-party service configurations
│   │   └── db.config.js         # Mongoose connection setup
│   ├── middlewares/             # Custom middlewares (Auth, Validation, Errors, Uploads)
│   ├── models/                  # Mongoose Schemas & Data Models
│   ├── modules/                 # Modular feature domains (Auth, User, etc.)
│   ├── services/                # Business logic services & third-party integrations
│   ├── tests/                   # Automated unit & integration tests
│   │   └── app.test.js          # Health check & App sanity test suite
│   └── utils/                   # Shared utility modules (ApiError, AsyncHandler, Response)
├── .dockerignore                # Docker ignore rules
├── .env.example                 # Environment variables configuration template
├── .gitignore                   # Git ignore specification
├── Dockerfile                   # Multi-stage production Dockerfile
├── docker-compose.yml           # Local multi-container Docker orchestrator
├── eslint.config.js             # ESLint configuration
├── package.json                 # Project dependencies & operational scripts
├── vercel.json                  # Serverless deployment configuration
└── README.md                    # Backend Boilerplate Documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v22.0.0` or higher
- **MongoDB**: Local MongoDB instance or a MongoDB Atlas URI
- **Yarn / NPM**: Package Manager

### Step-by-Step Setup

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # OR
   yarn install
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` and configure your database URI and secrets._

4. **Start the Development Server**

   ```bash
   npm run dev
   # OR
   yarn dev
   ```

5. **Verify Installation**
   Open your browser or API client (Postman/cURL):
   - Health Check: `GET http://localhost:5000/health`
   - API Status: `GET http://localhost:5000/`

---

## 🔑 Environment Variables

The application relies on the following key environment variables configured in `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
COOKIE_SECURE=false

# Database Configuration
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@HOST/DB_NAME?retryWrites=true&w=majority

# Authentication & JWT Secrets (Minimum 32 characters for production)
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

---

## 🛠️ NPM Scripts Reference

| Command                | Description                                                       |
| :--------------------- | :---------------------------------------------------------------- |
| `npm run dev`          | Starts the server in development mode with hot-reload (`nodemon`) |
| `npm start`            | Runs the server in production mode (`node src/server.js`)         |
| `npm test`             | Runs the native Node.js test suite (`node --test`)                |
| `npm run lint`         | Runs ESLint to check for code issues                              |
| `npm run lint:fix`     | Automatically fixes repairable ESLint issues                      |
| `npm run format`       | Formats all files using Prettier                                  |
| `npm run format:check` | Verifies formatting across files without modifying them           |
| `npm run build`        | Validates application entry point for production build readiness  |

---

## 🛡️ Security Controls

This boilerplate comes pre-configured with industry-standard security protections:

- **HTTP Headers Security**: Helmet hides `X-Powered-By` header, enables HSTS, CSP, X-Frame-Options, and XSS filtering.
- **Cross-Origin Resource Sharing (CORS)**: Strict origin whitelisting with credential support for secure frontend integrations.
- **Rate Limiting**: Default rate-limiter prevents brute-force login and API abuse (100 requests per 15-minute window).
- **NoSQL Injection Defense**: `mongo-sanitize` strips out parameter keys starting with `$` or `.` from request payloads.
- **Data Protection**: Secure HttpOnly, SameSite cookies for handling auth tokens and preventing XSS token theft.

---

## 📊 API Response & Error Format

All API endpoints return predictable, standardized JSON responses.

### Success Response (`200 / 201 OK`)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response (`400 / 401 / 500`)

```json
{
  "success": false,
  "message": "Detailed error message explanation",
  "stack": "Included only in development mode"
}
```

---

## 🐳 Docker & Containerization

### Running with Docker Compose (Backend + MongoDB)

Start the full stack environment locally with zero host dependencies:

```bash
# Build and start services
docker-compose up --build

# Stop services
docker-compose down

# Stop services and purge database volume
docker-compose down -v
```

### Building Standalone Docker Image

```bash
# Build production multi-stage image
docker build -t express-backend-boilerplate:latest .

# Run container standalone
docker run -p 5000:5000 --env-file .env express-backend-boilerplate:latest
```

---

## ☁️ Deployment (Vercel & Cloud)

### Deploying to Vercel (Serverless)

This repository includes a pre-configured `vercel.json` file.

1. Install Vercel CLI or connect your GitHub repository to Vercel.
2. Set Environment Variables in your Vercel Project Settings.
3. Deploy:
   ```bash
   vercel --prod
   ```

---

## 🧹 Code Quality & Git Hooks

- **Husky & Lint-Staged**: Runs ESLint and Prettier automatically on staged files before each commit.
- **Commitlint**: Enforces Conventional Commits formatting (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 👨‍💻 Author

Crafted & Maintained by **Muhammad Umar**.
