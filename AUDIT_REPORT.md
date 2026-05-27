# HAQMS Security, Performance & Reliability Audit Report

| | |
|---|---|
| **Candidate** | Aryan Mishra |
| **Position** | Software Development Engineer Intern |
| **Project** | HAQMS — Hospital Appointment & Queue Management System |
| **Report Date** | 27 May 2026 |
| **Classification** | Internal — Audit Submission |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Environment & Setup Findings](#2-environment--setup-findings)
3. [Security Audit](#3-security-audit)
4. [Backend Performance Review](#4-backend-performance-review)
5. [Concurrency Review](#5-concurrency-review)
6. [Database Design Review](#6-database-design-review)
7. [Frontend Reliability Review](#7-frontend-reliability-review)
8. [Identified — Pending Resolution](#8-identified--pending-resolution)
9. [Challenge 5 Observation](#9-challenge-5-observation)
10. [Conclusion](#10-conclusion)

---

## 1. Executive Summary

A structured audit of the HAQMS codebase was conducted across the following domains:

- Security vulnerabilities and attack surface assessment
- Authentication and authorization integrity
- Backend performance bottlenecks
- Concurrency and race condition risks
- Database design and query efficiency
- Frontend reliability and memory management
- Project setup and deployment readiness

Multiple issues were identified spanning severity levels from critical security vulnerabilities to moderate architectural concerns. Remediation was prioritized according to **production risk**, **user data impact**, **data integrity**, and **application stability**.

All critical and high-severity findings have been resolved. Lower-priority architectural improvements have been documented for future iteration.

---

## 2. Environment & Setup Findings

### 2.1 Missing Prisma Infrastructure

**Observation**

The distributed repository was incomplete — the following artifacts were absent:

- `prisma/schema.prisma`
- Database migration files
- Seed scripts

**Impact**

- Prisma Client generation failed
- Backend service could not be initialized
- Database setup commands produced errors

**Resolution**

The following were reconstructed from scratch to restore a functional development environment:

- Prisma schema definition
- Database migration history
- Seed data for local testing
- Local PostgreSQL configuration

**Outcome**

Backend service can now be initialized, migrated, and executed successfully.

---

## 3. Security Audit

> **Scope:** Authentication flows, authorization middleware, API response handling, query construction, and token management.

---

### 3.1 Credential Logging

| Attribute | Detail |
|---|---|
| **Severity** | Critical |
| **Status** | ✅ Resolved |

**Finding**

User registration and login routes were logging sensitive authentication data — including plaintext passwords — directly to the server console.

**Risk**
- Credential exposure via log files
- Potential leakage through log aggregation or monitoring tools
- Direct violation of production security standards

**Resolution**

Password logging was removed entirely. Safe operational logging was substituted, capturing only non-sensitive request metadata.

---

### 3.2 Weak JWT Configuration

| Attribute | Detail |
|---|---|
| **Severity** | Critical |
| **Status** | ✅ Resolved |

**Finding**

JWT validation logic was misconfigured in two respects:

1. Expired tokens were accepted without rejection
2. A hardcoded fallback secret was used when no environment variable was present

**Risk**
- Unauthorized session access via expired tokens
- Token replay attacks
- Compromised authentication integrity across the system

**Resolution**

- Token expiration is now strictly enforced during validation
- JWT secret has been moved to environment variable configuration, with no fallback permitted

---

### 3.3 Authorization Bypass

| Attribute | Detail |
|---|---|
| **Severity** | High |
| **Status** | ✅ Resolved |

**Finding**

Legacy administrative middleware did not perform explicit role validation, allowing non-administrative users to potentially invoke privileged endpoints.

**Risk**

Unauthorized access to administrative functionality, including data management and system configuration operations.

**Resolution**

Explicit role-based validation was implemented across all administrative route middleware.

---

### 3.4 SQL Injection Vulnerability

| Attribute | Detail |
|---|---|
| **Severity** | Critical |
| **Status** | ✅ Resolved |

**Finding**

The doctor search functionality constructed SQL queries using unsafe dynamic string interpolation, exposing the application to injection attacks.

**Risk**
- Unauthorized data access or exfiltration
- Potential full database compromise
- Bypass of application-level access controls

**Resolution**

Raw query interpolation was replaced with Prisma ORM filtering and parameterized query execution, eliminating the injection surface entirely.

---

### 3.5 Sensitive Data Exposure in API Responses

| Attribute | Detail |
|---|---|
| **Severity** | High |
| **Status** | ✅ Resolved |

**Finding**

The user registration endpoint returned the full created user object, including the password hash, in the API response body.

**Risk**

Exposure of hashed authentication credentials to API consumers, increasing the attack surface for offline cracking attempts.

**Resolution**

API response sanitization was implemented. Password and authentication-related fields are now explicitly excluded from all user-facing responses.

---

### 3.6 Error Information Leakage

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

Multiple endpoints returned raw exception details and full stack traces in error responses.

**Risk**

Internal system information — including database schema details, implementation specifics, and application architecture — could be inferred by attackers from error output.

**Resolution**

Error handling was standardized across all endpoints. Internal exception details and stack traces are no longer included in API responses.

---

## 4. Backend Performance Review

---

### 4.1 N+1 Query Problem

| Attribute | Detail |
|---|---|
| **Severity** | High |
| **Status** | ✅ Resolved |

**Finding**

Appointment retrieval triggered individual database queries for every related patient and doctor record, resulting in a severe N+1 pattern.

**Example**

> Fetching 100 appointments produced:
> - 1 appointment query
> - 100 patient queries
> - 100 doctor queries
>
> **Total: 201 database round trips per request**

**Resolution**

Prisma relation loading (`include`) was adopted to retrieve all related data within a single query execution.

**Outcome**

Database round trips reduced by approximately 99% for appointment-heavy requests.

---

### 4.2 Sequential Execution of Independent Queries

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

Independent aggregation queries were executed sequentially, introducing unnecessary latency proportional to the number of operations.

**Resolution**

Independent operations were refactored to execute in parallel, reducing cumulative response time.

---

### 4.3 Slow Administrative Reporting Endpoint

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

The administrative reporting endpoint performed nested database queries and included blocking operations that degraded response times significantly.

**Resolution**

Aggregation strategy was refactored and all unnecessary blocking operations were removed.

---

## 5. Concurrency Review

---

### 5.1 Queue Token Race Condition

| Attribute | Detail |
|---|---|
| **Severity** | High |
| **Status** | ✅ Resolved |

**Finding**

Queue token allocation followed a **read-then-write** pattern without atomic guarantees. Under concurrent requests, this allowed multiple allocations to read the same current maximum value before any write was committed, resulting in duplicate token numbers.

**Risk**
- Duplicate queue assignments issued to multiple patients
- Data inconsistency in queue state
- Operational failures in appointment management

**Resolution**

Token allocation logic was refactored to use safer atomic allocation patterns. Database-level uniqueness constraints were strengthened to prevent duplicates from persisting even in edge cases.

---

## 6. Database Design Review

---

### 6.1 Missing Indexes on High-Frequency Query Fields

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

Several fields used frequently in query filters and joins lacked database indexes, causing full table scans on common operations.

**Resolution**

Indexes were added for:
- Foreign key columns
- Status filter fields
- Other high-frequency query fields

---

### 6.2 In-Memory Pagination

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

Patient listing retrieved all records from the database into application memory before applying pagination logic, rendering pagination ineffective as a performance optimization.

**Risk**

Progressive performance degradation as the patient dataset grows.

**Resolution**

Pagination was moved to the database layer using query-level `skip`/`take` parameters, ensuring only the requested page of records is ever fetched.

---

## 7. Frontend Reliability Review

---

### 7.1 Queue Page Memory Leak

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

A polling interval established on component mount was never cleared on component unmount, causing it to persist indefinitely.

**Risk**
- Accumulating memory usage over session duration
- Multiplying API calls as stale intervals stack
- Progressive browser performance degradation

**Resolution**

Proper interval cleanup was implemented via the component unmount lifecycle, ensuring all intervals are cleared when the component is removed from the DOM.

---

### 7.2 Hardcoded API Base URL

| Attribute | Detail |
|---|---|
| **Severity** | Low–Medium |
| **Status** | ✅ Resolved |

**Finding**

The frontend API base URL was hardcoded directly in source code, preventing environment-specific configuration without code modification.

**Resolution**

API base URL configuration was migrated to environment variables, enabling clean environment separation between development, staging, and production.

---

### 7.3 Dashboard Stability Issues

| Attribute | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ✅ Resolved |

**Finding**

The dashboard component contained React Hook ordering violations and improper initialization patterns that caused runtime crashes under certain render conditions.

**Resolution**

Component initialization flow was refactored and hook usage was corrected to comply with React's rules of hooks.

---

## 8. Identified — Pending Resolution

The following issues were identified during the audit but were not addressed within the assignment timeline. They are documented here for future prioritization.

| # | Issue | Area | Priority |
|---|---|---|---|
| 1 | Search input re-render optimization | Frontend | Low–Medium |
| 2 | JWT stored in `localStorage` — should migrate to `HttpOnly` cookies with CSRF protection | Security | Medium |
| 3 | Dashboard component contains multiple responsibilities — should be modularized | Frontend Architecture | Low |

> **Note on localStorage JWT Storage:** While not a critical vulnerability in isolation, storing authentication tokens in `localStorage` exposes them to XSS attacks. The recommended remediation is migration to `HttpOnly` secure cookies paired with a CSRF protection strategy.

---

## 9. Challenge 5 Observation

The assignment specification references the following route:

```
src/app/patients/[id]/history-records/page.js
```

This route structure was **not present** in the version of the codebase distributed for the audit. As a result, the referenced issue could not be reproduced or resolved without implementing application functionality outside the defined project scope.

**Status:** Documented — not actioned due to scope boundary.

---

## 10. Conclusion

This audit addressed the highest-risk concerns across security, backend performance, concurrency safety, database design, and frontend reliability. The table below summarizes findings by domain and resolution status.

| Domain | Findings | Resolved | Pending |
|---|---|---|---|
| Security | 6 | 6 | 0 |
| Backend Performance | 3 | 3 | 0 |
| Concurrency | 1 | 1 | 0 |
| Database Design | 2 | 2 | 0 |
| Frontend Reliability | 3 | 3 | 0 |
| Architectural / Future | 3 | 0 | 3 |
| **Total** | **18** | **15** | **3** |

The application is significantly more secure, stable, and production-ready than the original distributed version. All critical and high-severity findings have been fully remediated. The three remaining items are low-to-medium priority architectural improvements suitable for a future sprint.

---

*Submitted by:*
**Aryan Mishra**
SDE Intern Candidate — 27 May 2026