# Vaelo

Vaelo is a financial intelligence workspace built for Chartered Accountant (CA) practices. It centralises client management, deterministic financial reporting, document collection, and multi-format report export into a single secure platform.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL, Row Level Security, Auth, Storage) |
| PDF Export | @react-pdf/renderer |
| DOCX Export | docx |
| XLSX Export | ExcelJS |
| Testing | Vitest |

## Features

### Client Management
Full client lifecycle management with a 3-tier team role hierarchy — **Owner**, **Partner**, and **Staff** — enforced at the database level via Supabase Row Level Security (RLS). Every query is scoped to the authenticated user's firm and role.

> **Note:** The role/RLS model and the `team_members` / `team_invites` tables are fully built and enforced. However, the invite *redemption flow* (sending invitations and onboarding new team members through the UI) is **not yet implemented** — there is no management UI or email-based invite acceptance yet.

### Financial Reporting Pipelines
Three deterministic, auditable calculation pipelines that accept structured inputs and produce fully reproducible outputs:

- **Credit Monitoring Arrangement (CMA)** — 13 schedules covering balance sheet, P&L, working capital, ratios, and fund flow, with historical + projected years
- **Deal Feasibility** — acquisition feasibility analysis including premium/valuation, sources & uses, pro-forma financials, accretion/dilution, leverage, synergy NPV, and breakeven analysis
- **Financial Health Snapshot** — liquidity, expense growth, cash runway, and revenue volatility scoring

### Report Export (PDF / DOCX / XLSX)
All three report types export to **PDF**, **DOCX**, and **XLSX** via the `/api/clients/[id]/reports/export` route. Exports use a semantic value-type formatting system (`currency`, `percentage`, `ratio`, `number`) with mapper-specified decimal precision, ensuring consistent number formatting across all output surfaces (web UI, PDF, DOCX, XLSX).

### Document Request Workflow
Create and manage document request lists per client. Each request tracks status and supports a **tokenized upload portal** — clients can upload documents via a secure, time-limited link without needing a Vaelo account.

### Activity Timeline
Per-client event timeline tracking key actions (report generation, document uploads, status changes).

### New User Provisioning
A database trigger (`handle_new_user`) automatically provisions a firm, CA profile, and team membership for every new signup, ensuring the application is immediately usable without manual setup.

## Documentation

- [`docs/Vaelo_SRS.md`](docs/Vaelo_SRS.md) — Software Requirements Specification
- [`docs/vaelo-identity-system.html`](docs/vaelo-identity-system.html) — Identity system and design language reference

## Setup

### 1. Environment Variables

Create a `.env.local` file in the repository root. **Do not** commit this file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Migrations

The database schema, RLS policies, triggers, and enums are stored as timestamped `.sql` files in `supabase/migrations/`.

This repository does **not** use a Supabase CLI project link (there is no `supabase/config.toml`). To apply migrations, execute each `.sql` file directly against your Supabase project **in filename/timestamp order**. This can be done via the SQL Editor in the Supabase Dashboard or through a Supabase MCP tool.

### 3. SMTP Configuration

Supabase's default email service has aggressive rate limits that are unsuitable even for light testing. You **must** configure a custom SMTP provider (e.g. Gmail via App Password) in your Supabase dashboard under **Authentication → Settings → SMTP** for auth emails to work reliably.

### 4. Running the Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests

```bash
npm test          # interactive watch mode
npx vitest run    # single run
```
