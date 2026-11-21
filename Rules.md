# AI IDE & Vibe Coding Guidelines (Antigravity Context)

## 1. Multi-Tenant & Data Rules
- **STRICT RULE:** Never generate a database query for `User`, `Exam`, `Question`, or `Result` without filtering by `tenantId`.
- Implement basic retry logic for database mutations to handle concurrent submissions.

## 2. State Management
- Use Zustand for the complex exam client state (timers, question navigation, status grids). 
- Exam state must hydrate from `localStorage` on component mount to survive accidental page reloads.

## 3. Next.js 14 Conventions
- **Server-First:** Default to Server Components (`page.tsx`). Use `'use client'` strictly for interactive leaf nodes.
- Use Server Actions for database mutations and local file system writes.

## 4. Design & UI
- **STRICT RULE:** NO EMOJIS in UI, code, or commits. Use `lucide-react` SVG icons exclusively.
- The exam UI for must strictly follow the 70/30 horizontal split layout given in design reference folder just take refer don't copy.
- The exam UI should support mobile view also