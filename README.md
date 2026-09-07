# 🏢 Flat Maintenance Management System — Backend REST API

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0%2B-green.svg)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.x-red.svg)](https://mongoosejs.com/)
[![Security: Hardened](https://img.shields.io/badge/Security-Helmet%20%7C%20JWT%20%7C%20Zod-blue.svg)](docs/BACKEND_TECHNICAL_DOCUMENTATION.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An Express 5 starter for the Flat Maintenance Management System, with a production-oriented **modular-monolith blueprint** built around **Node.js (v22 ESM)**, MongoDB/Mongoose, Zod, and JWT.

This system provides a complete administrative, financial, operational, and security intelligence engine for modern residential complexes, gated communities, and housing societies.

> 📖 **Single Source of Truth Blueprint:**  
> For the complete 70-point architectural specification, 22 database collection schemas, security controls, business rules, state machines, and sequence diagrams, refer to:  
> 👉 [**Backend Technical Architecture Documentation (`docs/BACKEND_TECHNICAL_DOCUMENTATION.md`)**](docs/BACKEND_TECHNICAL_DOCUMENTATION.md)

---

## 📋 Table of Contents

1. [Overview & System Purpose](#-overview--system-purpose)
2. [Key Core Modules](#-key-core-modules)
3. [Technology Stack](#-technology-stack)
4. [Backend Layered Architecture](#-backend-layered-architecture)
5. [Directory Structure](#-directory-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables Configuration](#-environment-variables-configuration)
8. [API Standards & Response Specification](#-api-standards--response-specification)
9. [Security Hardening & Controls](#-security-hardening--controls)
10. [Docker Containerization](#-docker-containerization)
11. [Development Workflow & Implementation Phases](#-development-workflow--implementation-phases)
12. [License & Contact](#-license--contact)

---

## 🌟 Overview & System Purpose

## Current implementation status

The checked-in application currently exposes only `GET /` and `GET /health`, plus MongoDB connection bootstrap and a smoke test. The modules, JWT/RBAC, Cloudinary, n8n, production middleware, and versioned REST API described below are the approved implementation target, not features already available. See the [implementation status section](docs/BACKEND_TECHNICAL_DOCUMENTATION.md#65-implementation-status--source-of-truth-rules) before integrating with the API.

The **Flat Maintenance Management System Backend** automates residential society operations by providing:

- **Hierarchy Management:** Buildings, Blocks, Floors, and Flat Units tracking.
- **Occupancy Management:** Property Owners, Tenants, and Lease profiles.
- **Financial Billing Engine:** Automated maintenance billing, penalty calculation, and payment transactions.
- **Complaint & SLA Tracking:** Resident maintenance ticket dispatching, staff allocation, and resolution reviews.
- **Service Ratings & Reviews:** 1-5 star service rating engine for maintenance work moderation and staff performance analytics.
- **Gate Visitor Security:** Digital guest pass generation, resident verification, and check-in/out gate logging.
- **Society Notices & Documents:** Broadcast announcements, file storage integration (Cloudinary), and document governance.
- **Immutable Auditing:** System-wide audit event recording for security compliance and financial accountability.

---

## 📦 Key Core Modules (22 Modules)

| #         | Module Domain                | Description                                                                                     |
| :-------- | :--------------------------- | :---------------------------------------------------------------------------------------------- |
| **1**     | **Authentication**           | JWT access/refresh token dual-system, bcrypt password hashing, session rotation.                |
| **2**     | **Users**                    | User account management, profile data, status lifecycles (`ACTIVE`, `SUSPENDED`).               |
| **3**     | **Roles & Permissions**      | Granular RBAC supporting SuperAdmin, BuildingAdmin, Accountant, Security, Staff, Owner, Tenant. |
| **4-7**   | **Building Hierarchy**       | Buildings, Blocks, Floors, and Flat Unit management.                                            |
| **8-9**   | **Owners & Tenants**         | Property ownership, lease agreements, tenant occupancy, move-in/out tracking.                   |
| **10**    | **Staff**                    | Security guards, technicians, shifts, performance ratings.                                      |
| **11-13** | **Financial Engine**         | Charge configs, batch invoice generation, ACID-compliant payment processing.                    |
| **14-15** | **Complaints & Reviews**     | Maintenance ticket lifecycle (`OPEN` -> `RESOLVED`), post-service star reviews.                 |
| **16-17** | **Notices & Notifications**  | Target broadcasts, emergency alerts, resident in-app notifications.                             |
| **18-20** | **Expenses, Visitors, Docs** | Society expenses tracking, gate visitor check-in, Cloudinary document management.               |
| **21-22** | **Reports & Audit Logs**     | Collection analytics, SLA reports, append-only immutable audit trail.                           |

---

## 💻 Technology Stack

| Component             | Selected Technology                      | Purpose / Detail                                      |
| :-------------------- | :--------------------------------------- | :---------------------------------------------------- |
| **Runtime**           | Node.js v22 LTS                          | Native ES Modules (`import/export`) execution         |
| **Web Framework**     | Express.js v5.x                          | Native async error propagation middleware             |
| **Database & ODM**    | MongoDB 7.0+ / Mongoose 9.x              | Schema-flexible document store with ACID transactions |
| **Validation Engine** | Zod 4.x                                  | Schema validation for Body, Query, and Params         |
| **Security Suite**    | Helmet, CORS, Mongo-Sanitize, Rate-Limit | Multi-layer HTTP and query defense                    |
| **Authentication**    | JWT (`jsonwebtoken`) & `bcrypt`          | Dual-token authentication with cookie rotation        |
| **File Storage**      | Multer & Cloudinary                      | Direct memory stream cloud object storage             |
| **Testing**           | Node Native Runner & Supertest           | Zero-dependency unit and HTTP integration testing     |
| **DevOps**            | Docker & GitHub Actions                  | Containerization & automated CI/CD pipeline           |

---

## 🏗️ Backend Layered Architecture

The system enforces strict **Separation of Concerns**:

```text
Client (Next.js SPA / Mobile App)
          │
          ▼
Express Gateway Middleware (Helmet, CORS, Rate Limit, Mongo-Sanitize)
          │
          ▼
API Routing (/api/v1/<module>)
          │
          ▼
Zod Validation Interceptor
          │
          ▼
Controller Layer (HTTP Adapter: Parses Request, Invokes Service, Maps Response)
          │
          ▼
Service Layer (100% Core Business Logic & MongoDB Transactions)
          │
          ▼
Data Model Layer (Mongoose Schemas, Indexes & Hooks)
          │
          ▼
MongoDB Database Cluster
```

---

## 📁 Directory Structure

```text
flat-maintenance-backend/
├── docs/
│   └── BACKEND_TECHNICAL_DOCUMENTATION.md  # Master Technical Blueprint
├── src/
│   ├── app.js                          # Express App & Global Middleware
│   ├── server.js                       # Server Startup & Process Lifecycle
│   ├── config/                         # Env validation, DB & Cloudinary Configs
│   ├── constants/                      # Enums, Roles, Permissions, Error Codes
│   ├── middlewares/                    # Auth, RBAC, Validation, Error Handler
│   ├── modules/                        # 22 Modular Feature Domains
│   ├── routes/                         # Central Router Dispatcher (/api/v1)
│   └── utils/                          # ApiError, ApiResponse, Pagination, JWT
├── tests/                              # Unit, Integration & E2E Test Suites
├── scripts/                            # DB Seeding & Smoke Test Scripts
├── Dockerfile                          # Multi-stage Container Build
├── docker-compose.yml                  # Local Node + Mongo Stack
└── README.md                           # Overview Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.0.0` or higher
- **MongoDB**: Local instance (v7.0+ Replica Set for transactions) or MongoDB Atlas URI
- **Yarn / NPM**: Package Manager

### Installation & Execution

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd flat-maintenance-backend
   ```

2. **Install Dependencies**

   ```bash
   yarn install
   # or
   npm install
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` to configure your MongoDB connection string, JWT secrets, and Cloudinary keys._

4. **Start Development Server**

   ```bash
   yarn dev
   # or
   npm run dev
   ```

5. **Verify Server Health**
   - Health Check: `GET http://localhost:5000/health`
   - `GET http://localhost:5000/ready` is planned and is not available yet.

---

## ⚙️ Environment Variables Configuration

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
COOKIE_SECRET=super_secret_cookie_key_min_32_chars

MONGO_URI=mongodb://localhost:27017/flat_maintenance_db?replicaSet=rs0

JWT_ACCESS_SECRET=access_token_secret_key_minimum_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=refresh_token_secret_key_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

LOG_LEVEL=info
```

---

## 📊 API Standards & Response Specification

Base Endpoint Namespace: `/api/v1`

### Success Response (`200 / 201 OK`)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response (`400 / 401 / 404 / 422 / 500`)

```json
{
  "success": false,
  "message": "Validation failed for request payload",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    }
  ],
  "data": null
}
```

---

## 🛡️ Security Hardening & Controls

- **HTTP Protection:** Helmet hides `X-Powered-By`, enforces HSTS, CSP, and XSS protection headers.
- **CORS Whitelisting:** Strict origin validation for Next.js frontend clients with credential cookie support.
- **NoSQL Injection Guard:** `express-mongo-sanitize` strips out `$` and `.` operators from requests.
- **Rate Limiting:** Prevents brute-force attacks on Auth and Password routes.
- **JWT Storage:** Access Tokens in Memory/Header; Refresh Tokens in HttpOnly, SameSite, Secure cookies.

---

## 🐳 Docker Containerization

Run the backend and MongoDB via Docker Compose:

```bash
# Build and launch stack
docker-compose up --build -d

# Check running logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## 🛠️ Development Workflow & Implementation Phases

Development proceeds sequentially according to the **27 Phase Plan** documented in [BACKEND_TECHNICAL_DOCUMENTATION.md](docs/BACKEND_TECHNICAL_DOCUMENTATION.md):

- **Phase 0:** Architecture Foundation & Global Middlewares
- **Phase 1-2:** Authentication & RBAC System
- **Phase 3-7:** Building Hierarchy (Buildings, Blocks, Floors, Flats, Owners)
- **Phase 8-10:** Occupants & Staff (Tenants, Staff)
- **Phase 11-13:** Billing Engine (Maintenance Configs, Invoices, Payments)
- **Phase 14-15:** Operations (Complaints, Ratings & Reviews)
- **Phase 16-22:** Auxiliaries & Security (Notices, Notifications, Expenses, Visitors, Documents, Reports, Audit Logs)
- **Phase 23-26:** Testing, Containerization, CI/CD & Production Hardening

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 👨‍💻 Author & Maintainer

Crafted & Maintained by **Muhammad Umar** for **Flat Maintenance Management System**.
