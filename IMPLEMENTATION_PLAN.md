# IMPLEMENTATION PLAN: TIVAsk

## Architecture Summary
TIVAsk is a full-stack web application consisting of a Next.js (App Router) frontend Admin Panel and an Express.js backend. The backend handles REST API requests from the frontend, WhatsApp message processing via `whatsapp-web.js`, and Knowledge Base (KB) querying and RAG (Retrieval-Augmented Generation) pipeline using Gemini API (`@google/genai`). PostgreSQL with Prisma is used for database operations. It relies on JWT (HttpOnly cookie) for authentication. The frontend uses Tailwind CSS, shadcn/ui, TanStack Query, and react-hook-form. The monorepo setup uses `apps/frontend`, `apps/backend`, and `packages/shared`.

## Requirement Traceability Matrix

| Requirement | PRD Reference | Component | Milestone | Verification | Status |
|---|---|---|---|---|---|
| Admin Authentication (Login, JWT HttpOnly, Hash) | FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004 | Backend Auth / Frontend Login | M1, M4 | AC-AUTH-001, AC-AUTH-002, AC-AUTH-003 | Pending |
| WhatsApp Gateway (QR, Connection State, Session) | FR-WA-001, FR-WA-002, FR-WA-003 | Backend WA / Frontend WA Page | M3, M4 | AC-WA-001, AC-WA-002, AC-WA-003 | Pending |
| WhatsApp Filters (Groups, Dupe, Empty, Media) | FR-WA-004, FR-WA-005 | Backend WA | M3 | UAT-14, Automated Tests | Pending |
| Knowledge Base CRUD | FR-KB-001, FR-KB-002, FR-KB-003, FR-KB-004, FR-KB-005 | Backend KB / Frontend KB Page | M1, M4 | AC-KB-001, AC-KB-002, AC-KB-003 | Pending |
| Numbered Text Menu | FR-MENU-001, FR-MENU-002 | Backend Menu / Frontend Menu Config | M3, M4 | AC-CHAT-002, AC-CHAT-003 | Pending |
| Conversation Tracking | FR-CHAT-001, FR-CHAT-002, FR-CHAT-003, FR-CHAT-004 | Backend Chat / DB | M1, M3 | AC-CHAT-001 | Pending |
| RAG / AI Pipeline (Retrieval, Grounding, Strict Context) | FR-RAG-001, FR-RAG-002, FR-RAG-003, FR-RAG-004 | Backend RAG | M2 | AC-RAG-001, AC-RAG-002, AC-RAG-003 | Pending |
| Escalation / Fallback to Admin | FR-ESC-001, FR-ESC-002, FR-ESC-003, FR-ESC-004 | Backend Escalation / Frontend Inbox | M1, M2, M4 | AC-ESC-001, AC-ESC-002, AC-ESC-003, AC-ESC-004 | Pending |
| Admin Panel Inbox (List, Chat History, Filter) | FR-INBOX-001, FR-INBOX-002, FR-INBOX-003 | Frontend Inbox | M4 | UAT-05 | Pending |

## Milestones

### M0 — Project Foundation
- **Objective:** Setup monorepo for frontend, backend, and shared packages.
- **Modules:** Root Workspace, TypeScript config, ESLint, Prettier, `.env.example`, `.gitignore`.
- **Files/Directories:** `apps/frontend`, `apps/backend`, `packages/shared`, `package.json`, `.env.example`.
- **Dependencies:** Turborepo (optional but useful for npm workspaces), TypeScript, ESLint, Prettier.
- **Implementation Steps:**
  1. Initialize npm workspace.
  2. Setup `packages/shared` with basic `tsconfig.json`.
  3. Setup `apps/backend` (Express.js, TypeScript).
  4. Setup `apps/frontend` (Next.js, Tailwind).
  5. Configure lint/typecheck/build commands at root.
- **Verification:** `npm run build`, `npm run lint`, `npm run typecheck` run successfully.
- **Exit Criteria:** Boilerplate is ready and builds without errors.

### M1 — Database & Backend Core
- **Objective:** Setup PostgreSQL DB, Prisma Schema, Core backend architecture, Auth.
- **Modules:** Prisma, Auth API, KB API, Conversation API, Escalation API.
- **Files/Directories:** `apps/backend/prisma/schema.prisma`, `apps/backend/src/(routes, controllers, services, repositories)`.
- **Dependencies:** Prisma, Express, Zod, bcrypt, jsonwebtoken, PostgreSQL.
- **Implementation Steps:**
  1. Define `schema.prisma` according to TRD (AdminUser, KnowledgeBaseEntry, MenuItem, WhatsAppSession, Conversation, Message, Escalation).
  2. Create migration and seed.
  3. Implement layers (Repository, Service, Controller, Route).
  4. Implement `authMiddleware` and error handler.
  5. Create API endpoints for Auth (login/logout).
  6. Create API endpoints for KB CRUD and Menu CRUD.
  7. Create API endpoints for Conversation and Escalation (reply, resolve).
- **Verification:** Prisma migration works, Seed works, Unit tests for Auth service and API tests pass.
- **Exit Criteria:** Database schema validated and core API functional.

### M2 — Knowledge Base & RAG Engine
- **Objective:** Implement retrieval, evidence selection, context construction, Gemini integration, and grounding validation.
- **Modules:** `apps/backend/src/rag` and `apps/backend/src/lib/geminiClient.ts`.
- **Files/Directories:** `rag/retrieval.ts`, `rag/grounding.ts`, `rag/index.ts`, `services/RagService.ts`.
- **Dependencies:** `@google/genai`.
- **Implementation Steps:**
  1. Setup `geminiClient` with `@google/genai`.
  2. Implement keyword/lexical retrieval scoring.
  3. Implement Gemini structured output request.
  4. Implement grounding validation logic.
  5. Implement fallback triggers.
- **Verification:** Unit tests for retrieval scoring, shared eligibility, grounding validation.
- **Exit Criteria:** RAG pipeline yields correct grounded answers and triggers fallback properly on insufficient evidence.

### M3 — WhatsApp Gateway
- **Objective:** Integrate `whatsapp-web.js`, message processing pipeline, menu logic.
- **Modules:** WhatsApp client, message filters, deterministic menu, session state sync.
- **Files/Directories:** `apps/backend/src/whatsapp`, `apps/backend/src/services/ChatService.ts`.
- **Dependencies:** `whatsapp-web.js`, `qrcode`.
- **Implementation Steps:**
  1. Setup `LocalAuth` and QR generation.
  2. Implement message filters (self, group, dupe, stale, media, empty, escalated).
  3. Implement routing: Menu / RAG / Fallback.
  4. Implement state saving (`menuState`, `status`).
  5. Ensure WhatsApp session state is synced to DB.
- **Verification:** Manual text messaging (mock or real WA).
- **Exit Criteria:** Gateway handles incoming messages and responds based on Menu or RAG.

### M4 — Admin Frontend
- **Objective:** Build Next.js Admin Panel UI connecting to backend APIs.
- **Modules:** Auth, Dashboard, WA Connection, KB Management, Inbox.
- **Files/Directories:** `apps/frontend/src/app`, `apps/frontend/src/features`.
- **Dependencies:** `next`, `react`, `tailwindcss`, `shadcn/ui`, `lucide-react`, `@tanstack/react-query`, `react-hook-form`, `zod`.
- **Implementation Steps:**
  1. Setup pages and layouts.
  2. Implement Login page with cookie-based auth.
  3. Implement WA Connection page (QR display, status).
  4. Implement KB Page (Table, Create/Edit Modals).
  5. Implement Inbox Page (Conversation List, Chat View, Resolve Button).
- **Verification:** Component tests, visual inspection.
- **Exit Criteria:** Admin Panel UI is fully functional against mock or real backend.

### M5 — Frontend ↔ Backend Integration
- **Objective:** Full E2E integration.
- **Modules:** API Client hooks, Error/Empty states.
- **Files/Directories:** Cross-cutting.
- **Dependencies:** None additional.
- **Implementation Steps:**
  1. Connect FE `apiClient` to real backend endpoints.
  2. Validate auth cookies.
  3. Handle real-time WA connection polling.
  4. E2E tests for Flow A-I.
- **Verification:** End-to-end walkthrough.
- **Exit Criteria:** Frontend interacts with Backend properly without mismatch.

### M6 — Internal QA
- **Objective:** Final testing and validation.
- **Modules:** Unit tests, API tests, E2E tests.
- **Files/Directories:** `apps/backend/tests`, `apps/frontend/e2e`.
- **Dependencies:** `vitest`, `supertest`, `@playwright/test`.
- **Implementation Steps:**
  1. Write/run Backend Unit Tests.
  2. Write/run Backend Integration Tests.
  3. Write/run Frontend Playwright E2E Tests.
  4. Fix any bugs found.
  5. Generate `BUILD_REPORT.md`.
- **Verification:** All tests pass.
- **Exit Criteria:** `READY FOR UAT` status.
