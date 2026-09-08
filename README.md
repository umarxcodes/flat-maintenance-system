# 🏢 Flat Maintenance Management System

A comprehensive, production-grade management platform for residential complexes, gated communities, and housing societies. Designed as a modular monorepo containing backend services and frontend applications.

---

## 📁 Repository Structure

```text
flat-maintenance-management-system/
├── flat-maintenance-backend/      # Express.js 5 REST API, MongoDB/Mongoose, JWT, Zod
│   ├── docs/                      # Complete Backend Architecture Blueprint
│   ├── src/                       # Application logic (Controllers, Models, Services, etc.)
│   ├── package.json               # Backend dependencies and scripts
│   └── README.md                  # Detailed backend documentation
│
└── flat-maintenance-frontend/     # (Upcoming) Web portal & client dashboard
```

---

## 🚀 Services & Packages

### 1. [Flat Maintenance Backend](flat-maintenance-backend/README.md)
- **Runtime:** Node.js (>=22.0.0 ESM)
- **Framework:** Express 5.x
- **Database:** MongoDB 7.0+ via Mongoose 8.x
- **Security:** Helmet, CORS, Express-Rate-Limit, Mongo-Sanitize, BCrypt, JWT
- **Validation:** Zod Schema Validation
- **Architecture Documentation:** [Backend Technical Documentation](flat-maintenance-backend/docs/BACKEND_TECHNICAL_DOCUMENTATION.md)

#### Quick Start (Backend):
```bash
cd flat-maintenance-backend
cp .env.example .env     # Configure MongoDB and JWT credentials
yarn install
yarn dev                 # Starts the backend server with nodemon
```

### 2. Flat Maintenance Frontend (Coming Soon)
- The frontend client application will be integrated under `flat-maintenance-frontend/`.

---

## 🛠️ Monorepo CI/CD

Continuous Integration workflows are managed via GitHub Actions located in `.github/workflows/ci.yml`.

---

## 📄 License

This project is licensed under the [MIT License](flat-maintenance-backend/LICENSE).
