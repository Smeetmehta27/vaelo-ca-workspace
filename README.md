# Vaelo

Vaelo is a financial and legal workspace designed specifically for Chartered Accountants (CAs). It streamlines client management, financial reporting, and document requests into a single secure platform.

## Tech Stack

This project is built using modern web technologies:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Auth, Storage, Edge Functions)
- **Document Export:** docx, exceljs

## Features

- **Client Management:** Manage clients with team/role-based access. Includes a 3-tier role hierarchy (Owner, Partner, Staff) managed via Supabase Row Level Security (RLS). *Note: The 3-tier role/RLS model is fully built and enforced, but inviting new team members is not yet functional (the `team_invites` table exists, but there is no redemption flow or management UI yet).*
- **Financial Reporting Pipelines:** Deterministic and standardized calculation pipelines for:
  - Credit Monitoring Arrangement (CMA) Reports
  - Deal Feasibility Reports
  - Financial Health Snapshots
- **Report Exports:** Report export to DOCX/XLSX (PDF export and full number formatting still in progress).
- **Document Request Workflow:** Manage document request lists and track status.
- **Client Upload Portal:** Tokenized, secure uploads for clients without requiring them to log into the main CA dashboard.
- **Activity Timeline:** Track key events and actions per client.

## Documentation Reference

For further architectural context and design specifications, refer to:
- `docs/Vaelo_SRS.md`
- `docs/vaelo-identity-system.html`

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root of the repository based on the required environment variables. **Do not** commit your `.env.local` file.

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Migrations

The database schema, RLS policies, and enums are stored in timestamped `.sql` files within the `supabase/migrations/` directory.

This repository does not use a Supabase CLI project link (no `config.toml`). To apply migrations, run the contents of each `.sql` file directly against your target Supabase project in filename/timestamp order. This can be done via the SQL Editor in the Supabase Dashboard, or by using an MCP-connected tool.

### 3. SMTP Configuration

**Important:** Supabase's default email service has an aggressive rate limit that is unsuitable even for light testing. You must configure a custom SMTP provider (for example, Gmail via an App Password) in your Supabase dashboard (**Authentication → Settings → SMTP**) for the application to function correctly.

### 4. Running the Development Server

First, install the required dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
