# Product Requirements Document (PRD)

**Project:** LopyTech Exam Portal — Multi-Tenant SaaS
**Version:** 2.0.0
**Last Updated:** 2026-11-15

---

## 1. Objective

A multi-tenant SaaS platform where **LopyTech (Super Admin)** sells exam portal subscriptions to **clients (Tenant Admins)**, who build exams and share them with **students** via link or QR code.

---

## 2. User Roles & Access

### Super Admin (LopyTech internal)
- Logs in via **credentials** (email + password from `.env`) — no Google OAuth
- Creates, edits, deactivates, and deletes tenants (clients)
- Assigns subscription plans (Starter / Pro / Enterprise) and manages billing status
- Views all tenants, all exams, all results across the entire platform
- Full access to every record — no `tenantId` restriction for Super Admin queries

### Client (Tenant Admin)
- Signs up via onboarding flow (org name + email + Razorpay UI)
- Logs in via **Google OAuth** scoped to their tenant
- Builds exams (Google Forms-style builder — title, duration, free/paid, questions)
- After saving an exam, receives:
  - **Shareable URL:** `http://<domain>/exam/<examId>`
  - **QR Code** (react-qr-code) — downloadable PNG
  - **Copy Link** button
- Manages students: view list, filter by exam / KYC status / date
- Views results: per-exam table with score, time taken, submitted at, per-question breakdown

### Student
- Receives exam link or QR code (no login required to access)
- Opens link → sees exam title/description
- Completes **inline KYC** (name + mobile — 2 fields only, no Aadhaar at this entry point)
- Immediately starts exam after KYC
- 70/30 split UI: question panel (left) + status palette (right)
- On submit → sees score summary

---

## 3. Core Workflows

### 3.1 Super Admin Flow
```
/super-admin/login  →  /super-admin/dashboard
  ├── Tenants list (create / edit / deactivate)
  ├── Tenant detail (exams, students, results for that tenant)
  └── Subscription overview (plan, status, renewal date)
```

### 3.2 Client Onboarding & Exam Flow
```
/onboard  →  form (org name + email)  →  Razorpay UI-only  →  /admin
/admin/exams/new  →  build exam  →  save  →  show QR + link
/admin/students   →  list + filter
/admin/results    →  per-exam results table
```

### 3.3 Student Exam Flow
```
QR / Link → /exam/<examId>
  ├── Show: exam title, duration, subject
  ├── Inline KYC form (name + mobile)
  └── Start Exam → 70/30 UI → Submit → Score summary
```

---

## 4. Pages & Routes

| Route | Role | Description |
|---|---|---|
| `/super-admin/login` | Public | Credentials login for super admin |
| `/super-admin` | Super Admin | Dashboard — tenant list + stats |
| `/super-admin/tenants/new` | Super Admin | Create tenant form |
| `/super-admin/tenants/[id]` | Super Admin | Tenant detail + subscription |
| `/onboard` | Public | Client self-signup + Razorpay UI |
| `/login` | Client | Google OAuth login |
| `/admin` | Tenant Admin | Dashboard — metrics |
| `/admin/exams/new` | Tenant Admin | Exam builder → QR + link output |
| `/admin/exams` | Tenant Admin | Exam list |
| `/admin/students` | Tenant Admin | Student list + filters |
| `/admin/results` | Tenant Admin | Results table |
| `/exam/[examId]` | Public | Student entry — KYC + exam |
| `/student/exam/[examId]` | Student (legacy) | Full exam execution UI |

---

## 5. Tech Constraints
- **No emojis** — lucide-react SVG icons only
- **Server Components** default; `'use client'` only on interactive leaf nodes
- **NEVER** query DB without `tenantId` filter (except Super Admin queries)
- **Razorpay:** UI-only now; wire keys later
- **File uploads:** `/public/uploads/` local; path string stored in Prisma for future S3
- **QR Library:** `react-qr-code`
- **Super Admin auth:** `CredentialsProvider` in NextAuth; env vars `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD`
