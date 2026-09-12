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

- **Client Management:** Manage clients with team/role-based access. Includes a 3-tier role hierarchy (Owner, Partner, Staff) managed via Supabase Row Level Security (RLS).
- **Financial Reporting Pipelines:** Deterministic and standardized calculation pipelines for:
  - Credit Monitoring Arrangement (CMA) Reports
  - Deal Feasibility Reports
  - Financial Health Snapshots
- **Report Exports:** Export any generated report cleanly to PDF, DOCX (Word), or XLSX (Excel).
- **Document Request Workflow:** Manage document request lists and track status.
- **Client Upload Portal:** Tokenized, secure uploads for clients without requiring them to log into the main CA dashboard.
- **Activity Timeline:** Track key events and actions per client.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root of the repository based on the required environment variables. **Do not** commit your `.env.local` file.

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Migrations

The database schema and RLS policies are managed via Supabase migrations. Ensure you have the Supabase CLI installed.

To push all migrations to your linked Supabase project:
```bash
supabase db push
```

*Note: The migrations set up the `team_members` based RLS policies and `report_type` enums required for the app to function securely.*

### 3. Running the Development Server

First, install the required dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
