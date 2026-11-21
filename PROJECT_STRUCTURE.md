# Project Structure & Blueprint
**Last Updated:** Exam Builder Validation & Mobile Submit Fix
**Version:** 2.2.5

---

## 1. Exam Creation Improvements
1. **Form Validation Relaxation**:
   - `ExamBuilderClient.tsx`:
     - Questions require `>= 1` characters (relaxed from strict 5 chars constraint).
     - Options are dynamically cleaned (empty extra options filtered out automatically).
     - Requires at least 2 filled options per question.
2. **Error Boundary & Feedback**:
   - `onError` callback explicitly catches any missing field in react-hook-form and displays a top alert banner on mobile/desktop.
3. **Database Insertion Pipeline**:
   - `saveExamAction` validates tenant, inserts questions, and returns shareable exam ID.

---

## 2. Directory Tree
```
e:\project\exam portal\exam portal\
├── prisma/
│   └── schema.prisma                           # Multi-tenant schema (Tenant, User, Profile, Exam, Question, Result)
├── src/
│   ├── lib/
│   │   ├── prisma.ts                           # Global singleton PrismaClient
│   │   └── auth.ts                             # NextAuth (CredentialsProvider + GoogleProvider)
│   ├── store/
│   │   └── examStore.ts                        # Zustand exam engine with localStorage hydration
│   ├── components/
│   │   └── exam/
│   │       ├── ExamUI.tsx                      # 70/30 desktop grid + mobile action drawer
│   │       └── ExamShareCard.tsx               # QR Code generator + copy share link component
│   └── app/
│       ├── (dashboard)/admin/
│       │   ├── exams/new/
│       │   │   ├── ExamBuilderClient.tsx       # Exam builder with relaxed validation & mobile error alerts
│       │   │   └── actions.ts                  # Safe DB exam creation with tenant validation
│       │   └── results/
│       │       └── ResultsTableClient.tsx      # Results with sorting on Score, Percentage, Time Taken
│       └── exam/[examId]/
│           ├── page.tsx                        # Public student route
│           ├── PublicExamClient.tsx            # Integrated KYC (Aadhaar + Webcam) -> ExamUI -> Result
│           └── actions.ts                      # Student registration & scoring logic
├── .env
├── package.json
└── tsconfig.json
```
