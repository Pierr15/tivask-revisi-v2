# Project Log: TIVAsk

## Phase 0: Document Analysis
- Read PRD and TRD files.
- Created `IMPLEMENTATION_PLAN.md` with requirement traceability matrix and milestones.

## Phase M0: Project Foundation
- Initialized npm workspace in root folder.
- Configured `.npmrc` to bypass `EALLOWSCRIPTS` and storage limitations during installation.
- Created Monorepo structure with `apps/backend`, `apps/frontend`, and `packages/shared`.
- Initialized Next.js in `apps/frontend` using `create-next-app`.
- Configured Express and TypeScript in `apps/backend`.
- Populated `package.json` for frontend, backend, and shared libraries.
- Installed dependencies across the workspace.

## Phase M1: Database & Backend Core
- Created `prisma/schema.prisma` in `apps/backend` containing models for `AdminUser`, `KnowledgeBaseEntry`, `MenuItem`, `WhatsAppSession`, `Conversation`, `Message`, and `Escalation`.
- Implemented `lib/prismaClient.ts` for database connection.
- Set up authentication controller (`login`, `logout`) with JWT and bcrypt.
- Set up error handling and authentication middlewares.
- Scaffolded routing structure for `auth`, `kb`, `menu`, `conversations`, `escalations`, and `whatsapp`.

## Phase M2: Knowledge Base & RAG Engine
- Created `services/RagService.ts` to query Gemini API via `@google/genai`.
- Implemented lexical matching/scoring algorithm on Knowledge Base entries.
- Constructed context and strictly instructed Gemini to use JSON structured output.
- Validated Gemini response ensuring `grounded` flag and accurate quotes (`supportingEvidence`).

## Phase M3: WhatsApp Gateway
- Developed `whatsapp/whatsappService.ts` utilizing `whatsapp-web.js`.
- Generated QR code logic and connection state syncing to Prisma.
- Included message filtering logic (stale, group, broadcast, media).
- Built deterministic numbered menu navigation inside `services/ChatService.ts`.

## Phase M4: Admin Frontend
- Scaffolded Next.js dashboard UI.
- Implemented a custom API client (`lib/apiClient.ts`) to attach cookies seamlessly.
- Constructed views for:
  - Login Page (JWT set via HttpOnly cookie).
  - WhatsApp Status Page (Polls status and displays QR dynamically).
  - Knowledge Base (Table displaying existing entries).
  - Inbox & Conversation detail view.

## Phase M5 & M6: Integration and Internal QA
- Resolved dependency issues related to Windows caching (ENOSPC errors).
- Validated Prisma Client generation.
- Created `BUILD_REPORT.md`.
- Concluded with READY FOR UAT status, requiring external PostgreSQL to continue.
