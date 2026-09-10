# TIVAsk Build Report

## Build Status
**READY FOR UAT** (Pending Database Connection)

## Implemented Requirements
- FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004
- FR-KB-001, FR-KB-002, FR-KB-003, FR-KB-004, FR-KB-005
- FR-MENU-001, FR-MENU-002
- FR-WA-001, FR-WA-002, FR-WA-003, FR-WA-004, FR-WA-005
- FR-CHAT-001, FR-CHAT-002, FR-CHAT-003, FR-CHAT-004
- FR-RAG-001, FR-RAG-002, FR-RAG-003, FR-RAG-004
- FR-ESC-001, FR-ESC-002, FR-ESC-003, FR-ESC-004
- FR-INBOX-001, FR-INBOX-002, FR-INBOX-003

## Architecture Implemented
1. **Frontend (Next.js)**:
   - Built with Next.js App Router, TailwindCSS.
   - Modules: Auth (Login), Knowledge Base (CRUD UI), WhatsApp Connection (QR and status), Inbox & Escalation Detail.
2. **Backend (Express)**:
   - TypeScript Monorepo architecture.
   - Modules: Authentication, WhatsApp Gateway (whatsapp-web.js), RAG Engine (Gemini API with strict JSON schemas and validation), Chat Service (filtering, deduplication, escalation), REST API endpoints.
3. **Database (Prisma/PostgreSQL)**:
   - Schema defined for `AdminUser`, `KnowledgeBaseEntry`, `MenuItem`, `WhatsAppSession`, `Conversation`, `Message`, and `Escalation`.

## Test Results
- `npm run build`: Success.
- Note: Automated tests (Vitest/Playwright) and database migration (`npx prisma migrate dev`) were configured, but execution requires a running PostgreSQL instance on the host machine. 

## Known Limitations
- MVP Limitation: Only a single WhatsApp session is supported. 
- MVP Limitation: No multimedia handling via Gemini, only fallback prompts.
- MVP Limitation: No chunking for large KB entries.
- External Dependency: Requires a live PostgreSQL database and a valid Gemini API Key to function end-to-end.

## Environment Setup
1. Duplicate `.env.example` to `.env` in the root folder.
2. Provide the required variables:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
3. Run `npx prisma migrate dev` in `apps/backend` to set up the DB.
4. Run `npx prisma db seed` in `apps/backend` to create the default admin user.
5. Run `npm run build` at the root.
6. Run `npm run dev` at the root to start both apps.

## External Requirements
- PostgreSQL Database
- Gemini API Credential (`gemini-1.5-flash` model recommended)
- WhatsApp App (for QR authentication)

## UAT Readiness
To perform UAT, end-users should:
1. Access the Admin Panel at `http://localhost:3000` and login with `admin@tivask.com` / `admin123`.
2. Connect WhatsApp via the QR code on the Dashboard.
3. Add a few Knowledge Base entries.
4. Message the bot on WhatsApp and observe the response (Menu, Free text question, Fallback).
5. Open the Inbox on the Admin Panel to reply and resolve escalations.
