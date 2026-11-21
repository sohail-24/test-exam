# Implementation Phases

**Version:** 2.0 — Updated for 3-role SaaS workflow
**Last Updated:** 2026-11-15

---

## Phase 1: DB Schema ✅ DONE
- Prisma schema: Tenant, User, Profile, Exam, Question, Result
- All models have `tenantId` for isolation
- `npx prisma db push` → schema live

## Phase 2: Zustand Exam Store ✅ DONE
- `store/examStore.ts`
- State: `currentQuestionIndex`, `timeRemaining`, `questionStatuses[]`
- Persists to localStorage (survives reload)

## Phase 3: Tenant Onboarding ✅ DONE
- `/onboard` → org name + email → Razorpay UI-only → creates Tenant + TENANT_ADMIN user
- Fixed: action now returns `{ redirectTo }` instead of server-side `redirect()`

## Phase 4: Student KYC (Legacy) ✅ DONE
- `/student/kyc` — 2-step: personal info + Aadhaar upload + selfie
- Used for direct student login flow (kept for reference)

## Phase 5: Admin Exam Builder ✅ DONE
- `/admin/exams/new` — Google Forms-style dynamic builder
- react-hook-form + Zod, free/paid toggle, publish action

## Phase 6: Exam Execution UI ✅ DONE
- 70/30 desktop grid + mobile sticky bar + bottom drawer
- Zustand state, per-question palette, timer

---

## Phase 7: Super Admin Dashboard 🔲 NEXT
**Goal:** LopyTech internal panel to manage all tenants

- Routes: `/super-admin/login`, `/super-admin`, `/super-admin/tenants/[id]`
- Auth: `CredentialsProvider` with `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` env vars
- Pages:
  - Tenant list table (name, slug, plan, status, created date, action buttons)
  - Create tenant form (org name, admin email, plan selector)
  - Tenant detail (exams count, students count, results count, deactivate button)
- DB: Super Admin queries skip `tenantId` filter

## Phase 8: Exam Link + QR Code 🔲
**Goal:** After exam save, show shareable link + QR

- Install: `npm install react-qr-code --legacy-peer-deps`
- In exam builder success state:
  - Display URL: `http://localhost:3000/exam/{examId}`
  - `<QRCodeSVG value={url} size={200} />`
  - "Copy Link" button (clipboard API)
  - "Download QR" button (canvas → PNG)

## Phase 9: Public Exam Route (Student Entry) 🔲
**Goal:** No-auth student entry via link/QR

- Route: `/exam/[examId]/page.tsx` — no auth required
- Server: fetch exam by `examId` (no `tenantId` required at fetch — exam is public)
- Client:
  - Show: exam title, subject, duration, number of questions
  - Inline mini-KYC: name + mobile (2 fields, Zod validation)
  - On submit → upsert student record → render `<ExamUI />`
- Remove redirect to `/login` for this route

## Phase 10: Student Management Page 🔲
**Goal:** Admin can list and filter students

- Route: `/admin/students`
- Server: fetch all `Profile` records for `tenantId`
- Filters: by exam, by KYC status, by date range
- Table: name, mobile, exam taken, submitted at, score

## Phase 11: Results Page 🔲
**Goal:** Admin views all submissions

- Route: `/admin/results`
- Server: fetch all `Result` records for `tenantId`, join exam + user
- Table: student name, exam title, score/total, time taken, submitted at
- Detail view: per-question breakdown (selected answer vs correct)

---

## Dependency Order
```
Phase 7 → independent (new routes + CredentialsProvider)
Phase 8 → depends on Phase 5 (exam builder already done)
Phase 9 → depends on Phase 8 (needs examId to exist)
Phase 10 → depends on Phase 9 (students created via public route)
Phase 11 → depends on Phase 10 (results tied to students)
```
