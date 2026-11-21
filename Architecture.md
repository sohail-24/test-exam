# System Architecture

## 1. Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Required for multi-tenant data isolation)
- **ORM:** Prisma
- **Client State:** Zustand (Exclusively for exam execution state)
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** NextAuth.js (Google Provider)
- **Payments:** use ui only first letter we will add Razorpay

## 2. Multi-Tenant & Storage Strategy
- **Data Isolation:** Every core database table includes a `tenantId` foreign key.
- **File Storage (Demo):** Aadhaar and Selfie files are saved directly to the local filesystem (`/public/uploads/`) with paths saved in PostgreSQL.

## 3. Data Entities (Prisma Schema Outline)
- `Tenant`: id, name, stripeSubscriptionId
- `User`: id, tenantId, email, role (SUPER_ADMIN, TENANT_ADMIN, STUDENT), kycComplete
- `Profile`: userId, name, gender, mobile, aadhaarPath, selfiePath
- `Exam`: id, tenantId, title, price, isFree, durationMinutes
- `Question`: id, examId, text, options (JSON), correctOptionIndex
- `Result`: id, userId, examId, tenantId, score, answers (JSON)