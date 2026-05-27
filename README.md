# HAQMS — Hospital Appointment & Queue Management System

> **SDE Internship Assessment Submission**
> Audited, refactored, and documented by **Aryan Mishra**

HAQMS is a full-stack Hospital Appointment & Queue Management System. This repository was submitted as part of an SDE Internship technical assessment, with a focus on security hardening, performance optimization, concurrency safety, and frontend reliability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, React, Context API, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL, Prisma ORM |

---

## Local Setup

### Prerequisites

- Node.js v18+
- PostgreSQL (or Docker)
- npm

---

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HAQMS
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

**Backend** — create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/haqms?schema=public"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development
```

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start PostgreSQL

Using Docker:

```bash
docker-compose up -d
```

### 5. Set Up the Database

```bash
npm run db:setup --prefix backend
```

This will:
- Apply all Prisma migrations
- Seed the database with mock application data

### 6. Start the Application

Run backend and frontend separately:

```bash
npm run dev:backend
npm run dev:frontend
```

Or start both together:

```bash
npm run dev
```

---

## Default Accounts

> All seed accounts use the password: `password123`

| Role | Email |
|---|---|
| Administrator | `admin@haqms.com` |
| Receptionist | `reception1@haqms.com` |
| Doctor | `doctor1@haqms.com` |

---

## Audit & Refactoring Summary

This repository was reviewed and refactored across six domains. All critical and high-severity issues have been resolved.

### Security

| Fix | Status |
|---|---|
| Removed sensitive credential logging from auth routes | ✅ |
| Enforced JWT expiration validation | ✅ |
| Removed hardcoded JWT secret fallback | ✅ |
| Fixed authorization bypass in admin middleware | ✅ |
| Fixed SQL injection vulnerability in doctor search | ✅ |
| Removed password hash exposure from registration response | ✅ |
| Eliminated internal error and stack trace leakage | ✅ |

### Performance

| Fix | Status |
|---|---|
| Resolved N+1 query problem in appointment retrieval | ✅ |
| Parallelized independent aggregation queries | ✅ |
| Refactored slow administrative reporting endpoint | ✅ |
| Moved pagination to database layer | ✅ |

### Concurrency

| Fix | Status |
|---|---|
| Fixed queue token race condition (read-then-write pattern) | ✅ |

### Frontend

| Fix | Status |
|---|---|
| Fixed polling interval memory leak on queue page | ✅ |
| Fixed React Hook violations causing dashboard crashes | ✅ |
| Migrated hardcoded API URL to environment variable | ✅ |

### Database

| Fix | Status |
|---|---|
| Reconstructed missing Prisma schema | ✅ |
| Restored migrations and seed data | ✅ |
| Added indexes on high-frequency query fields | ✅ |

---

## Documentation

Full findings, risk assessments, and remediation details are documented in:

```
AUDIT_REPORT.md
```

---

## Notes

A small number of findings were documented but not fully implemented within the assignment scope, due to time constraints or repository boundaries. Prioritization was based on:

- Security impact and attack surface
- Data integrity risk
- Application stability
- Production readiness

---

## Candidate

**Aryan Mishra**
SDE Intern Assessment Submission — 27 May 2026