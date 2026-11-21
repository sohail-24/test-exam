# Project Memory & State Tracker

## Current Context
- **Stage:** Project initialization. Unified documentation generated.
- **Environment:** PostgreSQL, Local File Storage (for demo KYC), Stripe (SaaS billing), Razorpay (Student exams), Zustand (State).
- **Active Focus:** Preparing to execute Phase 1 in Antigravity.

## Architectural Decisions Log
- **Hybrid Payment Model:** Using Razorpay for Tenant SaaS subscriptions (B2B) and Razorpay for localized Student exam fee processing (B2C).
- **Local Storage Abstraction:** Aadhaar and Selfie uploads are written to local disk for the prototype, but the Prisma schema expects a string path so this can be seamlessly migrated to an S3 bucket in production.
- **Strict UI Rules:** explicitly banned emojis in favor of `lucide-react` SVG icons.

## Pending Tasks
- [ ] Initialize Next.js 14 App Router project.
- [ ] Install dependencies: `prisma`, `@prisma/client`, `zustand`, `lucide-react`, `next-auth`.
- [ ] Execute Phase 1 prompt in Antigravity to generate `schema.prisma`.