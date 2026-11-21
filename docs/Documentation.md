# Developer & Functional Documentation — LopyTech Exam Portal

> **Scope Note:** All behaviors documented below are verified directly against the current repository source code. Features described as *Partially Implemented* or *Not Implemented* indicate gaps between the original planning documents (`/PRD.md`, `/Phases.md`) and the actual code.

---

## 1. Project Introduction & Purpose

**LopyTech Exam Portal** is a multi-tenant SaaS web application for creating, distributing, and taking timed multiple-choice examinations. It enables:
- **Platform Administrators (Super Admin)** to provision and manage client organizations (tenants).
- **Client Organizations (Tenant Admins)** to self-onboard or sign in, create MCQ exams, distribute shareable links and QR codes, and view student cohorts and exam results.
- **Students** to open an exam link/QR code, complete quick identity verification (KYC), take the timed test on desktop or mobile, and view their score immediately upon submission.

---

## 2. Existing Features & Modules (Implementation Status)

| Module / Feature | Status | Details from Codebase |
|---|---|---|
| **Root Landing Page (`/`)** | **Unimplemented (Boilerplate)** | `src/app/page.tsx` is still the default `create-next-app` template page. |
| **Client Self-Onboarding (`/onboard`)** | **Partially Implemented** | Collects org name, admin email, password, and plan (`starter`/`pro`/`enterprise`), creates `Tenant` + `TENANT_ADMIN` user. Payment step is UI-only ("Razorpay Test Mode"). |
| **Client / Unified Login (`/login`)** | **Implemented (Credentials only)** | Authenticates `TENANT_ADMIN`, `STUDENT`, and `SUPER_ADMIN` via NextAuth `'credentials'` provider. Google OAuth is configured in `auth.ts` but has no UI button. |
| **Super Admin Login (`/super-admin/login`)** | **Broken** | Form calls `signIn('super-admin-credentials', ...)` which is not defined in `src/lib/auth.ts` (only `'credentials'` exists). |
| **Super Admin Dashboard (`/super-admin`)** | **Implemented** | Protected by `SUPER_ADMIN` role check. Displays total tenants, exams, results, and tenant table. |
| **Super Admin Tenant CRUD (`/super-admin/tenants/*`)** | **Implemented** | Create new tenant + admin user; view tenant details; change plan; activate/deactivate tenant; delete tenant. |
| **Tenant Admin Dashboard (`/admin`)** | **Implemented (Unprotected)** | Displays exam count, student count, submission count, and up to 5 recent exams with Exam Link & QR Code links. Missing auth guard. |
| **Exam Builder (`/admin/exams/new`)** | **Implemented** | Dynamic `react-hook-form` + Zod MCQ builder (title, description, duration, free/paid toggle, questions, 2–6 options, correct option radio). Generates `ExamShareCard` on save. |
| **Exam List (`/admin/exams`)** | **Not Implemented** | Mentioned in `PRD.md`, but no `/admin/exams/page.tsx` exists; no edit or delete exam UI exists. |
| **Shareable Link & QR (`/components/exam/ExamShareCard.tsx`)** | **Partially Implemented** | Displays SVG QR code (`react-qr-code`), copyable URL, Preview button, and Done button. Downloadable PNG QR is not implemented. |
| **Student Cohort Management (`/admin/students`)** | **Partially Implemented** | Lists `STUDENT` users for a `tenantId` with search (name/mobile/email) and KYC status filter. No exam/date filters and no Aadhaar/selfie document viewer. |
| **Results & Submissions (`/admin/results`)** | **Partially Implemented** | Lists exam submissions with search, exam dropdown filter, and sorting by Score, Percentage, and Time Taken. No per-question answer breakdown or CSV export. |
| **Public Student Exam Entry (`/exam/[examId]`)** | **Implemented** | Supports `/exam/demo` (5 hardcoded questions) or published DB exams. Runs inline KYC -> `ExamUI` -> Score Summary. |
| **Legacy Student KYC & Exam (`/student/kyc`, `/student/exam/[examId]`)** | **Partially Implemented / Broken Redirect** | 2-step KYC redirects to `/student/exam/demo`. Authenticated DB exam submission redirects to `/student/results/[id]`, which does not exist (404). |
| **Paid Exam Checkout (Razorpay B2C)** | **Not Implemented** | `isFree` and `price` are stored on `Exam`, but `/exam/[examId]` never checks `isFree`/`price` or invokes Razorpay. |

---

## 3. User Roles & Permissions

Defined in `prisma/schema.prisma` (`enum Role`):

1. **`SUPER_ADMIN`** (`User.tenantId = null`)
   - Configured via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars (with fallback defaults in `src/lib/auth.ts`).
   - Can access `/super-admin`, `/super-admin/tenants/new`, and `/super-admin/tenants/[id]` to view platform-wide metrics and create/update/toggle/delete tenants.
   - Server actions in `src/app/super-admin/tenants/*/actions.ts` strictly verify `session?.user?.role === 'SUPER_ADMIN'`.

2. **`TENANT_ADMIN`** (`User.tenantId != null`)
   - Created via `/onboard` or `/super-admin/tenants/new`.
   - Signs in at `/login` and is redirected to `/admin?tenant=<tenantId>&org=<orgName>`.
   - Manages exams, students, and results scoped by `tenantId`.
   - **Security Gap:** Admin pages (`/admin*`) and `saveExamAction` do not currently enforce session authentication on the server; `publishExamAction` enforces `TENANT_ADMIN`, though it is not wired to any UI button.

3. **`STUDENT`** (`User.tenantId != null`)
   - Primarily enters via public link `/exam/[examId]` without logging in; `registerStudentAndStartExamAction` creates/reuses a `User` with synthetic email `<mobile>@exam.student`, `role: 'STUDENT'`, and `kycComplete: true`.
   - Legacy route `/student/exam/[examId]` requires an authenticated NextAuth session (`kycComplete: true` is currently hardcoded in `auth.ts` session callback).

---

## 4. Admin Functionality

### Super Admin (`/super-admin`)
- **Dashboard (`/super-admin`):** Server-rendered overview showing counts for Total Tenants, Total Exams, Total Results, and a table of all tenants (Org Name, Slug, Plan, Status, Created date, Manage link).
- **Create Tenant (`/super-admin/tenants/new`):** Form for Organization Name, Tenant Admin Email, Initial Admin Password (defaults to `'Client@123'`), and Subscription Plan (`starter`, `pro`, `enterprise`). Auto-generates a unique slug.
- **Manage Tenant (`/super-admin/tenants/[id]`):** Displays tenant metrics (Users, Exams, Submissions), Exams list, Users list, and `TenantManageClient` controls to switch plans, toggle `isActive` (blocks tenant login when inactive), or delete the tenant (`CASCADE`).

### Client / Tenant Admin (`/admin`)
- **Dashboard (`/admin`):** Shows Total Exams, Enrolled Students, and Exam Submissions for `tenantId` (from `?tenant=` query param, falling back to `session.user.tenantId` or `'demo-tenant'`), plus the 5 most recent exams with quick links to `/exam/[examId]`.
- **Create Exam (`/admin/exams/new`):** Dynamic MCQ builder with title, description, duration (minutes), Free Exam toggle, Price (`₹`), and expandable/collapsible Question Cards.
- **Students (`/admin/students`):** Table showing Student Name, Mobile, KYC Status badge (`Verified` / `Pending`), Exams Taken count, and Joined Date, with live search and KYC dropdown filter.
- **Results (`/admin/results`):** Table showing Student, Mobile, Exam Title, Score (`score / totalMarks`), color-coded Percentage badge, formatted Time Taken, and Date Submitted, with search, exam filter, and ascending/descending sort toggles.

---

## 5. Student / User Functionality

### Primary Public Exam Flow (`/exam/[examId]`)
1. **Exam Intro & Inline KYC (`PublicExamClient.tsx`):**
   - Displays Tenant Name badge, Exam Title, Description, Duration, and Question Count.
   - Collects Full Name (min 2 chars), 10-digit Indian mobile number (`^[6-9]\d{9}$`), optional Aadhaar Card upload (`image/*,.pdf`), and optional live webcam selfie (`react-webcam`).
   - Submits FormData to `registerStudentAndStartExamAction`.
2. **Exam Execution (`ExamUI.tsx` + `examStore.ts`):**
   - Countdown timer (`MM:SS`, turns red at `<= 5:00`), auto-submits when timer hits `0`.
   - Desktop 70/30 split with right-hand sticky `QuestionPalette` (Answered / Not Visited / Review counts + 5-column grid).
   - Mobile sticky bottom action bar (Clear, Review, Previous, Save & Next) + bottom-sheet palette drawer.
   - State persists to `localStorage` (`'exam-state'`).
3. **Score Summary:**
   - Displays score (`score / totalMarks`), percentage badge, and time taken inline on completion.

### Legacy Student Flow (`/student/kyc` & `/student/exam/[examId]`)
- `/student/kyc`: Two-step wizard (Step 1: Name, Gender, Mobile; Step 2: Mandatory Aadhaar file + optional webcam selfie) calling `saveKycAction` and redirecting to `/student/exam/demo`.
- `/student/exam/[examId]`: Supports `examId === 'demo'` (redirects to `/admin?submitted=true` on submit) or authenticated DB exams (redirects to non-existent `/student/results/${result.id}`).

---

## 6. Exam Management, Question & Answer Workflow

1. **Creation (`ExamBuilderClient.tsx` -> `saveExamAction`):**
   - Validates via Zod: non-empty `title`, `durationMinutes >= 1`, `price >= 0`, `questions.length >= 1`, each question has non-empty `text` and `>= 2` non-empty options (up to 6 options via UI).
   - Filters out blank option inputs before saving and checks that `>= 2` filled options remain.
   - `saveExamAction` resolves `tenantId` (explicit param -> session -> DB lookup -> latest active tenant -> auto-created `'Default Exam Portal'`), then creates the `Exam` (`isPublished: true`) and nested `Question` rows with `correctOptionIndex` (`0`-based integer) and `order`.
   - On success, swaps the builder for `<ExamShareCard examId={...} examTitle={...} />`.
2. **Delivery & Grading:**
   - `getExamForStudent(examId)` queries published exams and explicitly selects `{ id, text, options, order }`—`correctOptionIndex` is **not** sent to the client.
   - `submitExamAnswersAction` re-fetches `exam.questions` on the server, compares `selectedIndex === correctOptionIndex`, writes a `Result` row containing `{ score, totalMarks, answers, timeTaken }`, and returns the computed summary.

---

## 7. Database Models Explained (`/prisma/schema.prisma`)

| Model | Purpose | Key Columns |
|---|---|---|
| `Tenant` | Client organization / portal | `id`, `name`, `slug` (unique), `plan`, `isActive`, `razorpaySubscriptionId`, `createdAt` |
| `User` | Platform users (`SUPER_ADMIN`, `TENANT_ADMIN`, `STUDENT`) | `id`, `tenantId` (nullable), `email` (unique), `password` (nullable), `name`, `role`, `kycComplete` |
| `Profile` | Student KYC profile & upload paths | `id`, `tenantId`, `userId` (unique), `name`, `gender`, `mobile`, `aadhaarPath`, `selfiePath` |
| `Exam` | Exam definition belonging to a tenant | `id`, `tenantId`, `title`, `description`, `price`, `isFree`, `durationMinutes`, `isPublished` |
| `Question` | MCQ item belonging to an exam | `id`, `tenantId`, `examId`, `text`, `options` (`Json` string[]), `correctOptionIndex`, `order` |
| `Result` | Student submission & score record | `id`, `tenantId`, `userId`, `examId`, `score`, `totalMarks`, `answers` (`Json`), `timeTaken` |
| `Account` / `Session` / `VerificationToken` | NextAuth Prisma Adapter tables | Standard NextAuth v4 adapter fields |

---

## 8. Important Pages, Routes & API Endpoints

| Route | Component Type | Access / Auth Behavior | Purpose |
|---|---|---|---|
| `/` | Server | Public | Default `create-next-app` page |
| `/login` | Server + Client | Redirects if signed in | Tenant Admin / Student / Super Admin credentials login |
| `/onboard` | Client | Public | 3-step self-serve Tenant registration + UI-only plan checkout |
| `/admin` | Server | **No auth guard** (`?tenant=`) | Tenant metrics & recent exams |
| `/admin/exams/new` | Server + Client | **No auth guard** (`?tenant=`) | MCQ Exam Builder + QR/Link output |
| `/admin/students` | Server + Client | **No auth guard** (`?tenant=`) | Student cohort table with search & KYC filter |
| `/admin/results` | Server + Client | **No auth guard** (`?tenant=`) | Exam submissions table with search, exam filter & sorting |
| `/exam/[examId]` | Server + Client | Public | Student exam portal (`/exam/demo` or DB exam ID) |
| `/student/kyc` | Server + Client | Public (uses `'demo-student'` fallback) | Legacy 2-step KYC form |
| `/student/exam/[examId]` | Server | Session + KYC required (except `demo`) | Legacy authenticated exam route |
| `/super-admin/login` | Client | Public | Super Admin login UI (broken provider ID) |
| `/super-admin` | Server | `SUPER_ADMIN` required | Platform overview & tenant list |
| `/super-admin/tenants/new` | Client | `SUPER_ADMIN` (in action) | Provision new tenant & admin credentials |
| `/super-admin/tenants/[id]` | Server + Client | `SUPER_ADMIN` required | Tenant detail, plan/status toggles, delete |
| `/api/auth/[...nextauth]` | Route Handler | Public | NextAuth `GET`/`POST` endpoints (`session`, `signin`, `signout`, etc.) |

---

## 9. Installation & Local Development Setup

### Prerequisites
- **Node.js 22** (or Node 20+) and **npm**
- **PostgreSQL** database (optional for UI/demo exploration—when `DATABASE_URL` is omitted, `src/lib/prisma.ts` activates an in-memory mock fallback, and `/exam/demo` works without a database)

### Setup Steps
```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Configure environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD

# 3. Push Prisma schema to PostgreSQL (only when DATABASE_URL is configured)
npx prisma db push

# 4. Start the development server on http://0.0.0.0:3000
npm run dev
```

---

## 10. Environment Variable Reference (`.env.example`)

| Variable | Required? | Purpose & Code References |
|---|---|---|
| `DATABASE_URL` | Required for persistence | PostgreSQL connection string (`prisma/schema.prisma`, `src/lib/prisma.ts`) |
| `NEXTAUTH_SECRET` | Required in production | JWT signing secret used internally by NextAuth |
| `NEXTAUTH_URL` | Required in production | Canonical base URL for NextAuth callbacks (e.g., `http://localhost:3000`) |
| `SUPER_ADMIN_EMAIL` | Recommended | Super Admin login email (`src/lib/auth.ts`; has a hardcoded fallback if unset) |
| `SUPER_ADMIN_PASSWORD` | Recommended | Super Admin login password (`src/lib/auth.ts`; has a hardcoded fallback if unset) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID (`src/lib/auth.ts`; unused in current UI) |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret (`src/lib/auth.ts`; unused in current UI) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Unused | Reserved for client-side Razorpay checkout |
| `RAZORPAY_KEY_ID` | Unused | Reserved for server-side Razorpay API |
| `RAZORPAY_KEY_SECRET` | Unused | Reserved for server-side Razorpay signature verification |

---

## 11. Database Setup & Prisma Commands

```bash
# Generate Prisma Client from prisma/schema.prisma
npx prisma generate

# Push schema changes directly to PostgreSQL (no migrations/ directory exists)
npx prisma db push

# Open Prisma Studio GUI
npx prisma studio

# Inspect current Tenant, User, and Exam counts/rows
node scripts/check_db.js

# DESTRUCTIVE: Truncates User, Tenant, Profile, Exam, Question, Result CASCADE
node scripts/clean_db.js
```

---

## 12. Build, Lint & Deployment Instructions

```bash
# Run ESLint (Next.js core-web-vitals + TypeScript rules)
npm run lint

# Create production build (outputs .next/standalone via next.config.js)
npm run build

# Start production server
npm run start
```

**Deployment Notes:**
- `next.config.js` sets `output: 'standalone'` and `experimental.serverActions.allowedOrigins: ['localhost:3000', '*.run.app']`.
- Because KYC files are written to local `/public/uploads/`, ephemeral container filesystems will lose uploaded Aadhaar/selfie files on restart unless migrated to object storage (S3/GCS).

---

## 13. Testing Instructions

- **Automated Tests:** **None exist** in the repository (no Jest, Vitest, Cypress, or Playwright setup).
- **Manual / Demo Verification:**
  - Visit `/exam/demo` to test the full student KYC + 5-question exam + Zustand `localStorage` persistence + score summary without a database.
  - Visit `/login` and `/onboard` to test client portal registration and login flows.
  - Run `npm run lint` and `npm run build` to verify TypeScript and ESLint checks.

---

## 14. Known Bugs, Incomplete Features & Technical Debt

1. **Super Admin Login Provider Mismatch:** `/super-admin/login/page.tsx` calls `signIn('super-admin-credentials', ...)` instead of `'credentials'`, causing all logins from `/super-admin/login` to fail.
2. **Broken Redirect to `/student/results/[id]`:** Both `src/app/(dashboard)/student/exam/[examId]/page.tsx` and `actions.ts` redirect to `/student/results/[id]`, which does not exist.
3. **`ExamUI.tsx` Initial Render `timeRemaining === 0` Hazard:** `useExamStore` defaults `timeRemaining` to `0`. On first mount (when no `'exam-state'` exists in `localStorage`), the auto-submit `useEffect` reads `timeRemaining === 0` from the initial render closure and can trigger `handleSubmit()` before `hydrateExam` re-renders.
4. **Unauthenticated `/admin/*` Routes & Tenant Spoofing:** `/admin`, `/admin/students`, `/admin/results`, `/admin/exams/new`, and `saveExamAction` trust the `?tenant=` URL param / client argument without verifying session authentication or role ownership.
5. **Plaintext Passwords & Null-Password Bypass:** Passwords are saved and checked in plaintext (`auth.ts` line 57), and users with `password: null` bypass the password check.
6. **Publicly Accessible PII Uploads:** Aadhaar documents and selfies saved to `/public/uploads/` are served as static public files without access control, and sample upload artifacts exist in git under `/public/uploads/`.
7. **Demo Scoring Fallback Bug:** When an exam isn't found in DB (e.g., `/exam/demo`), `submitExamAnswersAction` scores any non-null selection as correct instead of evaluating actual correct answers.
8. **Global Student Email Collision:** `registerStudentAndStartExamAction` looks up `<mobile>@exam.student` globally without filtering by `tenantId`.
9. **Stale Duplicate Schema:** `/prisma/prisma/schema.prisma` is outdated and unused.
10. **Placeholder Home Page & Unwired Integrations:** `/` is the default Next.js starter page; Google OAuth buttons, Razorpay checkout, exam edit/delete, exam list page (`/admin/exams`), PNG QR download, and per-question result review are unimplemented.

---

## 15. Developer Guidelines for Future Development

1. **Enforce Auth & Tenant Isolation Server-Side:** Add NextAuth session verification and `TENANT_ADMIN` role checks in `/admin/*` layouts/pages and every Server Action—never derive `tenantId` from URL query params or client parameters for authenticated admin operations.
2. **Hash Passwords & Remove Hardcoded Secrets:** Hash `User.password` with `bcryptjs` on tenant creation, reject `null` passwords during Credentials sign-in, and require `NEXTAUTH_SECRET` and Super Admin env vars in production.
3. **Move KYC Uploads Out of `/public`:** Store Aadhaar/selfie files in private object storage (S3/GCS) or serve them via an authenticated API route with tenant ownership checks.
4. **Fix Immediate Functional Bugs First:** Update `/super-admin/login/page.tsx` to use `'credentials'`, guard `ExamUI` auto-submit with an `isHydrated` flag, implement `/student/results/[resultId]` (or retire legacy `/student/*` routes), and remove `/prisma/prisma/schema.prisma`.
5. **Run Verification Before Merging:** Always run `npm run lint` and `npm run build` to catch Next.js strict ESLint/TypeScript issues.
