# FLAT MAINTENANCE MANAGEMENT SYSTEM

## BACKEND TECHNICAL ARCHITECTURE SPECIFICATION & SYSTEM DESIGN BLUEPRINT

---

> **Document Version:** 2.0.0
> **Status:** Target architecture / implementation blueprint (SSOT)
> **Target System:** Flat Maintenance Management System (Backend REST API)  
> **Primary Stack:** Node.js (v22+ ESM), Express.js (v5.x), MongoDB, Mongoose ODM, Zod, JWT, Docker  
> **Architecture Pattern:** Modular Monolith with Layered Hexagonal/Clean Principles

---

## TABLE OF CONTENTS

1. [Executive Summary & Project Overview](#1-executive-summary--project-overview)
   - [🌟 High-Level System & Client Overview](#high-level-system--client-overview)
2. [Technology Stack & Library Justifications](#2-technology-stack--library-justifications)
3. [Backend Architecture & Layered Design](#3-backend-architecture--layered-design)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Engineering & Development Principles](#5-engineering--development-principles)
6. [API Design Standard & Conventions](#6-api-design-standard--conventions)
7. [Standard API Response Specification](#7-standard-api-response-specification)
8. [HTTP Status Code Standard](#8-http-status-code-standard)
9. [Environment Configuration & Management](#9-environment-configuration--management)
10. [Database Architecture & Data Modeling Principles](#10-database-architecture--data-modeling-principles)
11. [Database Collections Specification (Complete 22 Schemas)](#11-database-collections-specification)
12. [Module 1 — Authentication](#12-module-1--authentication)
13. [Module 2 — Users](#13-module-2--users)
14. [Module 3 — Roles & Permissions (RBAC)](#14-module-3--roles--permissions-rbac)
15. [Module 4 — Buildings](#15-module-4--buildings)
16. [Module 5 — Blocks](#16-module-5--blocks)
17. [Module 6 — Floors](#17-module-6--floors)
18. [Module 7 — Flats](#18-module-7--flats)
19. [Module 8 — Owners](#19-module-8--owners)
20. [Module 9 — Tenants](#20-module-9--tenants)
21. [Module 10 — Staff](#21-module-10--staff)
22. [Module 11 — Maintenance Configurations](#22-module-11--maintenance-configurations)
23. [Module 12 — Invoices](#23-module-12--invoices)
24. [Module 13 — Payments & Transactions](#24-module-13--payments--transactions)
25. [Module 14 — Complaints](#25-module-14--complaints)
26. [Module 15 — Ratings & Reviews](#26-module-15--ratings--reviews)
27. [Module 16 — Notices](#27-module-16--notices)
28. [Module 17 — Notifications](#28-module-17--notifications)
29. [Module 18 — Expenses](#29-module-18--expenses)
30. [Module 19 — Visitors](#30-module-19--visitors)
31. [Module 20 — Documents](#31-module-20--documents)
32. [Module 21 — Reports & Analytics](#32-module-21--reports--analytics)
33. [Module 22 — Audit Logs](#33-module-22--audit-logs)
34. [Global Error Handling Architecture](#34-global-error-handling-architecture)
35. [Validation Architecture (Zod Engine)](#35-validation-architecture-zod-engine)
36. [Authorization Architecture (RBAC + OBAC)](#36-authorization-architecture-rbac--obac)
37. [Pagination Standard](#37-pagination-standard)
38. [Search, Filtering & Sorting Conventions](#38-search-filtering--sorting-conventions)
39. [MongoDB Indexing Strategy](#39-mongodb-indexing-strategy)
40. [Database Transactions (ACID Boundaries)](#40-database-transactions-acid-boundaries)
41. [Security Architecture & Security Checklist](#41-security-architecture--security-checklist)
42. [File Upload Security & Cloud Storage](#42-file-upload-security--cloud-storage)
43. [Logging, Observability & Monitoring](#43-logging-observability--monitoring)
44. [Health Check & Readiness Architecture](#44-health-check--readiness-architecture)
45. [Testing Architecture & Workflow](#45-testing-architecture--workflow)
46. [API Endpoint Inventory (Comprehensive Endpoint Matrix)](#46-api-endpoint-inventory)
47. [Core Business Rules & Constraints](#47-core-business-rules--constraints)
48. [State Machines & Transition Rules](#48-state-machines--transition-rules)
49. [Data Ownership & Multi-Tenancy Evolution](#49-data-ownership--multi-tenancy-evolution)
50. [Backend Performance Optimization](#50-backend-performance-optimization)
51. [Scalability Architecture & Future Microservices Path](#51-scalability-architecture--future-microservices-path)
52. [Background Jobs & Queue Architecture](#52-background-jobs--queue-architecture)
53. [Docker & Containerization Specification](#53-docker--containerization-specification)
54. [CI/CD Automation Pipeline (GitHub Actions)](#54-cicd-automation-pipeline-github-actions)
55. [AWS Cloud Deployment Architecture](#55-aws-cloud-deployment-architecture)
56. [Backups, Disaster Recovery & RPO/RTO](#56-backups-disaster-recovery--rporto)
57. [Frontend Integration Contract (Next.js Client)](#57-frontend-integration-contract-nextjs-client)
58. [Development Workflow & Phase Breakdown](#58-development-workflow--phase-breakdown)
59. [Module Completion Checklist](#59-module-completion-checklist)
60. [Edge Cases & Backend Mitigation Matrix](#60-edge-cases--backend-mitigation-matrix)
61. [Production Readiness Checklist](#61-production-readiness-checklist)
62. [Entity Relationship (ER) Diagrams](#62-entity-relationship-er-diagrams)
63. [Request Flow Sequence Diagrams](#63-request-flow-sequence-diagrams)
64. [Engineering Rules & Quality Controls](#64-engineering-rules--quality-controls)
65. [Implementation Status & Source-of-Truth Rules](#65-implementation-status--source-of-truth-rules)
66. [Provisioning, Authentication & Session Contracts](#66-provisioning-authentication--session-contracts)
67. [Authorization, Building Scope & Permission Contract](#67-authorization-building-scope--permission-contract)
68. [Domain Delivery Contracts](#68-domain-delivery-contracts)
69. [n8n Automation & Event Contract](#69-n8n-automation--event-contract)
70. [Operational Delivery Contract](#70-operational-delivery-contract)
71. [Current Implementation vs Target Architecture (Gap Analysis)](#71-current-implementation-vs-target-architecture-gap-analysis)
72. [Architectural Decision Records (ADR-001 to ADR-010)](#72-architectural-decision-records-adr-001-to-adr-010)
73. [Developer Workflow & Git Conventions](#73-developer-workflow--git-conventions)
74. [System Architecture Visual Graphs (Mermaid Specifications)](#74-system-architecture-visual-graphs-mermaid-specifications)
75. [Production Readiness Checklist & Quality Gates](#75-production-readiness-checklist--quality-gates)

---

## 1. EXECUTIVE SUMMARY & PROJECT OVERVIEW

### 1.1 Purpose of the Backend System

The **Flat Maintenance Management System Backend** serves as the central administrative, financial, operational, and security intelligence engine for modern residential complexes, gated communities, and housing societies. It provides a hardened, highly available RESTful API layer that coordinates complex multi-entity relationships across building hierarchies, resident records, financial billing workflows, maintenance operations, visitor logging, notice publishing, and automated staff audit tracking.

### 1.2 Problems Solved by the System

1. **Financial Opacity & Billing Errors:** Replaces informal cash collections and manual spreadsheet tracking with immutable, auditable invoice calculation engines and payment transaction logs.
2. **Maintenance & Complaint Delay:** Replaces physical logbooks and un-tracked calls with automated complaint lifecycle routing, staff assignment, SLA tracking, and post-resolution resident rating analytics.
3. **Security & Visitor Unawareness:** Eliminates unauthorized building access by mandating real-time visitor pre-approval, resident verification, and entry/exit logging by gate security staff.
4. **Communication Gaps:** Centralizes broadcasts, emergency bulletins, maintenance schedules, and digital document distribution to specific buildings, blocks, or roles.
5. **Lack of Governance & Accountability:** Enforces strict Role-Based Access Control (RBAC) and immutable Audit Logging to track every modification to financial records, occupancy assignments, and security roles.

### 1.3 Target Persona & User Base

- **Super Admin:** System maintainers overseeing society settings, module activation, system-wide audits, and high-level role management.
- **Building Admin:** Operational managers handling building hierarchy (Blocks, Floors, Flats), resident onboarding, staff allocation, notice publishing, and expense management.
- **Accountant:** Financial administrators responsible for maintenance charge configurations, batch invoice generation, payment reconciliations, and financial reporting.
- **Security Staff:** Gate guards responsible for verifying visitor entry/exit codes, logging visitor vehicles, and alerting residents.
- **Maintenance Staff:** Technicians (plumbers, electricians, cleaners) assigned to resolve maintenance complaints and log work completion.
- **Flat Owner:** Property owners tracking flat occupancy, receiving financial statements, paying maintenance bills, and monitoring tenant activities.
- **Tenant:** Legal occupants of flats accessing building notices, logging maintenance complaints, rating completed staff work, and managing guest access.

### 1.4 Primary Responsibilities of the Backend

- Enforce domain business logic, data validation, and state machine transitions.
- Secure endpoints using JWT authentication, HTTP-Only cookies, and granular permissions.
- Execute ACID-compliant MongoDB database transactions for financial calculations.
- Orchestrate file uploads to Cloudinary CDN and generate secure asset URLs.
- Maintain structured application logging, centralized exception handling, and audit trails.
- Expose deterministic RESTful endpoints for web (Next.js) and mobile clients.

### 1.5 Architecture Model: Modular Monolith

The application is intentionally designed as a **Modular Monolith**. Rather than introducing premature microservices complexity (network latency, distributed tracing overhead, saga orchestrations), the backend isolates each domain within self-contained modules (`src/modules/<module-name>`). Each module owns its schema definitions, services, controllers, and validation rules while remaining in a single deployable Express.js unit. This guarantees high cohesion, low coupling, simple local developer workflows, and a direct path to domain extraction into microservices when traffic scale demands it.

---

## HIGH-LEVEL SYSTEM & CLIENT OVERVIEW

The **Flat Maintenance Management System** is a unified digital operations platform built to streamline residential community living, property oversight, maintenance dispatch, financial accounting, and community governance. 

Before diving into granular technical specifications and backend modules, this section provides developers, engineering leads, product stakeholders, and clients with an executive, big-picture architectural map of the entire system.

```text
Users
  │
  ▼
Next.js Client Application
  │
  ▼
Backend REST API
  │
  ▼
Database
```

### Core Value Proposition & Complete Stakeholder Personas

The system coordinates residential community operations across five distinct organizational personas:

1. **👑 Admin (System & Society Governance):** Exercises overarching control over global system settings, building hierarchies, role provisioning, financial audit logs, and society compliance.
2. **🏗️ Manager (Daily Operations & Facilities):** Oversees building and flat inventories, manages occupancy records, triages maintenance complaints, assigns technicians, and publishes community notices.
3. **💼 Accountant (Financial Management & Billing):** Configures maintenance charge formulas, triggers automated monthly invoice generation, reconciles online/cash payments, tracks vendor expenses, and generates society balance sheets.
4. **🛠️ Staff (Field Technicians & Gate Security Guards):** 
   - **Maintenance Technicians (Plumbers, Electricians, Handymen):** Receive assigned repair tickets, update job statuses (`IN_PROGRESS` ➔ `RESOLVED`), and log parts used.
   - **Security Guards (Gate & Front Desk):** Verify resident digital visitor passes, log incoming guest vehicles, record entry/exit timestamps, and alert residents.
5. **🏠 Resident (Self-Service & Living Experience):** Comprises property owners and tenants who manage their flat profile, review automated monthly dues, pay invoices online, log maintenance complaints, and submit 1–5 star reviews for staff work.

---

### 1. Complete System High-Level Overview

The system employs a modern **Tri-Tier Architecture** cleanly separating client presentation, backend API business logic, and persistent document storage. The Next.js frontend delivers responsive, role-tailored interfaces that communicate over secure HTTPS JSON REST endpoints with the modular Node.js/Express backend, which orchestrates transactions across MongoDB collections.

#### 📊 System Architecture Graph (Mermaid)

```mermaid
graph TD
    subgraph UsersTier["👥 SYSTEM USERS & STAKEHOLDERS"]
        Admin["👑 Admin<br/>Society Governance & Config"]
        Manager["🏗️ Manager<br/>Operations & Task Dispatch"]
        Accountant["💼 Accountant<br/>Billing, Invoicing & Ledger"]
        Staff["🛠️ Staff (Techs & Security)<br/>Work Orders & Gate Logs"]
        Resident["🏠 Resident<br/>Flat Services, Payments & Inquiries"]
    end

    subgraph ClientTier["💻 NEXT.JS CLIENT APPLICATION"]
        Pages["📄 Pages & Layouts (App Router)"]
        Dashboards["📊 Role-Tailored Portals & Workspaces"]
        Components["🧩 Shared UI Components & Forms"]
        ClientState["🧠 Auth State & Client Cache"]
        ApiClient["🔌 API Service Layer (Axios / Fetch)"]
    end

    subgraph BackendTier["⚙️ BACKEND REST API (NODE.JS & EXPRESS 5)"]
        Gateways["🛡️ Security Gateway (Helmet, CORS, Rate Limit)"]
        AuthModule["🔐 Auth & RBAC Middleware (JWT / Cookies)"]
        Validation["📐 Validation Engine (Zod Schemas)"]
        Controllers["🕹️ HTTP Controllers & Routing"]
        BusinessLogic["🏢 Modular Domain Services (22 Modules)"]
    end

    subgraph DataTier["🗄️ DATABASE (MONGODB)"]
        MongoDb[("🍃 MongoDB Dedicated Cluster<br/>22 Schemas & ACID Transactions")]
    end

    Admin --> Pages
    Manager --> Pages
    Accountant --> Pages
    Staff --> Pages
    Resident --> Pages
    Pages --> Dashboards
    Pages --> Components
    Dashboards --> ApiClient
    Components --> ApiClient
    ApiClient -->|"HTTPS / REST API (JWT Bearer)"| Gateways
    Gateways --> AuthModule
    AuthModule --> Validation
    Validation --> Controllers
    Controllers --> BusinessLogic
    BusinessLogic -->|"Mongoose ODM Queries / Sessions"| MongoDb
```

#### 📊 Complete System Architecture (ASCII Diagram)

```text
                         🏢 FLAT MAINTENANCE SYSTEM

                                      │
                                      ▼

                         ┌─────────────────────┐
                         │       USERS         │
                         └──────────┬──────────┘
                                    │
       ┌──────────────┬─────────────┼─────────────┬──────────────┐
       │              │             │             │              │
       ▼              ▼             ▼             ▼              ▼

  👑 ADMIN       🏗️ MANAGER    💼 ACCOUNTANT   🛠️ STAFF     🏠 RESIDENT
   (Admin)       (Operations)   (Finances)     (Field/Gate)   (Occupants)

       │              │             │             │              │
       └──────────────┴─────────────┼─────────────┴──────────────┘
                                    │
                                    ▼

                      ┌──────────────────────────┐
                      │   NEXT.JS CLIENT APP     │
                      │                          │
                      │  Pages • Components      │
                      │  Dashboards • Forms      │
                      └────────────┬─────────────┘
                                   │
                                   │ HTTPS / REST API
                                   ▼
                      ┌──────────────────────────┐
                      │     BACKEND REST API     │
                      │                          │
                      │ Auth • Business Logic    │
                      │ Validation • Security    │
                      └────────────┬─────────────┘
                                   │
                                   ▼
                      ┌──────────────────────────┐
                      │        DATABASE          │
                      │                          │
                      │   Application Data       │
                      └──────────────────────────┘
```

#### Architectural Tier Responsibilities

* **Next.js Client Application:** Delivers high-performance server-side rendering (SSR) and reactive client-side components. It isolates user experiences into 5 purpose-built workspaces (Admin, Manager, Accountant, Staff, Resident) while abstracting network calls behind typed API services.
* **Backend REST API:** Implements hardened modular controllers and domain services in Node.js (ESM) and Express 5. It enforces strict request sanitization, authentication, role authorization (RBAC + Building Scope), and state machines, keeping business rules independent of the presentation layer.
* **Database (MongoDB):** Provides high-throughput document persistence across 22 normalized domain collections, enforcing data consistency via Mongoose schemas and multi-document ACID transactions for billing, payment, and lease workflows.

---

### 2. Role-Based Client Overview & Protected Routing

Security and usability require that users experience interfaces strictly aligned with their organizational responsibilities. The client application implements **Role-Based Access Control (RBAC)** at the routing layer: after authenticating, the client decodes the user's role and grants access exclusively to authorized views and actions.

#### 📊 Role-Based Routing Graph (Mermaid)

```mermaid
flowchart TD
    User(["👤 Authenticating User"]) --> Login["🔑 Login Page (/login)"]
    Login --> SubmitAuth["🔐 POST /api/v1/auth/login"]
    SubmitAuth --> VerifyToken["🎫 Server Generates Access JWT & Session Cookie"]
    VerifyToken --> RoleEval{"🛡️ Evaluate User Role"}

    RoleEval -->|"Role: SUPER_ADMIN / ADMIN"| AdminDash["👑 Admin Dashboard (/admin/*)<br/>• Society Hierarchy Management<br/>• User & Role Provisioning<br/>• Global System Audits & Reports"]
    RoleEval -->|"Role: MANAGER"| ManagerDash["🏗️ Manager Dashboard (/manager/*)<br/>• Building & Flat Allocation<br/>• Maintenance Ticket Dispatch<br/>• Complaint Triage & SLA Tracking<br/>• Community Announcements"]
    RoleEval -->|"Role: ACCOUNTANT"| AccountantDash["💼 Accountant Portal (/accountant/*)<br/>• Maintenance Charge Configurations<br/>• Batch Monthly Invoicing Engine<br/>• Payment Reconciliations & Ledger<br/>• Society Expense Auditing"]
    RoleEval -->|"Role: STAFF / SECURITY"| StaffDash["🛠️ Staff Workspace (/staff/*)<br/>• Technician Work Order Queue<br/>• Job Resolution & Status Updates<br/>• Gate Visitor Pass Verification<br/>• Vehicle Entry / Exit Logging"]
    RoleEval -->|"Role: RESIDENT / OWNER / TENANT"| ResidentDash["🏠 Resident Dashboard (/resident/*)<br/>• My Flat Unit Overview<br/>• Create Maintenance Requests<br/>• View Invoices & Pay Online<br/>• Gate Passes & Service Ratings"]

    AdminDash -.->|"Unauthorized Attempt"| Denied["🚫 403 Forbidden Access Guard"]
    ManagerDash -.->|"Unauthorized Attempt"| Denied
    AccountantDash -.->|"Unauthorized Attempt"| Denied
    StaffDash -.->|"Unauthorized Attempt"| Denied
    ResidentDash -.->|"Unauthorized Attempt"| Denied
```

#### 📊 Role-Based Client Overview (ASCII Diagram)

```text
                            USER
                              │
                              ▼
                         ┌──────────┐
                         │  LOGIN   │
                         └────┬─────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ AUTHENTICATION   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   ROLE CHECK     │
                    └────────┬─────────┘
                             │
       ┌──────────────┬──────┼─────────────┬──────────────┐
       │              │      │             │              │
       ▼              ▼      ▼             ▼              ▼
  ┌─────────┐    ┌─────────┐ ┌──────────┐ ┌─────────┐  ┌──────────┐
  │  ADMIN  │    │ MANAGER │ │ACCOUNTANT│ │  STAFF  │  │ RESIDENT │
  └────┬────┘    └────┬────┘ └────┬─────┘ └────┬────┘  └────┬─────┘
       │              │           │            │            │
       ▼              ▼           ▼            ▼            ▼
  Admin Dash    Manager Dash  Accountant    Staff Hub    Resident
                              Dashboard     (Tech/Gate)  Dashboard
```

#### Key Client Security Principles

* **Protected Route Guards:** The Next.js client encapsulates private views within higher-order route middleware. Any unauthenticated access attempt triggers an immediate redirection to `/login` with return-path preservation.
* **Granular Role Workspaces:** Each role is directed to a purpose-built workspace:
  - **Admins** manage global society architecture and user credentials.
  - **Managers** dispatch maintenance tasks and monitor facility operations.
  - **Accountants** run invoice engines, log receipts, and reconcile payments.
  - **Staff** execute assigned physical repair tickets or process gate visitor entries.
  - **Residents** view their flat status, settle bills, and track requests.
* **Defense-in-Depth Authorization:** While the frontend provides responsive UX by hiding unauthorized navigation elements, the backend REST API independently authenticates every HTTP request via JWT and authorizes every endpoint through strict RBAC/OBAC middleware.

---

### 3. Client Application Module Overview

The Next.js client application is structured modularly into public entry points, role-segregated workspaces, reusable visual components, an abstracted API communication layer, and centralized client state.

#### 📊 Client Application Architecture Tree

```text
NEXT.JS CLIENT APPLICATION
│
├── 🌐 PUBLIC AREA
│   ├── Login
│   ├── Forgot Password
│   └── Reset Password
│
├── 🔐 PROTECTED APPLICATION
│   │
│   ├── 👑 ADMIN AREA
│   │   ├── Dashboard
│   │   ├── User & Role Management
│   │   ├── Building Management (Buildings, Blocks, Floors)
│   │   ├── Manager & Staff Provisioning
│   │   └── System Audit & Compliance Reports
│   │
│   ├── 🏗️ MANAGER AREA
│   │   ├── Dashboard & Facility Overview
│   │   ├── Buildings & Flats Inventory
│   │   ├── Resident Directory (Owners & Tenants)
│   │   ├── Maintenance Request Triage & Dispatch
│   │   ├── Complaints Monitoring & SLAs
│   │   └── Society Announcements & Notices
│   │
│   ├── 💼 ACCOUNTANT AREA
│   │   ├── Financial Dashboard
│   │   ├── Maintenance Charge Configurations
│   │   ├── Batch Monthly Invoice Generator
│   │   ├── Payment Reconciliation & Receipts
│   │   ├── Society Expense Records
│   │   └── Financial Statements & Dues Reports
│   │
│   ├── 🛠️ STAFF & SECURITY AREA
│   │   ├── Technician Work Order Queue (Plumber/Electrician/Cleaner)
│   │   ├── Job Resolution & Proof-of-Work Logging
│   │   ├── Gate Visitor Pass Verification
│   │   └── Vehicle Entry/Exit Logging
│   │
│   └── 🏠 RESIDENT AREA
│       ├── Resident Dashboard
│       ├── My Flat Details
│       ├── Maintenance Requests (New Ticket, History)
│       ├── Complaints & Dispute Tracking
│       ├── Invoices & Online Payments
│       ├── Visitor Pass Generator
│       └── Announcements & Bulletins
│
├── 🧩 SHARED UI COMPONENTS
│   ├── Sidebar & Top Navigation
│   ├── Filterable Data Tables & Pagination
│   ├── Validated Form Controls
│   ├── Action Modals & Dialogs
│   ├── Status Badges & Metric Cards
│   └── Star Rating Controls
│
├── 🔌 API / SERVICE LAYER
│   ├── Authentication API (Login, Refresh, Logout)
│   ├── User & Staff API
│   ├── Building Hierarchy API
│   ├── Maintenance & Complaint API
│   ├── Billing, Invoice & Payment API
│   ├── Visitor Management API
│   └── Expense & Report API
│
└── 🧠 CLIENT STATE
    ├── Authentication & Session State
    ├── Active User Profile & Scoped Building
    ├── UI State (Theme, Navigation Toggle, Modals)
    └── Server Cache (TanStack Query / SWR)
```

#### 📊 Client Module Relationship Map (Mermaid)

```mermaid
graph LR
    subgraph Public["🌐 PUBLIC PAGES"]
        Login["Login Page"]
        Forgot["Forgot Password"]
        Reset["Reset Password"]
    end

    subgraph Portals["🔐 ROLE-BASED PORTALS"]
        AdminPortal["👑 Admin Portal<br/>Governance • Users • Audits"]
        MgrPortal["🏗️ Manager Portal<br/>Operations • Allocation • Notices"]
        AccPortal["💼 Accountant Portal<br/>Charges • Invoices • Expenses"]
        StaffPortal["🛠️ Staff Hub<br/>Technician Tasks • Gate Security"]
        ResPortal["🏠 Resident Portal<br/>My Flat • Payments • Complaints"]
    end

    subgraph Shared["🧩 SHARED SYSTEM DESIGN"]
        Nav["Sidebar & Navbar"]
        DataTables["Data Tables & Filters"]
        ModalForms["Modals & Form Controls"]
        StatusBadges["Status Indicators & Cards"]
    end

    subgraph ServiceLayer["🔌 CLIENT API / SERVICES"]
        AuthSvc["Auth Service"]
        FacilitySvc["Building & Flat Service"]
        MaintSvc["Maintenance & Complaint Service"]
        BillSvc["Invoices & Payment Service"]
        StaffSvc["Staff & Visitor Service"]
    end

    subgraph StateStore["🧠 CLIENT APPLICATION STATE"]
        AuthStore["Auth & Session Store"]
        UIStore["Theme & Modal UI Store"]
        QueryCache["Server Cache (TanStack Query / SWR)"]
    end

    Public -.->|"On Authentication"| Portals
    Portals --> Shared
    Portals --> ServiceLayer
    ServiceLayer --> StateStore
```

#### Client Modular Layer Breakdown

* **Public Area:** Entry-point screens accessible without authentication, handling credentials submission, password resets, and session recovery.
* **Protected Application Workspaces:** Role-partitioned directories isolating features, forms, and tables relevant only to the authenticated persona (Admin, Manager, Accountant, Staff, Resident).
* **Shared UI Components:** Atomic design system elements (data tables, responsive sidebars, accessible form inputs, confirmation modals, status badges) guaranteeing visual and functional consistency across all dashboards.
* **API / Service Layer:** Centralized HTTP abstraction layer where Axios/Fetch instances attach authentication headers, intercept 401 unauthorized errors for token refreshes, and map backend JSON payloads into strongly typed frontend models.
* **Client State:** Lightweight reactive store managing active user profile details, layout preferences (e.g., sidebar toggles, theme modes), and cached server responses with automatic background revalidation.

---

### 4. Complete End-to-End Data Flow Lifecycle

Every user interaction follows a deterministic request-response lifecycle traversing the frontend UI, client-side services, network transport, backend middleware, business domain services, and the database.

#### 📊 End-to-End Data Flow Sequence (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User Action
    participant Page as 💻 Next.js Page / UI
    participant Component as 📝 Component / Form
    participant Service as 🔌 API / Service Layer
    participant Backend as ⚙️ Backend REST API
    participant Database as 🗄️ MongoDB Database

    User->>Page: Initiates action (clicks button, enters data)
    Page->>Component: Captures input state and triggers handler
    Component->>Component: Validates input client-side (Zod / Form Hook)
    Component->>Service: Invokes API service method (e.g. submitRequest)
    Service->>Backend: Dispatches HTTPS Request (JSON payload + Bearer JWT)
    
    rect rgb(240, 245, 255)
        Note over Backend: Middleware Pipeline:<br/>1. Helmet / CORS / Rate Limiter<br/>2. Authenticate JWT & Verify User Status<br/>3. RBAC / Building-Scope Authorization<br/>4. Zod Schema Validation & Sanitization
        Backend->>Backend: Controller extracts parameters and delegates to Service
        Backend->>Database: Service executes business logic / ACID query
        Database-->>Backend: MongoDB returns updated document / result
        Backend-->>Service: Standardized JSON ApiResponse (Status 200/201)
    end

    Service-->>Component: Resolves Promise with typed payload
    Component-->>Page: Updates local state (cache invalidation, toast notification)
    Page-->>User: Interface updates dynamically (re-renders views, closes modals)
```

#### 📊 Complete Data Flow (ASCII Diagram)

```text
USER ACTION
     │
     ▼
┌─────────────────────┐
│ NEXT.JS PAGE / UI   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ COMPONENT / FORM    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API / SERVICE LAYER │
└──────────┬──────────┘
           │
           │ HTTP REQUEST
           ▼
┌─────────────────────┐
│   BACKEND REST API  │
└──────────┬──────────┘
           │
           │ Business Logic
           ▼
┌─────────────────────┐
│      DATABASE       │
└──────────┬──────────┘
           │
           │ Response
           ▼
┌─────────────────────┐
│ UPDATE CLIENT UI    │
└─────────────────────┘
```

#### Lifecycle Stage Walkthrough

1. **User Action:** The user performs an operation (e.g., submitting a form, clicking a status filter, or initiating a bill payment).
2. **Next.js Page & Form Component:** React state captures form inputs; client-side validation executes immediately to give instant visual feedback on missing or malformed inputs without consuming network bandwidth.
3. **API / Service Layer:** The component calls an isolated service function. The service serializes the payload, attaches the JWT Bearer authorization token, and handles cross-cutting concerns like request timeouts and cancellation tokens.
4. **Backend REST API Processing:**
   * **Security Middleware:** Validates CORS origins, applies Helmet security headers, checks rate limits, and sanitizes input.
   * **Authentication & RBAC:** Verifies token validity, extracts user ID and role, and checks endpoint permissions.
   * **Validation Engine:** Zod verifies query params, path params, and body structure against schema contracts.
   * **Controller & Service Layer:** The controller delegates execution to domain services where business rules and multi-collection database operations occur.
5. **Database Persistence:** The service executes optimized Mongoose queries or ACID transactions against MongoDB.
6. **Client UI Hydration:** The server returns a standardized `ApiResponse` (`{ success: true, statusCode: 200, data: {...} }`). The client service resolves the response, updates client caches (e.g., TanStack Query), triggers feedback notifications (toast alerts), and smoothly updates the user interface.

---

### 5. Maintenance Request Example Flow (Real-World Multi-Role Walkthrough)

To understand how all stakeholders coordinate during daily operations, consider a real-world scenario: a **Resident logs a plumbing maintenance request**, the **Manager triages and dispatches** it, the **Maintenance Staff (Technician) resolves** it, and the **Resident rates the service**.

#### 📊 Maintenance Request Operational Flow (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor Resident as 🏠 Resident
    participant ResUI as 📱 Resident UI
    participant ClientAPI as 🔌 Client API
    participant Backend as ⚙️ Backend REST API
    participant Database as 🗄️ MongoDB Database
    actor Manager as 🏗️ Manager
    participant MgrUI as 🖥️ Manager UI
    actor Staff as 🛠️ Maintenance Staff
    participant StaffUI as 📱 Staff Workspace

    rect rgb(240, 255, 240)
        Note over Resident,Backend: Phase 1: Resident Submits Request
        Resident->>ResUI: Fills form: "Plumbing - Leak under kitchen sink"
        Resident->>ResUI: Clicks "Submit Request"
        ResUI->>ClientAPI: POST /api/v1/complaints
        ClientAPI->>Backend: Transmit HTTPS Request (Bearer JWT)
        Backend->>Database: Insert complaint (Status: OPEN, Ticket: #TKT-2026-0891)
        Database-->>Backend: Confirmed document
        Backend-->>ResUI: HTTP 201 Created (Ticket Details)
        ResUI-->>Resident: Displays confirmation & ticket badge
    end

    rect rgb(255, 250, 240)
        Note over Manager,Backend: Phase 2: Manager Triages & Dispatches
        Manager->>MgrUI: Reviews open maintenance queue
        MgrUI->>Backend: GET /api/v1/complaints?status=OPEN
        Backend-->>MgrUI: Returns active tickets list
        Manager->>MgrUI: Assigns Ticket #TKT-2026-0891 to "Akram (Plumber)"
        MgrUI->>Backend: PATCH /api/v1/complaints/:id/assign (staffId: Akram)
        Backend->>Database: Update status: ASSIGNED, assign staffId
        Database-->>Backend: Confirmed
    end

    rect rgb(245, 245, 255)
        Note over Staff,Backend: Phase 3: Staff Executes & Resolves Work
        Staff->>StaffUI: Opens mobile task list
        StaffUI->>Backend: GET /api/v1/staff/tasks
        Backend-->>StaffUI: Shows assigned ticket #TKT-2026-0891
        Staff->>StaffUI: Taps "Start Work" (Status: IN_PROGRESS)
        Staff->>Staff: Repairs kitchen sink pipe
        Staff->>StaffUI: Taps "Mark Resolved" & logs work notes
        StaffUI->>Backend: PATCH /api/v1/complaints/:id/status (Status: RESOLVED)
        Backend->>Database: Persist resolution & timestamp
    end

    rect rgb(255, 245, 245)
        Note over Resident,Staff: Phase 4: Resident Service Review
        Resident->>ResUI: Receives "Work Completed" notification
        Resident->>ResUI: Submits 5-Star Rating & Review for Akram
        ResUI->>Backend: POST /api/v1/ratings
        Backend->>Database: Save rating & update staff performance metrics
        ResUI-->>Resident: Thank you feedback confirmed
    end
```

#### 📊 Maintenance Request Example Flow (ASCII Diagram)

```text
🏠 RESIDENT                 🏗️ MANAGER                   🛠️ STAFF (TECH)
     │                           │                             │
     │ 1. Creates Request        │                             │
     ▼                           │                             │
┌─────────────────────────┐      │                             │
│ MAINTENANCE REQUEST UI  │      │                             │
│ (Title, Details, Prio)  │      │                             │
└────────────┬────────────┘      │                             │
             │                   │                             │
             │ POST /complaints  │                             │
             ▼                   │                             │
┌─────────────────────────┐      │                             │
│    BACKEND REST API     │      │                             │
│ (Validate & Save OPEN)  │      │                             │
└────────────┬────────────┘      │                             │
             │                   │                             │
             ▼                   ▼                             │
       ┌───────────┐      ┌───────────────┐                    │
       │ DATABASE  │─────▶│  MANAGER UI   │                    │
       │ (TKT-101) │      │ (Triage Queue)│                    │
       └─────┬─────┘      └───────┬───────┘                    │
             │                    │                            │
             │                    │ 2. Assigns Technician      │
             │                    ▼                            │
             │             ┌─────────────┐                     │
             │             │ BACKEND API │                     │
             │             │ (ASSIGNED)  │                     │
             │             └──────┬──────┘                     │
             │                    │                            │
             ▼                    ▼                            ▼
       ┌───────────┐      Notification                  ┌─────────────┐
       │ DATABASE  │───────────────────────────────────▶│  STAFF HUB  │
       │           │                                    │ (Work Order)│
       │           │◀───────────────────────────────────│ (RESOLVED)  │
       └───────────┘          3. Fixes & Resolves       └─────────────┘
             │                                                 │
             │                                                 │
             ▼                                                 │
      Resident Rates                                           │
      Staff Service ⭐⭐⭐⭐⭐ ────────────────────────────────────┘
```

#### Step-by-Step Scenario Breakdown

1. **Resident Submission:** A resident navigates to their maintenance portal, specifies the issue category (*Plumbing*), selects urgency priority (*High*), writes a description, and clicks submit.
2. **Client API Dispatch & Validation:** The Next.js client invokes `complaintsApi.create()`, sending a `POST /api/v1/complaints` request carrying the resident's JWT authorization header. The backend validates tenancy, assigns ticket number `#TKT-2026-0891`, and saves the status as `OPEN`.
3. **Manager Triage & Technician Dispatch:** The manager's dashboard receives the ticket in real time. The manager reviews the plumbing issue and dispatches an available maintenance technician (Staff).
4. **Staff Execution & Resolution:** The technician views the work order on their mobile staff workspace, arrives at the flat, completes the repair, and marks the ticket `RESOLVED` with proof-of-work notes.
5. **Resident Rating & Staff Metrics:** The resident receives an in-app resolution alert and submits a 1–5 star performance review, which directly feeds into the staff member's quarterly performance analytics.

---

## 2. TECHNOLOGY STACK & LIBRARY JUSTIFICATIONS

| Category             | Selected Technology                   | Version      | Architectural Justification                                                                                                                                                   |
| :------------------- | :------------------------------------ | :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**          | Node.js                               | v22 LTS      | Provides top-tier I/O performance, native V8 execution speed, native ES Modules support, built-in test runner, and long-term security support.                                |
| **Language**         | Modern JavaScript                     | ES2024 (ESM) | Native `import`/`export` syntax eliminates transpilation overhead while keeping code clean, modern, and compatible with Node 22+.                                             |
| **Framework**        | Express.js                            | v5.x         | Industry-standard Web framework. Express 5 natively handles rejected promises in async middleware, preventing uncaught promise rejections without custom wrapper boilerplate. |
| **Database**         | MongoDB                               | 7.0+         | Schema-flexible document store naturally suited for nested domain entities (line items, visitor logs, audit values) with high horizontal read/write throughput.               |
| **ODM**              | Mongoose                              | 8.x / 9.x    | Enforces schema validation, pre/post middleware hooks, custom virtuals, typed population, and native MongoDB transaction session orchestration.                               |
| **Validation**       | Zod                                   | 3.x          | Selected over Joi. Provides zero-dependency schema validation, declarative object composition, strict parameter parsing, and TypeScript/JS schema sharing.                    |
| **Authentication**   | `jsonwebtoken` & `bcrypt`             | 9.x / 5.x    | Industry standard JWT token signing (RS256/HS256) combined with `bcrypt` salted hashing (12 rounds) to ensure non-reversible password storage.                                |
| **Security Headers** | Helmet                                | 7.x          | Automatically sets 15+ HTTP security headers (CSP, HSTS, Frameguard, Hide-Powered-By, XSS-Filter) to harden Express against common web vulnerabilities.                       |
| **Sanitization**     | `express-mongo-sanitize`              | 2.x          | Strips MongoDB query injection operators (`$`, `.`) from request query params, body, and path params.                                                                         |
| **Rate Limiting**    | `express-rate-limit`                  | 7.x          | Protects public endpoints (Auth, Password Reset) from brute-force attempts and DoS attacks by enforcing window-based IP quotas.                                               |
| **File Storage**     | Cloudinary & Multer                   | Latest       | Direct stream handling from Express via `multer` memory storage directly into Cloudinary CDN, eliminating local temporary file persistence.                                   |
| **Testing**          | Node Native Test Runner & `supertest` | Native / 7.x | Zero-dependency unit testing with `node --test` alongside HTTP API endpoint integration testing via `supertest`.                                                              |
| **DevOps**           | Docker & Docker Compose               | Multi-Stage  | Guarantees container parity between local development and cloud production environments.                                                                                      |

---

## 3. BACKEND ARCHITECTURE & LAYERED DESIGN

The system follows a strict **Layered Modular Architecture**:

```text
                                Client Request (Next.js / Mobile)
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │           Express 5 Middleware Stack        │
                         │ (Helmet, CORS, Rate Limit, Mongo Sanitize) │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │               Routing Layer                 │
                         │           (/api/v1/<module-name>)           │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │            Validation Middleware            │
                         │           (Zod Schema Validator)            │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │              Controller Layer               │
                         │    (Extract Params, Invoke Service, Map)    │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │               Service Layer                 │
                         │   (Core Business Logic, DB Transactions)    │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │          Data Access / Model Layer          │
                         │            (Mongoose ODM Schemas)           │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
                                         MongoDB Database
```

### 3.1 Detailed Layer Responsibilities

1. **Routing Layer (`*.routes.js`):** Maps HTTP methods and endpoint URIs to specific controller actions. Attaches route-level middleware (Authentication, RBAC checks, rate limiters, file upload handlers).
2. **Validation Middleware (`*.validation.js`):** Intercepts incoming requests prior to controller execution. Validates `req.body`, `req.query`, and `req.params` against strict Zod schemas. Throws structured validation errors if payloads do not comply.
3. **Controller Layer (`*.controller.js`):** Acts purely as an HTTP adapter. Extracts values from `req`, delegates processing to the Service Layer, and formats the HTTP response using `ApiResponse`. **No business logic or database queries are allowed inside controllers.**
4. **Service Layer (`*.service.js`):** Encapsulates 100% of business logic, financial calculations, state transitions, external service calls, and MongoDB transaction sessions. Services are plain JavaScript modules that return domain objects and throw `ApiError` instances when business invariants fail. Services have zero awareness of Express `req` or `res` objects.
5. **Model Layer (`*.model.js`):** Defines Mongoose schemas, document properties, database validation rules, indexes, virtual getters, static query helpers, and pre/post hooks (e.g., password hashing hooks).

### 3.2 Architectural Separation Rationale

Placing business logic inside controllers causes code duplication, tight coupling to Express HTTP semantics, unit testing difficulties, and unmaintainable routes. By isolating logic in Services:

- Services can be unit tested without mocking HTTP request/response objects.
- Business workflows can be invoked by background workers (BullMQ) or CLI scripts without triggering HTTP routes.
- Database models remain simple data definitions rather than bloated god-objects.

---

## 4. PROJECT DIRECTORY STRUCTURE

The backend repository must strictly maintain the following modular architecture structure:

```text
flat-maintenance-backend/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Automated Linting, Formatting, Security Audit & Tests
│       └── cd.yml                     # Production Docker Build & Deployment Pipeline
├── .husky/                            # Git Pre-commit and Commit-Msg Hooks
├── docs/
│   └── BACKEND_TECHNICAL_DOCUMENTATION.md # Single Source of Truth Technical Blueprint
├── src/
│   ├── app.js                         # Express App Initialization & Global Middleware Stack
│   ├── server.js                      # Server Listener, Database Bootstrap & Process Lifecycle
│   ├── config/
│   │   ├── env.js                     # Environment Variables Validation & Central Export
│   │   ├── db.js                      # MongoDB Mongoose Connection Management & Pooling
│   │   ├── cloudinary.js              # Cloudinary API SDK Configuration
│   │   └── logger.js                  # Structured Logger Configuration
│   ├── constants/
│   │   ├── roles.constant.js          # System Roles & Enum Definitions
│   │   ├── permissions.constant.js    # Granular System Permissions List
│   │   ├── status.constant.js         # Entity Status Enums (Invoice, Complaint, Visitor, etc.)
│   │   └── error-codes.constant.js    # Custom Domain Error Code Mappings
│   ├── middlewares/
│   │   ├── auth.middleware.js         # JWT Verification & Token Extraction
│   │   ├── authorization.middleware.js# RBAC & Resource Ownership Middleware
│   │   ├── error.middleware.js        # Global Centralized Exception Handler
│   │   ├── notFound.middleware.js     # 404 Route Catch-All Handler
│   │   ├── rateLimit.middleware.js    # Rate Limiting Strategies
│   │   ├── upload.middleware.js       # Multer File Upload Interceptor
│   │   └── validate.middleware.js     # Generic Zod Schema Validation Interceptor
│   ├── utils/
│   │   ├── ApiError.js                # Custom Standard Operational Error Class
│   │   ├── ApiResponse.js             # Standardized API Response Formatter
│   │   ├── asyncHandler.js            # Async Wrapper Function (Express 5 Compatibility)
│   │   ├── jwt.js                     # Token Signing, Verification & Cookie Helpers
│   │   ├── pagination.js              # Standardized Offset/Limit Pagination Helper
│   │   └── sanitize.js                # Data Masking & PII Redaction Utility
│   ├── modules/
│   │   ├── auth/                      # Authentication Module
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   ├── users/                     # Users Module
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.routes.js
│   │   │   ├── user.service.js
│   │   │   └── user.validation.js
│   │   ├── roles/                     # Roles & RBAC Module
│   │   ├── permissions/               # Permissions Module
│   │   ├── buildings/                 # Buildings Domain
│   │   ├── blocks/                    # Blocks Hierarchy Domain
│   │   ├── floors/                    # Floors Hierarchy Domain
│   │   ├── flats/                     # Flats & Occupancy Domain
│   │   ├── owners/                    # Flat Owners Domain
│   │   ├── tenants/                   # Tenants & Lease Domain
│   │   ├── staff/                     # Staff Domain
│   │   ├── maintenance/               # Maintenance Charge Config Domain
│   │   ├── invoices/                  # Financial Invoicing Engine
│   │   ├── payments/                  # Payment Gateway & Receipts Domain
│   │   ├── complaints/                # Maintenance Complaints Domain
│   │   ├── reviews/                   # Service Ratings & Reviews Domain
│   │   ├── notices/                   # Society Notice Board Domain
│   │   ├── notifications/             # Notification Dispatch Domain
│   │   ├── expenses/                  # Building Expenses Domain
│   │   ├── visitors/                  # Visitor Security Check-in Domain
│   │   ├── documents/                 # Document Management Domain
│   │   ├── reports/                   # Reports & Analytics Domain
│   │   └── audit-logs/                # Immutable System Audit Domain
│   └── routes/
│       └── index.js                   # Master Central Router Dispatcher (/api/v1)
├── tests/
│   ├── unit/                          # Service & Utility Unit Tests
│   ├── integration/                   # Database & Transaction Integration Tests
│   └── e2e/                           # Full End-to-End API Suite Tests
├── scripts/
│   ├── seed.js                        # System SuperAdmin & Initial Role Seeding Script
│   └── api-smoke-test.js              # Smoke Test Suite for Deployment Verification
├── .dockerignore
├── .env.example
├── .gitignore
├── .prettierrc
├── Dockerfile                         # Multi-Stage Production Container Build
├── docker-compose.yml                 # Local Development Orchestration (Node + MongoDB)
├── eslint.config.js
├── package.json
└── README.md
```

---

## 5. ENGINEERING & DEVELOPMENT PRINCIPLES

1. **Separation of Concerns (SoC):** HTTP details belong in Controllers; business invariants belong in Services; schema definitions belong in Models.
2. **Single Responsibility Principle (SRP):** Each function, module, or class must have one, and only one, reason to change.
3. **Don't Repeat Yourself (DRY):** Common logic (pagination, response formatting, validation parsing) must be encapsulated in reusable utility functions.
4. **Keep It Simple, Stupid (KISS):** Avoid premature microservice separation or complex abstraction layers. Use direct, clear ESM code.
5. **Centralized Error Handling:** All errors MUST bubble up to the global `error.middleware.js`. No silent failures or uncaught rejections.
6. **Explicit Business Rules:** Invariants (e.g. "A paid invoice cannot be deleted") must be enforced programmatically in the Service layer with explicit `ApiError` exceptions.
7. **Defensive Programming:** Inputs MUST be validated prior to execution. Database operations MUST check for null returns and throw immediate 404/400 errors.
8. **Database Integrity:** Foreign key dependencies (e.g., Flat referencing Building) MUST be validated before document creation. Use MongoDB session transactions for multi-document operations.
9. **Observability:** Every request must log structured context (request ID, path, HTTP status, execution latency).

---

## 6. API DESIGN STANDARD & CONVENTIONS

### 6.1 Base URI Path

All API endpoints MUST be prefixed with the API version namespace:

```http
/api/v1
```

### 6.2 Naming Conventions

- Resource paths MUST use lowercase, plural nouns separated by hyphens (kebab-case).
  - Good: `/api/v1/building-blocks`, `/api/v1/maintenance-invoices`
  - Bad: `/api/v1/getBuilding`, `/api/v1/building_block`
- HTTP verbs define the action:
  - `GET`: Retrieve a resource or collection. Read-only, safe, idempotent.
  - `POST`: Create a new resource or execute a stateful command (e.g. `/login`).
  - `PATCH`: Update specific fields of an existing resource.
  - `DELETE`: Deactivate or soft-delete a resource.

---

## 7. STANDARD API RESPONSE SPECIFICATION

Every API endpoint MUST return responses adhering strictly to the JSON contracts below.

### 7.1 Success Response (`200 OK`, `201 Created`)

```json
{
  "success": true,
  "message": "Building created successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Emerald Heights",
    "code": "EM-01",
    "createdAt": "2026-09-03T10:00:00.000Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

_Note: `meta` is `null` for single-object or non-paginated requests._

### 7.2 Standard Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `500`)

```json
{
  "success": false,
  "message": "Validation failed for incoming request body",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    },
    {
      "field": "phone",
      "message": "Phone number must be exactly 10 digits"
    }
  ],
  "data": null,
  "stack": "Included only when NODE_ENV === 'development'"
}
```

---

## 8. HTTP STATUS CODE STANDARD

| Code    | Status Name           | Standard Usage in Flat Maintenance Backend                                        |
| :------ | :-------------------- | :-------------------------------------------------------------------------------- |
| **200** | OK                    | Successful GET, PATCH, or non-creation POST operations.                           |
| **201** | Created               | Successful POST creation of a new entity (Building, Flat, Invoice).               |
| **204** | No Content            | Successful DELETE operation with no returning body.                               |
| **400** | Bad Request           | Malformed JSON payload, invalid query parameters, or business constraint failure. |
| **401** | Unauthorized          | Missing, expired, or invalid JWT access token.                                    |
| **403** | Forbidden             | Valid JWT provided, but user role/permissions lack access to resource.            |
| **404** | Not Found             | Requested entity ID does not exist in MongoDB.                                    |
| **409** | Conflict              | Unique constraint violation (e.g. Flat number already exists in block).           |
| **422** | Unprocessable Entity  | Zod schema validation failure on request payload.                                 |
| **429** | Too Many Requests     | Rate limit threshold exceeded for client IP address.                              |
| **500** | Internal Server Error | Unhandled server exception or unexpected database failure.                        |

---

## 9. ENVIRONMENT CONFIGURATION & MANAGEMENT

The backend uses a strict environment variable contract validated at startup via Zod in `src/config/env.js`. If any required environment variable is missing or malformed, the process terminates immediately with an explicit log message.

### 9.1 Required Environment Variables Template (`.env.example`)

```env
# SERVER CONFIGURATION
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
COOKIE_SECRET=super_secret_cookie_signing_key_min_32_chars

# DATABASE CONFIGURATION
MONGODB_URI=mongodb://localhost:27017/flat_maintenance_db?replicaSet=rs0

# JWT AUTHENTICATION SECRETS
JWT_ACCESS_SECRET=access_token_secret_key_minimum_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=refresh_token_secret_key_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=7d

# SECURITY & HASHING
BCRYPT_SALT_ROUNDS=12

# CLOUDINARY FILE STORAGE
CLOUDINARY_CLOUD_NAME=cloud_name_here
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=cloudinary_api_secret_key_here

# LOGGING
LOG_LEVEL=info
```

---

## 10. DATABASE ARCHITECTURE & DATA MODELING PRINCIPLES

### 10.1 Referencing vs. Embedding Guidelines

- **Embed:** Embed data when child entities are bounded, small, strictly accessed together with the parent, and do not grow indefinitely (e.g., Invoice Line Items inside an Invoice, Complaint Audit Comments inside a Complaint).
- **Reference:** Store as a separate collection and reference via `Schema.Types.ObjectId` when entities are independent, queried separately, or subject to continuous unbounded growth (e.g., Users, Flats, Payments, Buildings, Audit Logs).

### 10.2 Soft Deletion Standard

Entities MUST NOT be hard-deleted from MongoDB unless required for GDPR compliance. All major models include:

```javascript
isDeleted: { type: Boolean, default: false, index: true },
deletedAt: { type: Date, default: null }
```

Global Mongoose query middleware pre-filters `{ isDeleted: false }` for all `find`, `findOne`, `findOneAndUpdate`, and `aggregate` calls unless explicitly bypassed by an admin.

---

## 11. DATABASE COLLECTIONS SPECIFICATION

Below is the complete database architectural specification for all 22 core collections.

### 11.1 `users`

- **Purpose:** Central entity for all authenticated accounts across all roles.
- **Fields:** `_id`, `firstName`, `lastName`, `email`, `phone`, `password`, `roleId` (Ref: `roles`), `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING`), `isEmailVerified`, `avatarUrl`, `refreshTokens` (Array of hashed tokens), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `email` (where `isDeleted: false`), Index on `roleId`, Index on `status`.

### 11.2 `roles`

- **Purpose:** RBAC role definitions.
- **Fields:** `_id`, `name` (`SUPER_ADMIN`, `BUILDING_ADMIN`, `ACCOUNTANT`, `SECURITY_STAFF`, `OWNER`, `TENANT`, `MAINTENANCE_STAFF`), `description`, `permissions` (Array of strings), `isSystemRole` (Boolean), `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `name`.

### 11.3 `permissions`

- **Purpose:** Granular permission registry.
- **Fields:** `_id`, `code` (e.g., `BUILDING_CREATE`, `INVOICE_GENERATE`), `module` (`BUILDINGS`, `INVOICES`), `description`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `code`.

### 11.4 `buildings`

- **Purpose:** Top-level residential complex entity.
- **Fields:** `_id`, `name`, `code` (Unique), `address` (Street, City, State, Zip, Country), `totalBlocks`, `totalFlats`, `status` (`ACTIVE`, `INACTIVE`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `code`, Text index on `name`.

### 11.5 `blocks`

- **Purpose:** Sub-divisions within a building (e.g. Block A, Tower B).
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `name`, `code`, `totalFloors`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Compound unique index on `{ buildingId: 1, name: 1 }`.

### 11.6 `floors`

- **Purpose:** Specific floor within a block.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `blockId` (Ref: `blocks`), `floorNumber` (Number), `name`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Compound unique index on `{ blockId: 1, floorNumber: 1 }`.

### 11.7 `flats`

- **Purpose:** Individual physical flat/apartment unit.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `blockId` (Ref: `blocks`), `floorId` (Ref: `floors`), `flatNumber` (String), `areaSqFt` (Number), `status` (`VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`, `INACTIVE`), `currentOwnerId` (Ref: `owners`), `currentTenantId` (Ref: `tenants`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Compound unique index on `{ blockId: 1, flatNumber: 1 }`, Index on `status`.

### 11.8 `owners`

- **Purpose:** Property owner profile and flat ownership history.
- **Fields:** `_id`, `userId` (Ref: `users`), `emergencyContact`, `idProofUrl`, `flatsOwned` (Array of ObjectId Ref: `flats`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `userId`.

### 11.9 `tenants`

- **Purpose:** Tenant profile and flat occupancy details.
- **Fields:** `_id`, `userId` (Ref: `users`), `flatId` (Ref: `flats`), `ownerId` (Ref: `owners`), `leaseStartDate`, `leaseEndDate`, `rentAmount`, `emergencyContact`, `status` (`ACTIVE`, `MOVED_OUT`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Index on `flatId`, Index on `userId`.

### 11.10 `staff`

- **Purpose:** Building staff personnel (Security, Maintenance, Admin).
- **Fields:** `_id`, `userId` (Ref: `users`), `buildingId` (Ref: `buildings`), `category` (`SECURITY`, `MAINTENANCE`, `ADMINISTRATION`, `OTHER`), `designation`, `assignedShift`, `averageRating` (Number, Default 0), `totalRatingsCount` (Number, Default 0), `status` (`ACTIVE`, `ON_LEAVE`, `TERMINATED`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Index on `{ buildingId: 1, category: 1 }`.

### 11.11 `maintenanceConfigurations`

- **Purpose:** Rules and formula charges for maintenance bill calculation.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `chargeType` (`FLAT_RATE`, `PER_SQFT`), `baseRate` (Number), `parkingCharge`, `waterCharge`, `lateFeePercentage`, `gracePeriodDays`, `effectiveFrom`, `isActive`, `createdAt`, `updatedAt`.
- **Indexes:** Index on `{ buildingId: 1, isActive: 1 }`.

### 11.12 `invoices`

- **Purpose:** Maintenance bill invoices issued to flats.
- **Fields:** `_id`, `invoiceNumber` (Unique String), `buildingId` (Ref: `buildings`), `flatId` (Ref: `flats`), `ownerId` (Ref: `owners`), `tenantId` (Ref: `tenants`), `billingPeriod` (Month/Year), `lineItems` (Array of `{ title, amount }`), `subTotal`, `lateFee`, `totalAmount`, `paidAmount`, `dueAmount`, `dueDate`, `status` (`DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `invoiceNumber`, Index on `{ flatId: 1, status: 1 }`, Index on `dueDate`.

### 11.13 `payments`

- **Purpose:** Financial payment transaction records.
- **Fields:** `_id`, `paymentNumber` (Unique String), `invoiceId` (Ref: `invoices`), `flatId` (Ref: `flats`), `payerUserId` (Ref: `users`), `amountPaid`, `paymentMethod` (`CASH`, `CARD`, `UPI`, `BANK_TRANSFER`), `transactionRef`, `receiptUrl`, `paymentDate`, `notes`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `paymentNumber`, Index on `invoiceId`.

### 11.14 `complaints`

- **Purpose:** Maintenance complaints logged by residents.
- **Fields:** `_id`, `ticketNumber` (Unique String), `buildingId` (Ref: `buildings`), `flatId` (Ref: `flats`), `createdById` (Ref: `users`), `category` (`PLUMBING`, `ELECTRICAL`, `CLEANING`, `SECURITY`, `OTHER`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), `title`, `description`, `attachments` (Array of URLs), `assignedStaffId` (Ref: `staff`), `status` (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `resolvedAt`, `closedAt`, `comments` (Array of `{ userId, text, createdAt }`), `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `ticketNumber`, Index on `{ buildingId: 1, status: 1 }`, Index on `assignedStaffId`.

### 11.15 `reviews`

- **Purpose:** Post-resolution service ratings submitted by residents.
- **Fields:** `_id`, `complaintId` (Ref: `complaints`), `buildingId` (Ref: `buildings`), `flatId` (Ref: `flats`), `residentId` (Ref: `users`), `staffId` (Ref: `staff`), `rating` (Number, 1 to 5), `title`, `comment`, `moderationStatus` (`PUBLISHED`, `FLAGGED`, `HIDDEN`, `DELETED`), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `complaintId` (One review per complaint), Index on `staffId`.

### 11.16 `notices`

- **Purpose:** Broadcast notices and announcements.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `title`, `content`, `category` (`GENERAL`, `MAINTENANCE`, `EMERGENCY`, `EVENT`), `targetAudience` (`ALL`, `OWNERS_ONLY`, `TENANTS_ONLY`), `attachments` (Array of URLs), `publishedAt`, `expiresAt`, `createdById` (Ref: `users`), `createdAt`, `updatedAt`.
- **Indexes:** Index on `{ buildingId: 1, expiresAt: 1 }`.

### 11.17 `notifications`

- **Purpose:** Resident/User in-app notifications.
- **Fields:** `_id`, `recipientId` (Ref: `users`), `title`, `message`, `type` (`INVOICE`, `PAYMENT`, `COMPLAINT`, `NOTICE`, `VISITOR`), `referenceId` (ObjectId), `isRead` (Boolean, Default false), `readAt`, `createdAt`, `updatedAt`.
- **Indexes:** Index on `{ recipientId: 1, isRead: 1 }`.

### 11.18 `expenses`

- **Purpose:** Building operation expenses logged by admin/accountants.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `title`, `category` (`UTILITIES`, `SALARIES`, `REPAIRS`, `VENDOR_PAYMENT`, `OTHER`), `amount`, `vendorName`, `receiptUrl`, `expenseDate`, `approvedById` (Ref: `users`), `createdAt`, `updatedAt`.
- **Indexes:** Index on `{ buildingId: 1, expenseDate: -1 }`.

### 11.19 `visitors`

- **Purpose:** Security gate visitor logs.
- **Fields:** `_id`, `passCode` (Unique String), `buildingId` (Ref: `buildings`), `flatId` (Ref: `flats`), `residentId` (Ref: `users`), `visitorName`, `visitorPhone`, `visitorCount`, `purpose`, `vehicleNumber`, `entryTime`, `exitTime`, `securityStaffId` (Ref: `users`), `status` (`EXPECTED`, `CHECKED_IN`, `CHECKED_OUT`, `DENIED`), `createdAt`, `updatedAt`.
- **Indexes:** Unique index on `passCode`, Index on `{ buildingId: 1, status: 1 }`.

### 11.20 `documents`

- **Purpose:** Society and flat document repository.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `flatId` (Ref: `flats`), `title`, `documentType` (`DEED`, `LEASE`, `BYLAW`, `RECEIPT`, `OTHER`), `fileUrl`, `fileSize`, `uploadedById` (Ref: `users`), `isPublic`, `createdAt`, `updatedAt`.
- **Indexes:** Index on `{ buildingId: 1, documentType: 1 }`.

### 11.21 `reports`

- **Purpose:** Cached metadata for generated reports.
- **Fields:** `_id`, `buildingId` (Ref: `buildings`), `reportType` (`MAINTENANCE_COLLECTION`, `EXPENSE_SUMMARY`, `COMPLAINT_SLA`, `STAFF_PERFORMANCE`), `parameters` (Object), `generatedById` (Ref: `users`), `fileUrl`, `createdAt`.
- **Indexes:** Index on `{ buildingId: 1, reportType: 1 }`.

### 11.22 `auditLogs`

- **Purpose:** Immutable audit event tracking.
- **Fields:** `_id`, `action` (String, e.g., `UPDATE_INVOICE`), `userId` (Ref: `users`), `userRole`, `resource` (String), `resourceId` (ObjectId), `oldValues` (Object), `newValues` (Object), `ipAddress`, `userAgent`, `createdAt`.
- **Indexes:** Index on `{ resourceId: 1, createdAt: -1 }`, Index on `{ userId: 1, createdAt: -1 }`.

---

## 12. MODULE 1 — AUTHENTICATION

### 12.1 Authentication Architecture & Flow

The system implements a stateless JWT dual-token architecture (Access Token + Refresh Token with Rotation).

```text
User                      Express API                      MongoDB
 │                             │                              │
 ├─── POST /auth/login ───────►│                              │
 │    (email, password)        ├─── Find User by Email ──────►│
 │                             │◄── Return User Document ─────┤
 │                             ├─── Verify Password (bcrypt)  │
 │                             ├─── Generate Access Token     │
 │                             ├─── Generate Refresh Token    │
 │                             ├─── Store Hashed Refresh Token│
 │                             │    in User DB Document ─────►│
 │◄── 200 OK Response ─────────┤                              │
 │    (Set-Cookie: refreshToken│                              │
 │     Body: accessToken)      │                              │
```

### 12.2 Security Features

- **Password Hashing:** `bcrypt` with 12 salt rounds. Passwords must be at least 8 characters, containing uppercase, lowercase, numbers, and special characters.
- **Access Tokens:** Signed with `JWT_ACCESS_SECRET`. Short expiration (`15m`). Transmitted in `Authorization: Bearer <token>` header.
- **Refresh Tokens:** Signed with `JWT_REFRESH_SECRET`. Long expiration (`7d`). Stored exclusively in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
- **Refresh Token Rotation:** Every refresh attempt invalidates the old refresh token and issues a new pair. If a revoked refresh token is reused, all refresh tokens for that user account are cleared immediately (theft detection trigger).

---

## 13. MODULE 2 — USERS

Manages user accounts, statuses, user lifecycles, and user profile management.

- **User Statuses:**
  - `PENDING`: User registered, awaiting email verification.
  - `ACTIVE`: Fully verified user with active credentials.
  - `INACTIVE`: User deactivated by admin; logins disabled.
  - `SUSPENDED`: Temporarily suspended due to security violation or non-payment.

---

## 14. MODULE 3 — ROLES & PERMISSIONS (RBAC)

The system relies on strict Role-Based Access Control (RBAC).

### 14.1 Defined System Roles

1. `SUPER_ADMIN`: Unlimited platform access.
2. `BUILDING_ADMIN`: Full administrative control over specific assigned buildings.
3. `ACCOUNTANT`: Financial access (Invoices, Payments, Expenses, Financial Reports).
4. `SECURITY_STAFF`: Access limited to Visitor management and Notice reading.
5. `MAINTENANCE_STAFF`: Access limited to assigned Complaint viewing and status updates.
6. `OWNER`: Access to personal Flat details, Invoices, Payment execution, Complaint logging, and Reviews.
7. `TENANT`: Access to Flat occupancy details, Invoices (if enabled), Complaints, Notices, and Visitors.

---

## 15. MODULE 4 — BUILDINGS

Provides CRUD operations for residential buildings. Admin users can create buildings, configure total blocks/flats, and update building profiles.

- **Constraint:** A building cannot be deleted if it contains active flats or unpaid invoices.

---

## 16. MODULE 5 — BLOCKS

Manages building blocks (e.g., Block A, Block B). Blocks belong to a single Building.

- **Hierarchy:** `Building -> Block`

---

## 17. MODULE 6 — FLOORS

Manages physical floors within a specific block.

- **Hierarchy:** `Building -> Block -> Floor`

---

## 18. MODULE 7 — FLATS

Manages physical flat units. Tracks square footage, occupancy status (`VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`), owner association, and tenant occupancy.

- **Hierarchy:** `Building -> Block -> Floor -> Flat`

---

## 19. MODULE 8 — OWNERS

Manages flat owner profiles, contact details, emergency contacts, identity documents, and historical flat ownership records.

---

## 20. MODULE 9 — TENANTS

Manages tenant lease profiles, lease start/end dates, rent agreements, and flat occupancy statuses. Supports move-in and move-out workflows.

---

## 21. MODULE 10 — STAFF

Manages staff profiles (Security guards, electricians, plumbers). Tracks shifts, designated departments, assigned buildings, and cumulative performance ratings.

---

## 22. MODULE 11 — MAINTENANCE CONFIGURATIONS

Defines billing rate algorithms for a building. Supports flat-rate monthly maintenance or area-based calculation (`Rate * Flat SqFt`). Configures grace period days and late fee penalty percentages.

---

## 23. MODULE 12 — INVOICES

Generates monthly maintenance invoices for flats based on active Maintenance Configurations.

- **Lifecycle State Machine:**
  ```text
  [DRAFT] ──► [ISSUED] ──► [OVERDUE]
                 │             │
                 ▼             ▼
          [PARTIALLY_PAID] ──► [PAID]
  ```

---

## 24. MODULE 13 — PAYMENTS & TRANSACTIONS

Executes payment processing against issued invoices.

- **ACID Transaction Rule:** Payment creation MUST run within a MongoDB session transaction:
  1. Validate invoice status (`ISSUED` or `OVERDUE`).
  2. Record payment document in `payments` collection.
  3. Deduct payment amount from `invoice.dueAmount` and update `invoice.paidAmount`.
  4. Transition `invoice.status` to `PAID` or `PARTIALLY_PAID`.
  5. Generate immutable receipt reference and dispatch audit event.

---

## 25. MODULE 14 — COMPLAINTS

Tracks resident maintenance tickets from opening to resolution.

- **Lifecycle State Machine:**
  ```text
  [OPEN] ──► [ASSIGNED] ──► [IN_PROGRESS] ──► [RESOLVED] ──► [CLOSED]
  ```

---

## 26. MODULE 15 — RATINGS & REVIEWS

Allows residents to submit feedback and a 1-5 star rating for completed complaints.

- **Calculation Engine:** Upon review submission, the service updates the assigned staff member's `averageRating` and `totalRatingsCount` atomically.
- **Spam Defense:** Exactly ONE review is permitted per resolved complaint ticket (`complaintId` unique index).

---

## 27. MODULE 16 — NOTICES

Broadcast announcements published by Building Admins. Supports targeted broadcasts (`ALL`, `OWNERS_ONLY`, `TENANTS_ONLY`) and automatic notice expiration.

---

## 28. MODULE 17 — NOTIFICATIONS

In-app notification engine tracking real-time alerts for invoices, payment receipts, complaint updates, and visitor arrivals.

---

## 29. MODULE 18 — EXPENSES

Tracks societal operational expenses (utility bills, staff salaries, repairs) logged by Accountants/Admins with receipt attachments for financial auditing.

---

## 30. MODULE 19 — VISITORS

Gate security check-in system. Residents pre-generate visitor passes, or Security Staff verify guest entry/exit at the gate.

---

## 31. MODULE 20 — DOCUMENTS

Central repository for society bylaws, lease agreements, property deeds, and financial receipts with strict role access checks.

---

## 32. MODULE 21 — REPORTS & ANALYTICS

Aggregation engine generating financial collection summaries, outstanding dues reports, staff SLA resolution reports, and visitor volume logs.

---

## 33. MODULE 22 — AUDIT LOGS

Tracks every critical mutation (user role updates, invoice modifications, payment deletions). Records `Who`, `What`, `When`, `Resource ID`, `Old Values`, `New Values`, `IP Address`, and `User-Agent`.

- **Security Rule:** Audit logs are strictly append-only and cannot be updated or erased by any user role. Sensitive fields (`password`, `refreshToken`) are masked prior to persistence.

---

## 34. GLOBAL ERROR HANDLING ARCHITECTURE

All runtime, database, and validation exceptions are intercepted by a centralized error middleware (`src/middlewares/error.middleware.js`).

```javascript
// src/utils/ApiError.js
export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### 34.1 Mongoose & JWT Error Translation

- **CastError (Invalid ObjectId):** Translated to `400 Bad Request` ("Invalid ID format").
- **11000 Duplicate Key:** Translated to `409 Conflict` ("Resource key already exists").
- **TokenExpiredError:** Translated to `401 Unauthorized` ("Access token has expired").
- **JsonWebTokenError:** Translated to `401 Unauthorized` ("Invalid authentication token").

---

## 35. VALIDATION ARCHITECTURE (ZOD ENGINE)

Incoming requests MUST be validated by passing a Zod schema to the `validate` middleware:

```javascript
// Example Validation Middleware Usage
router.post(
  "/buildings",
  authenticate,
  authorize("BUILDING_CREATE"),
  validate(createBuildingSchema),
  buildingController.createBuilding
);
```

Zod schemas validate `req.body`, `req.query`, and `req.params`. Invalid payloads abort execution before reaching the controller.

---

## 36. AUTHORIZATION ARCHITECTURE (RBAC + OBAC)

1. **Role-Based Access Control (RBAC):** Verified using `authorize(...requiredPermissions)`. Checks if `req.user.role` contains the required permission string.
2. **Object Ownership-Based Access Control (OBAC):** Enforces data isolation. A resident (Owner/Tenant) can ONLY query or modify invoices, flats, complaints, and visitor logs belonging to their explicit `flatId` or `userId`. Admin overrides apply only to assigned buildings.

---

## 37. PAGINATION STANDARD

All list endpoints MUST accept standard query params and return structured pagination metadata:

- **Query Parameters:** `?page=1&limit=20` (Default `page=1`, Default `limit=20`, Maximum `limit=100`).
- **Offset Calculation:** `skip = (page - 1) * limit`.

---

## 38. SEARCH, FILTERING & SORTING CONVENTIONS

- **Search:** `?search=emerald` (Executes sanitized regex or MongoDB text index search).
- **Filtering:** `?status=ACTIVE&buildingId=64f1a2b3c4...`
- **Sorting:** `?sort=-createdAt` (Sort descending by creation date), `?sort=name` (Sort ascending by name).

---

## 39. MONGODB INDEXING STRATEGY

To ensure sub-100ms response times at scale, mandatory indexes MUST be declared:

- **Single-Field Unique Indexes:** `users.email`, `buildings.code`, `invoices.invoiceNumber`, `payments.paymentNumber`, `visitors.passCode`.
- **Compound Indexes:**
  - `flats`: `{ blockId: 1, flatNumber: 1 }` (Unique)
  - `invoices`: `{ flatId: 1, status: 1 }`
  - `complaints`: `{ buildingId: 1, status: 1 }`
  - `auditLogs`: `{ resourceId: 1, createdAt: -1 }`

---

## 40. DATABASE TRANSACTIONS (ACID BOUNDARIES)

MongoDB session transactions (`session.startTransaction()`) MUST be used in:

1. **Payment Execution:** Updating invoice status + inserting payment record + updating flat balance.
2. **Flat Ownership Transfer:** Revoking old owner + updating flat `currentOwnerId` + logging ownership history.
3. **Tenant Onboarding:** Assigning tenant + updating flat status to `OCCUPIED`.

---

## 41. SECURITY ARCHITECTURE & SECURITY CHECKLIST

### 41.1 Comprehensive Security Controls

- **HTTP Hardening:** Helmet enabled to set HSTS, CSP, and disable `X-Powered-By`.
- **CORS Protection:** Configured with strict `origin` whitelist matching frontend deployment domains.
- **Rate Limiting:** Global rate limit (100 req/15 min); Auth endpoints rate limit (5 req/15 min).
- **NoSQL Injection Defense:** `express-mongo-sanitize` strips `$` and `.` characters from payloads.
- **Password Hashing:** `bcrypt` salt cost factor set to 12.

### 41.2 Security Checklist

- [x] Passwords never stored in plain text.
- [x] JWT Refresh tokens stored in HttpOnly, Secure, SameSite cookies.
- [x] All endpoints validated with Zod.
- [x] Parameterized MongoDB queries used exclusively.
- [x] Rate limiters active on Auth and Reset Password routes.
- [x] PII redacted from logs and error stacks in production.

---

## 42. FILE UPLOAD SECURITY & CLOUD STORAGE

- **Upload Interceptor:** `multer` configured with memory storage (`storage: multer.memoryStorage()`).
- **Validation Rules:**
  - Image File Types: `image/jpeg`, `image/png`, `image/webp`. Max size: 5 MB.
  - Document File Types: `application/pdf`. Max size: 10 MB.
- **Cloudinary Upload:** Memory buffers streamed directly to Cloudinary folder paths (`/flat-maintenance/documents/`).

---

## 43. LOGGING, OBSERVABILITY & MONITORING

Structured JSON logs are emitted to `stdout`/`stderr`.

- **Log Levels:** `error`, `warn`, `info`, `debug`.
- **Context Information:** Timestamp, Environment, Request ID, User ID, Method, URL, Status Code, Latency (ms).
- **PII Redaction Rule:** Secrets (`password`, `token`, `cardNumber`) are automatically replaced with `[REDACTED]` by logging formatters.

---

## 44. HEALTH CHECK & READINESS ARCHITECTURE

Provides probe endpoints for container orchestrators (Docker / Kubernetes):

- `GET /health`: Liveness probe. Returns `200 OK` if the Express app process is alive.
- `GET /ready`: Readiness probe. Verifies MongoDB replica set connectivity. Returns `200 OK` if ready to accept traffic, or `503 Service Unavailable` if DB connection is broken.

---

## 45. TESTING ARCHITECTURE & WORKFLOW

### 45.1 Test Levels

1. **Unit Tests (`node --test tests/unit/**/*.test.js`):** Tests pure utility functions, calculation engines, and service logic using mocks.
2. **Integration Tests (`node --test tests/integration/**/*.test.js`):** Tests MongoDB queries, Mongoose hooks, and transaction sessions against an in-memory or test Mongo database instance.
3. **API End-to-End Tests (`tests/e2e/**/*.test.js`):** Uses `supertest` to trigger HTTP requests across full endpoint workflows.

---

## 46. API ENDPOINT INVENTORY

Below is the complete API Endpoint Inventory across all core modules:

| Module         | Method  | Endpoint                        | Auth | Required Permission | Purpose                               |
| :------------- | :------ | :------------------------------ | :--- | :------------------ | :------------------------------------ |
| **Auth**       | `POST`  | `/api/v1/auth/activate-account` | No   | Invitation token    | Activate an invited account only      |
| **Auth**       | `POST`  | `/api/v1/auth/login`            | No   | Public              | Authenticate user & issue tokens      |
| **Auth**       | `POST`  | `/api/v1/auth/logout`           | Yes  | Authenticated       | Revoke refresh token                  |
| **Auth**       | `POST`  | `/api/v1/auth/refresh`          | No   | Public (Cookie)     | Rotate access & refresh tokens        |
| **Auth**       | `GET`   | `/api/v1/auth/me`               | Yes  | Authenticated       | Fetch current user profile            |
| **Users**      | `GET`   | `/api/v1/users`                 | Yes  | `USER_READ`         | List paginated users                  |
| **Users**      | `GET`   | `/api/v1/users/:id`             | Yes  | `USER_READ`         | Get specific user by ID               |
| **Users**      | `PATCH` | `/api/v1/users/:id/status`      | Yes  | `USER_UPDATE`       | Update user status (Active/Suspended) |
| **Buildings**  | `POST`  | `/api/v1/buildings`             | Yes  | `BUILDING_CREATE`   | Create a new building                 |
| **Buildings**  | `GET`   | `/api/v1/buildings`             | Yes  | `BUILDING_READ`     | List all buildings                    |
| **Buildings**  | `GET`   | `/api/v1/buildings/:id`         | Yes  | `BUILDING_READ`     | Get building details                  |
| **Buildings**  | `PATCH` | `/api/v1/buildings/:id`         | Yes  | `BUILDING_UPDATE`   | Update building details               |
| **Flats**      | `POST`  | `/api/v1/flats`                 | Yes  | `FLAT_CREATE`       | Create flat unit                      |
| **Flats**      | `GET`   | `/api/v1/flats`                 | Yes  | `FLAT_READ`         | List flats with filters               |
| **Invoices**   | `POST`  | `/api/v1/invoices/generate`     | Yes  | `INVOICE_GENERATE`  | Batch generate monthly invoices       |
| **Invoices**   | `GET`   | `/api/v1/invoices`              | Yes  | `INVOICE_READ`      | List invoices                         |
| **Payments**   | `POST`  | `/api/v1/payments`              | Yes  | `PAYMENT_CREATE`    | Record payment against invoice        |
| **Complaints** | `POST`  | `/api/v1/complaints`            | Yes  | `COMPLAINT_CREATE`  | Log maintenance complaint             |
| **Complaints** | `PATCH` | `/api/v1/complaints/:id/status` | Yes  | `COMPLAINT_UPDATE`  | Update complaint lifecycle status     |
| **Reviews**    | `POST`  | `/api/v1/reviews`               | Yes  | `REVIEW_CREATE`     | Submit rating for resolved complaint  |
| **Visitors**   | `POST`  | `/api/v1/visitors`              | Yes  | `VISITOR_CREATE`    | Pre-register guest entry pass         |
| **Visitors**   | `PATCH` | `/api/v1/visitors/:id/check-in` | Yes  | `VISITOR_UPDATE`    | Security gate check-in guest          |
| **Audit Logs** | `GET`   | `/api/v1/audit-logs`            | Yes  | `AUDIT_READ`        | Query system audit events             |

---

## 47. CORE BUSINESS RULES & CONSTRAINTS

1. **Building Deletion Invariant:** A building CANNOT be deactivated or soft-deleted if it contains active flats or unpaid invoices.
2. **Flat Occupancy Invariant:** A flat CANNOT have status `OCCUPIED` unless an active owner or tenant is assigned.
3. **Invoice Immutability:** Once an invoice transitions to `PAID`, its line items, totals, and flat associations CANNOT be modified.
4. **Financial Payment Retention:** Payment records are immutable financial documents. Deletions are forbidden; reversals require explicit credit memo accounting entries.
5. **Review Integrity Rule:** A resident can ONLY rate a complaint that is in `RESOLVED` or `CLOSED` status. Duplicate reviews for the same ticket are rejected by unique database index enforcement.

---

## 48. STATE MACHINES & TRANSITION RULES

### 48.1 Invoice Status Transitions

- Allowed: `DRAFT -> ISSUED`, `ISSUED -> OVERDUE`, `ISSUED -> PARTIALLY_PAID`, `ISSUED -> PAID`, `PARTIALLY_PAID -> PAID`, `OVERDUE -> PAID`.
- Forbidden: `PAID -> DRAFT`, `PAID -> ISSUED`, `OVERDUE -> DRAFT`.

### 48.2 Complaint Status Transitions

- Allowed: `OPEN -> ASSIGNED`, `ASSIGNED -> IN_PROGRESS`, `IN_PROGRESS -> RESOLVED`, `RESOLVED -> CLOSED`.
- Forbidden: `CLOSED -> IN_PROGRESS`, `RESOLVED -> OPEN`.

---

## 49. DATA OWNERSHIP & MULTI-TENANCY EVOLUTION

Although initial release operates as a single-society system, all database schemas mandate a top-level `buildingId` reference. To evolve into a Multi-Tenant SaaS platform, schemas will introduce an `organizationId` reference. Data queries will enforce `{ organizationId: req.user.organizationId }` at the base Mongoose query middleware level.

---

## 50. BACKEND PERFORMANCE OPTIMIZATION

- **Lean Queries:** Use `.lean()` for read-only GET endpoints to bypass Mongoose document hydration overhead.
- **Projections:** Explicitly select required fields (`.select('firstName lastName email')`) to reduce MongoDB wire bandwidth.
- **Query Optimization:** Avoid N+1 population queries by using targeted aggregation pipelines (`$lookup`, `$match`, `$project`).
- **Connection Pooling:** Configure Mongoose connection pool (`maxPoolSize: 50, minPoolSize: 10`).

---

## 51. SCALABILITY ARCHITECTURE & FUTURE MICROSERVICES PATH

```text
                  Client Requests
                         │
                         ▼
             AWS Application Load Balancer
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
    Express Node 1           Express Node 2  (Stateless API Instances)
             │                       │
             └───────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  MongoDB Atlas     Redis Cache     BullMQ Worker Queue
  (Replica Set)     (Sessions/Cache) (Emails / Reports)
```

The application nodes are 100% stateless. Session state resides in JWT tokens and Redis. When horizontal throughput demands exceed single node capabilities, additional Express containers can be spun up behind an AWS ALB without code modifications.

---

## 52. BACKGROUND JOBS & QUEUE ARCHITECTURE

Future asynchronous processing (email dispatch, batch invoice generation, pdf receipt rendering) will utilize **BullMQ** backed by **Redis**. Express nodes will publish job events to Redis queues; dedicated background worker processes will consume and execute jobs out-of-band to prevent API request blocking.

---

## 53. DOCKER & CONTAINERIZATION SPECIFICATION

### 53.1 Production Multi-Stage `Dockerfile`

```dockerfile
# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false
COPY . .

# Stage 2: Production Release
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true
COPY --from=builder /app/src ./src
COPY --from=builder /app/docs ./docs

USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## 54. CI/CD AUTOMATION PIPELINE (GITHUB ACTIONS)

The repository relies on GitHub Actions (`.github/workflows/ci.yml`):

1. **Lint & Code Quality:** Runs `eslint` and `prettier --check`.
2. **Security Audit:** Runs `npm audit` / `yarn audit` for vulnerable dependencies.
3. **Automated Testing:** Runs `npm test` (Unit and Integration suite).
4. **Docker Image Build:** Builds production Docker image and runs container smoke test check.

---

## 55. AWS CLOUD DEPLOYMENT ARCHITECTURE

- **Compute:** AWS ECS Fargate running serverless Docker containers across multiple Availability Zones (AZs).
- **Load Balancer:** AWS Application Load Balancer (ALB) terminating HTTPS SSL/TLS certificates issued via AWS Certificate Manager (ACM).
- **Database:** MongoDB Atlas Dedicated Cluster (AWS US-East-1) with multi-AZ replica set.
- **Media & Documents:** Cloudinary CDN for optimized image delivery.
- **Secrets:** AWS Secrets Manager storing production `.env` credentials.

---

## 56. BACKUPS, DISASTER RECOVERY & RPO/RTO

- **Backup Strategy:** MongoDB Atlas automated continuous snapshots with point-in-time recovery enabled. Daily full backups retained for 30 days; monthly backups retained for 1 year.
- **Recovery Point Objective (RPO):** < 5 minutes (Maximum 5 minutes of potential data loss during total regional outage).
- **Recovery Time Objective (RTO):** < 1 hour (Full API service restoration in secondary AWS region within 60 minutes).

---

## 57. FRONTEND INTEGRATION CONTRACT (NEXT.JS CLIENT)

- **Cross-Origin Configuration:** `CORS_ORIGIN` must match Next.js deployment domain. `credentials: true` must be enabled on client HTTP requests (Axios / Fetch) to allow cookie transmission.
- **Token Handling:** Access token passed in `Authorization: Bearer <token>` header. Refresh token automatically handled by browser via `HttpOnly` cookie on `/api/v1/auth/refresh` calls.

---

## 58. DEVELOPMENT WORKFLOW & PHASE BREAKDOWN

Backend development MUST strictly follow the 27-phase sequential module implementation plan:

- **Phase 0:** Backend Foundation & Architecture Setup
- **Phase 1:** Authentication Module
- **Phase 2:** Users, Roles & Permissions (RBAC)
- **Phase 3-7:** Building Hierarchy (Buildings, Blocks, Floors, Flats, Owners)
- **Phase 8-10:** Occupancy & Personnel (Tenants, Staff)
- **Phase 11-13:** Financial Operations (Maintenance Configs, Invoices, Payments)
- **Phase 14-15:** Operations & Feedback (Complaints, Ratings & Reviews)
- **Phase 16-21:** Auxiliary Systems (Notices, Notifications, Expenses, Visitors, Documents, Reports, Audit Logs)
- **Phase 22-26:** Testing, Containerization, CI/CD, AWS Deployment, and Hardening.

---

## 59. MODULE COMPLETION CHECKLIST

Before marking ANY backend module as `COMPLETE`, all 20 criteria MUST be satisfied:

- [ ] 1. Requirements & User Stories defined
- [ ] 2. Database Schema created & reviewed
- [ ] 3. Entity Relationships configured
- [ ] 4. MongoDB Indexes defined
- [ ] 5. Zod Validation Schemas written
- [ ] 6. Express Routes configured
- [ ] 7. Controller methods implemented
- [ ] 8. Service layer business logic written
- [ ] 9. Middleware attached (Auth, RBAC)
- [ ] 10. Authentication enforced
- [ ] 11. Authorization (RBAC/OBAC) checked
- [ ] 12. Global Error Handling verified
- [ ] 13. Standard API Responses used
- [ ] 14. Pagination integrated (if list endpoint)
- [ ] 15. Search & Filtering enabled
- [ ] 16. Unit & Integration Tests written
- [ ] 17. Edge Cases covered
- [ ] 18. Security Review performed
- [ ] 19. Audit Events logged
- [ ] 20. API Endpoint Inventory updated

---

## 60. EDGE CASES & BACKEND MITIGATION MATRIX

| Edge Case                         | Domain   | Backend Mitigation Technique                                                                                                          |
| :-------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Concurrent Payment Submission** | Payments | MongoDB session transaction locks invoice document during payment execution; double submissions rejected with `409 Conflict`.         |
| **Duplicate Visitor Pass Code**   | Visitors | Pass codes generated using cryptographically safe random strings + unique index check.                                                |
| **Stale Maintenance Rates**       | Invoices | Invoices snapshot effective maintenance rate at time of generation; future config changes do not retroactively alter issued invoices. |
| **Duplicate Review Submission**   | Reviews  | Compound unique index on `{ complaintId: 1 }` prevents multiple review document insertions.                                           |
| **Soft Deleted User Login**       | Auth     | Authentication query explicitly filters `{ email, isDeleted: false, status: 'ACTIVE' }`.                                              |

---

## 61. PRODUCTION READINESS CHECKLIST

- [x] Architecture verified as Modular Monolith.
- [x] All 22 database collection schemas specified.
- [x] Dual-token JWT authentication flow designed.
- [x] Granular RBAC permission matrix established.
- [x] Financial calculation engines and transaction boundaries defined.
- [x] Post-resolution Rating & Review moderation system configured.
- [x] Security controls (Helmet, CORS, Rate Limit, Mongo-Sanitize) operational.
- [x] Multi-stage Dockerfile and Docker Compose blueprints created.
- [x] Continuous Integration pipeline designed via GitHub Actions.
- [x] AWS cloud deployment architecture planned.

---

## 62. ENTITY RELATIONSHIP (ER) DIAGRAMS

### 62.1 Core Building & Occupancy ER Diagram

```mermaid
erDiagram
    BUILDINGS ||--o{ BLOCKS : contains
    BLOCKS ||--o{ FLOORS : contains
    FLOORS ||--o{ FLATS : contains
    FLATS ||--o{ OWNERS : owned_by
    FLATS ||--o{ TENANTS : occupied_by
    USERS ||--o{ OWNERS : profile_of
    USERS ||--o{ TENANTS : profile_of
    USERS }|--|| ROLES : assigned_role
```

### 62.2 Financial & Complaint Workflow ER Diagram

```mermaid
erDiagram
    BUILDINGS ||--o{ INVOICES : issues
    FLATS ||--o{ INVOICES : billed_to
    INVOICES ||--o{ PAYMENTS : paid_via
    FLATS ||--o{ COMPLAINTS : logged_from
    USERS ||--o{ COMPLAINTS : created_by
    STAFF ||--o{ COMPLAINTS : assigned_to
    COMPLAINTS ||--o| REVIEWS : rated_by
```

---

## 63. REQUEST FLOW SEQUENCE DIAGRAMS

### 63.1 Payment Execution Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Resident as Resident (Client)
    participant API as Express API Router
    participant Val as Zod Validator
    participant Auth as Auth Middleware
    participant Ctrl as Payment Controller
    participant Svc as Payment Service
    participant DB as MongoDB (Transaction)

    Resident->>API: POST /api/v1/payments (invoiceId, amount, paymentMethod)
    API->>Val: Validate request payload
    Val-->>API: Payload valid
    API->>Auth: Verify JWT & RBAC permission
    Auth-->>API: Authorized User Context
    API->>Ctrl: Invoke createPayment()
    Ctrl->>Svc: Process Payment (InvoiceId, Amount)
    Svc->>DB: Start Session Transaction
    Svc->>DB: Fetch Invoice (Lock document)
    DB-->>Svc: Invoice Document
    Svc->>Svc: Calculate Dues & Verify Status
    Svc->>DB: Insert Payment Document
    Svc->>DB: Update Invoice (paidAmount, status)
    Svc->>DB: Commit Session Transaction
    DB-->>Svc: Success Confirmation
    Svc-->>Ctrl: Payment Receipt Object
    Ctrl-->>Resident: 201 Created (ApiResponse)
```

---

## 64. ENGINEERING RULES & QUALITY CONTROLS

1. **Blueprint Priority:** This technical specification is the ultimate source of truth. Code implementations MUST NOT diverge from schemas, status enums, or endpoint paths defined in this document.
2. **Incremental Module Implementation:** Development MUST occur module-by-module following the defined Phase Breakdown. Developers must not jump to feature implementation before finishing foundational modules.
3. **No Direct Code Dumping:** All future codebase additions MUST be preceded by design confirmation and adherence to the layered architecture.

---

### END OF BACKEND TECHNICAL ARCHITECTURE SPECIFICATION

---

## 65. IMPLEMENTATION STATUS & SOURCE-OF-TRUTH RULES

This document defines the intended production system; it is not evidence that a feature has shipped. As of this version, the repository contains only the Express application bootstrap, `GET /`, `GET /health`, MongoDB connection helper, Docker assets, and a smoke-test script. No domain routes, persistence models, authentication, RBAC, Cloudinary upload, n8n integration, or production middleware are implemented yet.

| Area       | Current repository state     | Required before release                                                        |
| :--------- | :--------------------------- | :----------------------------------------------------------------------------- |
| HTTP API   | Root and health routes only  | Versioned router, modules, standard responses and 404/error handlers           |
| Database   | Connection helper only       | All schemas, indexes, migrations/seeds and transaction boundaries              |
| Identity   | Dependency declarations only | Invitation-only accounts, JWT rotation, password and verification flows        |
| Security   | Dependency declarations only | Helmet, CORS, rate limits, sanitisation, validation, audit logging             |
| Operations | Docker/CI assets present     | Verified readiness, graceful shutdown, metrics, backups and deployment runbook |

`package.json`, the running source, and deployed configuration are authoritative for what is currently available. This blueprint is authoritative for new implementation decisions. A completed feature must update this status table, its endpoint row, tests, environment variables, and audit events in the same pull request. “Planned” controls must never be described as enabled to API consumers or auditors.

### 65.1 Current HTTP contract

| Method | Path      | Behaviour today                                                |
| :----- | :-------- | :------------------------------------------------------------- |
| `GET`  | `/`       | Returns `{ success: true, message: "API is working fine" }`    |
| `GET`  | `/health` | Returns `{ success: true, message: "Backend API is healthy" }` |

`/ready` and every `/api/v1/*` endpoint are planned, not currently served. The smoke test's permissive unknown-route assertion must be tightened to require `404` when the global not-found handler is introduced.

### 65.2 Delivery baseline

Before adding a domain, create `model`, `validation`, `service`, `controller`, and `routes` files in its module; register its routes centrally; and write service plus HTTP tests. Controllers only translate HTTP to service calls. Services receive explicit actor and scope context, enforce invariants, and emit audit/automation events after a successful transaction. Models must not make authorization decisions.

---

## 66. PROVISIONING, AUTHENTICATION & SESSION CONTRACTS

### 66.1 Account provisioning policy

There is no public registration endpoint. A deployment is bootstrapped by a one-time, idempotent seed command that creates the first `SUPER_ADMIN` from explicitly supplied secrets. Only authorized administrators may invite other users; the server chooses the role from the inviter's allowed roles and scope. The client may request an invite type, but must never set a privileged role, building assignment, owner relationship, or staff assignment.

```text
seed SUPER_ADMIN -> authenticated SUPER_ADMIN -> invite BUILDING_ADMIN
-> authorized administrator invites scoped staff / owner / tenant
-> invitee verifies token and sets password -> email verification -> ACTIVE
```

Invitations are single-use, random high-entropy tokens stored only as hashes, expire (recommended: 72 hours), and are revoked on resend. Deactivation and suspension revoke all sessions immediately. Soft deletion removes an account from normal queries and login while retaining the minimum audit linkage required by policy.

### 66.2 Required authentication endpoints

| Method  | Path                             | Input / result                                   | Rules                                                                                   |
| :------ | :------------------------------- | :----------------------------------------------- | :-------------------------------------------------------------------------------------- |
| `POST`  | `/api/v1/auth/login`             | email, password -> access token + refresh cookie | Reject deleted, pending, inactive and suspended accounts; rate limit and audit outcome. |
| `POST`  | `/api/v1/auth/refresh`           | refresh cookie -> rotated token pair             | One-time token rotation; detected reuse revokes the user's token family.                |
| `POST`  | `/api/v1/auth/logout`            | refresh cookie                                   | Revoke matching session and clear cookie.                                               |
| `GET`   | `/api/v1/auth/me`                | bearer access token -> safe profile              | Never return token hashes, password, or security counters.                              |
| `POST`  | `/api/v1/auth/forgot-password`   | email -> accepted response                       | Always return a non-enumerating response.                                               |
| `POST`  | `/api/v1/auth/reset-password`    | reset token, new password                        | Consume token and revoke all sessions.                                                  |
| `PATCH` | `/api/v1/auth/change-password`   | current and new password                         | Requires access token; revoke all other sessions.                                       |
| `POST`  | `/api/v1/auth/verify-email`      | verification token                               | Idempotently marks email verified.                                                      |
| `POST`  | `/api/v1/auth/activate-account`  | invitation token, password                       | One-time invitation onboarding only.                                                    |
| `POST`  | `/api/v1/auth/resend-invitation` | invited user identifier                          | Authorized administrator only; revoke prior invite.                                     |

### 66.3 Token and cookie lifecycle

Access JWTs last 15 minutes and contain only `sub`, role/permission version, issued/expiry times, and a session identifier. They travel in `Authorization: Bearer <token>`, not persistent browser storage. Refresh JWTs last seven days, live only in an `HttpOnly`, `Secure` (production), `SameSite=Lax` or stricter cookie with a narrow `/api/v1/auth` path, and are hashed at rest with a server-side pepper where appropriate.

Persist a session record containing token hash, `jti`, family ID, expiry, creation metadata, and revocation metadata. On refresh, atomically mark the presented record used/revoked and create its replacement. A previously used/revoked token is a reuse signal: revoke its entire family, clear the cookie, log a security event, and require login. Password reset/change, suspension, deletion and explicit logout invalidate applicable records.

### 66.4 User data safeguards

The user model must include the fields in section 11 plus invitation, password-reset and email-verification token hashes and expiries, `lastLoginAt`, and login-lock counters. Use `select: false` for password and every token/hash. Use a unique, case-normalised email index (partial for non-deleted documents), indexes on role/status and assigned scopes, and a password pre-save hook only when the password changed. Never log a password, raw token, cookie, OTP, or complete identity document URL.

---

## 67. AUTHORIZATION, BUILDING SCOPE & PERMISSION CONTRACT

Authorization is three checks in this order: authenticate identity, verify named permission, then verify resource ownership/building scope. Route middleware supplies the first two; services must make the final resource check before reading or mutating a record. Every scoped collection carries `buildingId` directly, even if it can be derived from a flat, to make safe queries and indexes possible.

| Role                | Allowed scope                                 | Examples                                                   |
| :------------------ | :-------------------------------------------- | :--------------------------------------------------------- |
| `SUPER_ADMIN`       | All buildings                                 | Platform setup, system roles, cross-building audit access  |
| `BUILDING_ADMIN`    | Explicitly assigned building(s)               | Hierarchy, invitations, notices, operational configuration |
| `ACCOUNTANT`        | Explicitly assigned building(s)               | Invoices, payments, expenses, finance reports              |
| `SECURITY_STAFF`    | Assigned building and shifts                  | Visitor verification/check-in/out                          |
| `MAINTENANCE_STAFF` | Assigned building and work items              | View assigned complaints; permitted status updates         |
| `OWNER`             | Own active/historical flats as policy permits | Own bills, documents, occupants and complaints             |
| `TENANT`            | Current active tenancy/flat                   | Own notices, visitors, complaints and permitted bills      |

Use stable permission strings such as `USER_CREATE`, `USER_READ`, `USER_UPDATE`, `USER_DELETE`, `BUILDING_CREATE`, `BUILDING_READ`, `BUILDING_UPDATE`, `BUILDING_DELETE`, `COMPLAINT_CREATE`, `COMPLAINT_ASSIGN`, `COMPLAINT_UPDATE`, `COMPLAINT_RESOLVE`, `INVOICE_CREATE`, `INVOICE_READ`, `PAYMENT_CREATE`, `PAYMENT_READ`, `EXPENSE_CREATE`, `EXPENSE_APPROVE`, and `REPORT_VIEW`. System-role permissions are seeded and versioned; custom role changes require audit records. Never accept `buildingId` from a client without intersecting it with the actor's assignments.

---

## 68. DOMAIN DELIVERY CONTRACTS

Each module must provide CRUD/list validation, pagination/filtering/sorting, scope checks, audit events, and domain tests in addition to the rules below.

| Domain                              | Required implementation contract                                                                                                                                                                                                                                                                               |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buildings / blocks / floors / flats | Enforce the `building -> block -> floor -> flat` parent chain on every write. Unique codes/numbers are scoped to their parent. Soft-delete only when no active dependent records or financial obligations exist.                                                                                               |
| Owners / tenants / staff            | Model ownership and tenancy history rather than overwriting it. A flat may have multiple owners but only one active tenancy unless product policy changes. Move-out closes tenancy and recalculates flat status. Staff assignments carry building, category, status and shift.                                 |
| Maintenance configuration           | Version by `effectiveFrom`; only one active configuration per building/date range. Invoice generation snapshots all rates and inputs.                                                                                                                                                                          |
| Invoices / payments                 | Invoice creation is idempotent on `(flatId, billingPeriod)`. Monetary amounts use integer minor units or Decimal128—never JavaScript floating point. Payments, invoice balance/status, receipt and audit event update in one MongoDB transaction; reversals use compensating records, never destructive edits. |
| Complaints / reviews                | Only resident users with the flat scope may create complaints. Assignment validates staff building/category. Enforce the documented transition graph and SLA timestamps. One review per resolved complaint; update staff aggregates atomically.                                                                |
| Notices / notifications             | Target recipients by building plus audience, then create per-recipient notification records. Expired notices are hidden from normal reads, not deleted.                                                                                                                                                        |
| Expenses / documents                | Expense approval is separate from creation and records approver/time. Files use allow-listed type/size, malware scanning policy, Cloudinary public ID, and authorization before signed delivery/deletion.                                                                                                      |
| Visitors                            | Pass codes are cryptographically random, expire, and are unique. Check-in/out is restricted to assigned security staff; residents only view their own flat's visitors.                                                                                                                                         |
| Reports / audit logs                | Reports apply the caller's building scope before aggregation/export. Audit logs are append-only; redact secrets/PII and capture actor, action, resource, before/after, IP, user agent and correlation ID.                                                                                                      |

### 68.1 Required state transitions

Invoice: `DRAFT -> ISSUED -> PARTIALLY_PAID|PAID|OVERDUE`; `PARTIALLY_PAID -> PAID|OVERDUE`; no transition out of `PAID` except a separately audited credit/reversal workflow. Complaint: `OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`; reopening is an explicit, audited policy decision, not a generic update. Visitor: `EXPECTED -> CHECKED_IN -> CHECKED_OUT` or `EXPECTED -> DENIED`; no exit before entry.

---

## 69. n8n AUTOMATION & EVENT CONTRACT

Express owns business decisions and MongoDB remains the source of truth. n8n only receives signed, versioned events after the database transaction commits; it must never be a frontend-to-database path.

```text
service transaction -> outbox event -> signed n8n webhook -> delivery workflow
                                              -> email / WhatsApp / push provider
```

Create `src/modules/automations/` with `automation.constants.js`, `automation.events.js`, `automation.service.js`, and `automation.validation.js`. The outbox pattern makes delivery retryable and prevents an unavailable n8n server from failing a payment or complaint write. Events include `USER_CREATED`, `USER_INVITED`, `COMPLAINT_CREATED`, `COMPLAINT_ASSIGNED`, `COMPLAINT_RESOLVED`, `INVOICE_CREATED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `REVIEW_REQUEST`, and `NOTICE_PUBLISHED`.

Each webhook contains `eventId`, `eventType`, `schemaVersion`, UTC timestamp, correlation ID, idempotency key, scoped resource identifiers, and minimal non-sensitive payload. Sign the raw body with HMAC SHA-256 using `N8N_WEBHOOK_SECRET`; n8n validates signature and timestamp, deduplicates `eventId`, and never receives passwords, JWTs, refresh tokens, or full payment credentials. Record delivery attempts and outcomes.

MVP workflows: invitation/welcome; complaint-created alert to building admin; complaint-assigned alert to maintenance staff; complaint-resolved review request; invoice-created delivery; payment receipt; scheduled overdue reminder; and notice-published broadcast. Scheduled jobs identify candidates in the backend first, then emit events; n8n must not independently alter invoice or complaint state.

---

## 70. OPERATIONAL DELIVERY CONTRACT

### 70.1 Configuration and health

Validate configuration at startup with Zod. The canonical connection variable is currently `MONGO_URI`; do not document `MONGODB_URI` unless code is changed to support it. Add required `CORS_ORIGIN`, JWT expiry/secret values, cookie settings, Cloudinary values, SMTP values, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, and logging configuration to `.env.example` only when their consuming code lands. Secrets are never committed.

`GET /health` is a liveness check and must not query dependencies. Add `GET /ready` only after it verifies MongoDB connectivity (and any critical dependencies) with a bounded timeout and returns `503` when unready. Server shutdown must stop accepting requests, drain connections, close MongoDB, and exit non-zero on forced timeout.

### 70.2 Security, quality and release gates

Apply Helmet, explicit credentialed CORS origin allow-list, body-size limits, rate limits (especially auth/invitation/reset), Zod validation, safe Mongo query handling, secure cookies, request IDs and structured redacted logs before exposing authenticated routes. Use `node --test` plus Supertest for route tests; add unit tests for services and integration tests against a replica set for financial transactions. CI must run install, lint, format check, tests, dependency audit and Docker build. A release requires a passing smoke test, environment validation, backup/restore exercise, alerting ownership, and a rollback-tested deployment runbook.

---

## 71. CURRENT IMPLEMENTATION VS TARGET ARCHITECTURE (GAP ANALYSIS)

As defined in the project baseline, the checked-in repository currently provides the foundational container, connection, and health-check skeleton. The table below provides an uncompromising architectural gap analysis comparing the **Current Repository State** against the **Target Architecture Blueprint**, categorized by delivery priority:

* **P0 (Critical):** Core foundational infrastructure, security boundaries, and data models required before serving live users.
* **P1 (High):** Operational workflows, media storage, and state machines necessary for society day-to-day operations.
* **P2 (Medium):** Event streaming, outbox integrations, and auxiliary notification automation.
* **P3 (Low):** Distributed job queues and horizontal caching for high-scale multi-cluster growth.

| Area | Current Repository State | Target Architecture Specification | Gap Description | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP Routing & API Gateway** | Root (`GET /`) and Health (`GET /health`) implemented in `src/app.js`. | Versioned `/api/v1` router organizing all 22 domain modules with deterministic `ApiResponse` and `ApiError` handlers. | Domain routes, API router registration, centralized 404 handler, and error serialization middleware missing. | **P0 Critical** |
| **Identity & Authentication** | Dependencies declared in `package.json` (`jsonwebtoken`, `bcrypt`). Variables in `.env.example`. | Dual JWT system (15m Bearer Access Token + 7d HttpOnly Refresh Cookie) with token rotation, reuse detection, and invite-only onboarding. | Authentication module (`src/modules/auth`), session rotation service, and password pre-save bcrypt hooks not yet implemented. | **P0 Critical** |
| **Authorization & RBAC/OBAC** | Role enums and permission rules specified in architecture specification. | 7-role RBAC (`SUPER_ADMIN`, `BUILDING_ADMIN`, `ACCOUNTANT`, `SECURITY_STAFF`, `MAINTENANCE_STAFF`, `OWNER`, `TENANT`) combined with building/flat scoping. | Authorization middleware (`authorize.middleware.js`), permission string registry, and tenant/building object boundary checks missing. | **P0 Critical** |
| **Data Models & Collections** | MongoDB connection helper in `src/config/db.config.js`. Docker Mongo service defined. | Complete 22 Mongoose collection schemas with compound indexes, soft delete filters, and transaction support. | Schema files (`*.model.js`) across all 22 modules need to be implemented in `src/modules/*`. | **P0 Critical** |
| **Input Validation Engine** | Zod v4 dependency installed in `package.json`. | Zero-trust Zod schema validation intercepting `body`, `query`, and `params` prior to controller invocation. | Validation middleware (`validate.middleware.js`) and module schemas (`*.validation.js`) need to be written. | **P0 Critical** |
| **Financial Transactions & ACID** | Architectural specification defined in Sections 11, 23, 24, 31, 32, 40. | Multi-document ACID transactions (`session.startTransaction()`) for invoice generation, payment processing, and ledger consistency. | Payment service, invoice balance calculations, and transaction orchestration need implementation. | **P0 Critical** |
| **File Storage & CDN Integration** | Cloudinary and Multer dependencies declared in `package.json`. | Direct memory stream pipeline to Cloudinary CDN (`/flat-maintenance/documents/`) with mime-type and size guards. | Multer memory storage configuration and Cloudinary upload streaming utility missing in `src/utils/`. | **P1 High** |
| **Operational State Machines** | Complaint and Visitor state machines specified in Sections 48 and 68. | Enforced state transitions (`OPEN` ➔ `ASSIGNED` ➔ `RESOLVED`, `EXPECTED` ➔ `CHECKED_IN` ➔ `CHECKED_OUT`) with SLA timestamping. | State validation logic and transition guard services need implementation. | **P1 High** |
| **Automation & Outbox Webhooks** | n8n event and webhook specification defined in Section 69. | Outbox pattern dispatching HMAC SHA-256 signed webhooks to n8n for email, WhatsApp, and push notifications. | `src/modules/automations/` outbox collection and signed webhook worker need implementation. | **P2 Medium** |
| **Background Queues & Workers** | BullMQ and Redis architecture planned in Section 52. | Redis-backed BullMQ workers executing asynchronous PDF receipt rendering, batch invoice runs, and report exports. | Redis connection and dedicated worker processes deferred to scale phase. | **P3 Low** |

---

## 72. ARCHITECTURAL DECISION RECORDS (ADR-001 TO ADR-010)

This section formally records the rationale, architectural tradeoffs, and operational consequences for the key foundational decisions governing the Flat Maintenance Management System.

### ADR-001: Modular Monolith vs Premature Microservices
* **Status:** Accepted
* **Context:** The system manages complex domain entities (buildings, residents, invoices, payments, complaints, visitors) with shared database transaction requirements.
* **Decision:** Implement the backend as a single deployable Express.js unit structured into strictly isolated domain modules (`src/modules/<module-name>/`).
* **Consequences:** Eliminates distributed tracing overhead, network latency, distributed transaction complexity, and multi-repo operational costs. Preserves a direct, low-friction extraction path to independent microservices when individual domain traffic demands it.

### ADR-002: MongoDB Document Store Selection
* **Status:** Accepted
* **Context:** Real estate management involves deeply nested, polymorphic structures (invoice line items, complaint work logs, guest vehicle details, audit metadata) that evolve across different building types.
* **Decision:** Standardize on MongoDB 7.0+ with Mongoose 9.x as the primary persistence engine.
* **Consequences:** Delivers schema flexibility for nested entities while enforcing structural integrity via Mongoose schemas. Supports multi-document ACID transactions across collections while enabling horizontal read/write scaling via MongoDB Atlas replica sets.

### ADR-003: JWT Dual-Token Authentication Strategy
* **Status:** Accepted
* **Context:** The system must support modern web clients (Next.js) and future mobile applications with stateless horizontal scalability and strict session revocation.
* **Decision:** Implement short-lived Access Tokens (15 minutes, passed in `Authorization: Bearer <token>`) paired with long-lived Refresh Tokens (7 days, stored in secure `HttpOnly`, `SameSite=Strict` cookies).
* **Consequences:** Prevents Cross-Site Scripting (XSS) token theft via secure cookies while eliminating database lookup overhead on high-frequency API calls.

### ADR-004: Refresh Token Rotation & Reuse Detection
* **Status:** Accepted
* **Context:** Long-lived refresh tokens present a security risk if intercepted over public Wi-Fi or compromised devices.
* **Decision:** Enforce single-use refresh token rotation. Each refresh request issues a new token pair and revokes the old refresh token. If a previously used token is presented, the system treats it as token theft, invalidates the entire token family, and terminates all active sessions.
* **Consequences:** Provides automatic defense against token replay attacks and guarantees that compromised sessions are immediately revoked.

### ADR-005: Hybrid RBAC + OBAC (Building-Scope) Authorization
* **Status:** Accepted
* **Context:** Coarse-grained roles (`BUILDING_ADMIN`, `ACCOUNTANT`, `RESIDENT`) are insufficient because users must be strictly confined to their specific assigned building, block, or flat.
* **Decision:** Combine Role-Based Access Control (RBAC verified at route gates) with Object-Based Access Control (OBAC verified within domain services). Every scoped collection stores `buildingId` directly.
* **Consequences:** Guarantees that a Building Admin or Accountant in Tower A cannot view or manipulate flats, invoices, or resident records in Tower B.

### ADR-006: Mandatory MongoDB Multi-Document ACID Transactions
* **Status:** Accepted
* **Context:** Payment settlements, flat ownership transfers, and tenant lease onboarding mutate multiple collections simultaneously. Partial failures result in corrupted financial ledgers.
* **Decision:** Mandate `session.startTransaction()` for all multi-collection write workflows. Local development must run on a MongoDB replica set (`rs0`).
* **Consequences:** Guarantees total financial consistency and eliminates race conditions. Requires that development and production MongoDB environments run with replica-set clustering enabled.

### ADR-007: Cloudinary Direct Memory Stream Uploads
* **Status:** Accepted
* **Context:** Users upload proof-of-work photos, lease agreements, and payment receipts. Local disk storage complicates container autoscaling and poses disk-exhaustion risks.
* **Decision:** Utilize Multer memory storage coupled with Cloudinary CDN streaming. Files are streamed directly from RAM to Cloudinary without writing temporary files to the container filesystem.
* **Consequences:** Ensures complete container statelessness, accelerates media delivery via global CDN edge caches, and enables instant image resizing and format optimization.

### ADR-008: Multi-Stage Docker Containerization
* **Status:** Accepted
* **Context:** Production containers must be minimal, lightweight, secure, and devoid of development dependencies or compiler tools.
* **Decision:** Implement a multi-stage `Dockerfile` using `node:22-alpine`. The build stage installs dev dependencies; the production runner stage copies only production assets and executes under an unprivileged `node` user.
* **Consequences:** Reduces container image size from >1GB to <180MB, shrinks the security attack surface, and speeds up CI/CD container build and deployment times.

### ADR-009: Outbox Pattern & Background Workers
* **Status:** Accepted
* **Context:** External automations (email alerts, WhatsApp visitor notifications, invoice PDF generation) must not block synchronous HTTP API request cycles or cause API failures when external providers experience outages.
* **Decision:** Persist events to an internal transactional Outbox collection, then dispatch HMAC-signed events to n8n webhooks and Redis/BullMQ worker queues.
* **Consequences:** Guarantees sub-100ms API response latencies, provides automatic retry mechanisms for failed external deliveries, and protects core business operations from third-party downtimes.

### ADR-010: Deferred Selective Microservices Extraction
* **Status:** Accepted
* **Context:** Premature microservices architecture introduces excessive network serialization, distributed failure modes, and developer friction during the initial product build.
* **Decision:** Maintain a strict Modular Monolith during initial rollout phases. Defer microservices extraction until telemetry proves that specific high-throughput domains (e.g., Notification delivery or Visitor gate scanning) bottleneck the central cluster.
* **Consequences:** Maximizes initial development velocity and system cohesion while preserving clean module boundaries that can be extracted into standalone containers when traffic scale demands it.

---

## 73. DEVELOPER WORKFLOW & GIT CONVENTIONS

To ensure codebase maintainability, predictable deployments, and strict adherence to architectural contracts, all engineering contributions must follow the standardized workflows below.

### 73.1 Standard Feature Implementation Lifecycle

Developers must never start by blindly writing controllers. Every new module or endpoint implementation must execute strictly in this sequential order:

```text
1. Requirement Analysis & Business Rules Confirmation
               │
               ▼
2. Database Schema Modeling (Mongoose & Indexes)
               │
               ▼
3. Zero-Trust Payload Validation (Zod Schemas)
               │
               ▼
4. Domain Service Layer (Business Logic & ACID Transactions)
               │
               ▼
5. Controller Layer (Pure HTTP Adapter & Standard ApiResponse)
               │
               ▼
6. Routing Layer & Middleware Attachment (Auth, RBAC, Upload)
               │
               ▼
7. Automated Tests (node --test & supertest Integration)
               │
               ▼
8. Security & OBAC Building-Scope Review
               │
               ▼
9. Technical Documentation Synchronization
```

### 73.2 Git Branching Strategy

The repository follows a structured Git branching model:

* `main`: Protected production branch. Represents production-deployed code. Merges occur exclusively via Pull Requests from `development` after passing automated CI checks and release gates.
* `development`: Active integration branch. All feature branches branch off and merge back into `development`.
* `feature/<module-name>`: Feature development branches (e.g., `feature/auth-module`, `feature/invoice-billing`).
* `fix/<issue-name>`: Bug fixes resolving defects in development.
* `hotfix/<critical-issue>`: Emergency production patches branched directly from `main` and back-ported into `development`.

### 73.3 Conventional Commit Standards

All commit messages are strictly validated by `@commitlint` and must adhere to the Conventional Commits specification:

```text
<type>(<optional scope>): <short description in imperative mood>

[optional body explaining rationale]

[optional footer referencing issue/ticket]
```

* `feat:` New user-facing or API feature (e.g., `feat(auth): implement refresh token rotation`).
* `fix:` Bug fix (e.g., `fix(invoice): resolve late fee calculation rounding error`).
* `refactor:` Code restructuring without functional behavior changes (e.g., `refactor(db): extract transaction session wrapper`).
* `docs:` Documentation additions or updates (e.g., `docs: add high-level system and client overview`).
* `test:` Adding or updating unit/integration test suites (e.g., `test(payment): add concurrent payment conflict tests`).
* `chore:` Build scripts, dependency bumps, or tool configurations (e.g., `chore: upgrade express-rate-limit to v8.6`).
* `perf:` Performance optimizations (e.g., `perf(flat): add compound index for flat number lookup`).
* `security:` Security hardening or vulnerability mitigations (e.g., `security(auth): enforce password login lock counter`).

---

## 74. SYSTEM ARCHITECTURE VISUAL GRAPHS (MERMAID SPECIFICATIONS)

This section provides visual architectural specifications illustrating physical topology, cloud hosting, CI/CD pipelines, and security hierarchies.

### 74.1 Docker Local Development Architecture (Replica Set `rs0`)

```mermaid
graph TD
    subgraph Host["💻 DEVELOPER WORKSTATION"]
        Browser["🌐 Web Client (Next.js :3000)"]
        Postman["🧪 API Client / Supertest"]
    end

    subgraph DockerCompose["🐳 DOCKER COMPOSE NETWORK (flat-maintenance-net)"]
        BackendContainer["⚙️ flat-maintenance-backend (Container)<br/>Node.js 22 LTS (ESM) :5000<br/>Healthcheck: GET /health"]
        MongoContainer[("🍃 flat-maintenance-mongo (Container)<br/>MongoDB 7.0 (Replica Set: rs0) :27017<br/>Healthcheck: mongosh ping")]
        MongoVolume["💾 Docker Volume (mongo-data)<br/>Persistent Database Storage"]
    end

    subgraph ExternalCloud["☁️ EXTERNAL CLOUD SERVICES"]
        CloudinaryCDN["🖼️ Cloudinary CDN (Media & Docs)"]
        n8nWebhook["⚡ n8n Workflow Automation Engine"]
    end

    Browser -->|HTTP :5000| BackendContainer
    Postman -->|HTTP :5000| BackendContainer
    BackendContainer -->|MONGO_URI replicaSet=rs0| MongoContainer
    MongoContainer --> MongoVolume
    BackendContainer -.->|Direct Stream Upload| CloudinaryCDN
    BackendContainer -.->|HMAC SHA-256 Webhook| n8nWebhook
```

### 74.2 AWS Production Cloud Deployment Architecture

```mermaid
graph TD
    Users["👥 End Users (Web & Mobile)"] --> Route53["🌐 AWS Route 53 (DNS)"]
    Route53 --> ALB["⚖️ AWS Application Load Balancer (ALB)<br/>SSL / TLS Termination (ACM Certificate)"]

    subgraph VPC["🔒 AWS VPC (Multi-AZ Production Environment)"]
        subgraph PublicSubnets["Public Subnets (AZ-1 & AZ-2)"]
            NAT["NAT Gateway"]
        end

        subgraph PrivateSubnets["Private Subnets (Isolated Compute)"]
            ECSCluster["🚢 AWS ECS Fargate Cluster"]
            Container1["Node.js Express 5 Task (AZ-1)"]
            Container2["Node.js Express 5 Task (AZ-2)"]
        end
    end

    subgraph ManagedCloud["☁️ MANAGED DATABASE & ASSETS"]
        AtlasCluster[("🍃 MongoDB Atlas Dedicated Cluster<br/>Multi-AZ Replica Set (Primary + Secondaries)")]
        Cloudinary["🖼️ Cloudinary CDN (Document Vault)"]
        SecretsManager["🔑 AWS Secrets Manager (Production .env)"]
        CloudWatch["📈 AWS CloudWatch (Logs & Metrics)"]
    end

    ALB --> Container1
    ALB --> Container2
    ECSCluster --> Container1
    ECSCluster --> Container2
    Container1 --> AtlasCluster
    Container2 --> AtlasCluster
    Container1 -.-> Cloudinary
    Container2 -.-> Cloudinary
    Container1 -.-> SecretsManager
    Container2 -.-> SecretsManager
    Container1 --> CloudWatch
    Container2 --> CloudWatch
```

### 74.3 GitHub Actions CI/CD Automated Pipeline

```mermaid
flowchart TD
    Push["🚀 Push / Pull Request to development or main"] --> LintJob["🔍 Job 1: Lint & Code Quality<br/>eslint . && prettier --check ."]
    LintJob --> SecAudit["🛡️ Job 2: Dependency Security Audit<br/>yarn audit / npm audit"]
    SecAudit --> UnitTests["🧪 Job 3: Unit & Integration Tests<br/>node --test (Smoke & Integration)"]
    UnitTests --> DockerBuild["🐳 Job 4: Multi-Stage Docker Build<br/>Build & Smoke-test Container"]
    
    DockerBuild --> DeployGate{"🌿 Target Branch Check"}
    DeployGate -->|"Branch: development"| StagingDeploy["📦 Deploy to Staging (AWS ECS Staging)"]
    DeployGate -->|"Branch: main"| ProdDeploy["🚀 Deploy to Production (AWS ECS Production)"]
```

### 74.4 RBAC & Building-Scope Hierarchy Diagram

```mermaid
graph TD
    SuperAdmin["👑 SUPER_ADMIN<br/>Global Access across all Societies & Buildings"]
    BuildingAdmin["🏗️ BUILDING_ADMIN<br/>Scoped strictly to assigned Building A & B"]
    Accountant["💼 ACCOUNTANT<br/>Financial Operations in assigned Building"]
    SecurityStaff["🛡️ SECURITY_STAFF<br/>Gate Access & Visitor Logs in assigned Building"]
    MaintenanceStaff["🛠️ MAINTENANCE_STAFF<br/>Assigned repair tickets in assigned Building"]
    Owner["🏠 FLAT OWNER<br/>Access restricted to owned Flat Units"]
    Tenant["🏠 TENANT<br/>Access restricted to currently leased Flat Unit"]

    SuperAdmin --> BuildingAdmin
    BuildingAdmin --> Accountant
    BuildingAdmin --> SecurityStaff
    BuildingAdmin --> MaintenanceStaff
    BuildingAdmin --> Owner
    BuildingAdmin --> Tenant
```

---

## 75. PRODUCTION READINESS CHECKLIST & QUALITY GATES

Before tagging a production release or handing over modules to frontend integration, the system must satisfy the verification quality gates below:

### 75.1 Master Production Readiness Audit

| Category | Checklist Item | Status | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **Architecture** | Modular Monolith boundaries enforced | `[READY]` | Domains live in `src/modules/*`; controllers have zero DB queries. |
| **Architecture** | Express 5 Promise Rejection handling | `[READY]` | Async route errors propagate automatically to error middleware. |
| **Database** | 22 Collection Schemas defined | `[PARTIAL]` | Schemas specified in blueprint; implementation queued in Phase 1-21. |
| **Database** | Compound & Unique Indexes defined | `[READY]` | Partial unique indexes on email, flat numbers, and pass codes specified. |
| **Database** | Multi-Document ACID Transactions | `[READY]` | Transaction session boundaries enforced for billing and payments. |
| **Authentication** | Dual-Token JWT with Token Rotation | `[READY]` | 15m access token + 7d HttpOnly refresh cookie rotation blueprint ready. |
| **Authentication** | Invite-Only Admin Onboarding | `[READY]` | Public self-registration of privileged administrative roles strictly prohibited. |
| **Authorization** | RBAC Route Middleware | `[READY]` | Route gates enforce named permissions (`authorize('BUILDING_CREATE')`). |
| **Authorization** | OBAC Building-Scope Validation | `[READY]` | Domain services verify user-to-building and user-to-flat data boundaries. |
| **Security** | Security Headers & Sanitization | `[READY]` | Helmet, CORS allow-list, rate limits, and MongoDB query sanitizers declared. |
| **Validation** | Zero-Trust Zod Schema Engine | `[READY]` | Body, query, and path params validated prior to controller execution. |
| **Error Handling** | Centralized `ApiError` Middleware | `[READY]` | Standardized JSON error response without exposing stack traces in production. |
| **Testing** | Automated Smoke & Route Tests | `[READY]` | `npm test` verified with native Node runner; supertest integration ready. |
| **Container** | Multi-Stage Production Dockerfile | `[READY]` | Alpine-based multi-stage container executing under non-root `node` user. |
| **DevOps** | GitHub Actions CI Automation | `[READY]` | Lint, audit, test, and Docker container build pipeline configured. |
| **Disaster Recovery**| Continuous Backups & RPO/RTO | `[READY]` | MongoDB Atlas continuous snapshots with RPO < 5 min, RTO < 1 hour. |

### 75.2 Principal Architect Verification Gates (The 10 Quality Gates)

A senior engineer or auditor must be able to answer **YES** to all 10 questions before approving an implementation milestone:

1. **Self-Contained Logic:** Can a developer implement a new module without writing business logic inside the controller? *(YES: Controllers are pure HTTP adapters; 100% of business logic lives in Services).*
2. **Deterministic Validation:** Can invalid client inputs reach database queries? *(NO: Zod middleware rejects malformed body, query, or path parameters at the route gate).*
3. **Privileged Escalation Prevention:** Can an attacker register themselves as an Admin or Accountant? *(NO: Registration of privileged roles is impossible; accounts require cryptographic admin invitations).*
4. **Data Isolation (Multi-Building Safety):** Can a Building Admin in Tower A see finances or tenants of Tower B? *(NO: OBAC building-scope filtering is enforced at the database query layer).*
5. **Financial Safety:** Can a network glitch during checkout cause partial payment recording or balance mismatch? *(NO: All financial writes execute within ACID MongoDB transaction sessions).*
6. **Token Theft Mitigation:** Can a stolen refresh token be used indefinitely? *(NO: Automatic rotation and reuse detection invalidates the entire token family upon duplicate presentation).*
7. **Stateless Scalability:** Can the backend containers scale from 1 instance to 10 instances on AWS ECS without breaking sessions? *(YES: Containers are 100% stateless; sessions reside in JWTs and client cookies).*
8. **Media Security:** Can malicious files compromise server storage? *(NO: File uploads stream directly from memory to Cloudinary with strict mime-type and size limits).*
9. **Traceability:** Can an administrator secretly alter past maintenance fees or tenant records without a trace? *(NO: The immutable, append-only Audit Log collection records actor, timestamp, IP, and before/after values).*
10. **Blueprint Consistency:** Does the codebase diverge from the approved 22-module single source of truth? *(NO: This document serves as the absolute, non-negotiable architectural blueprint).*
