# Software Requirements Specification
## Vaelo — CA Practice Operating System

**Document version:** 1.0
**Prepared for:** Vaelo (vaelo-ca-workspace)
**Status:** Draft for build — traces to `Vaelo_CA_Practice_OS_Blueprint.md`

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for evolving Vaelo from a three-report generation tool into a complete practice operating system for Indian Chartered Accountants (CAs) — covering client management, document collection, compliance tracking, review workflows, notice management, client communication, billing, and AI-assisted automation. It is written to be buildable directly against the existing codebase (`vaelo-ca-workspace`: Next.js 14, Supabase/Postgres, TypeScript, Vitest) and traces every requirement back to a specific researched pain point.

### 1.2 Scope
**In scope:** everything a solo CA or small-to-mid CA firm needs to run client work end-to-end inside one workspace — from client onboarding through recurring compliance work, report generation, review/approval, client communication, and billing.

**Out of scope for v1:** general ledger/bookkeeping replacement (Tally/Zoho Books remain the accounting system of record; Vaelo consumes and organizes data around them), payroll processing, e-filing submission itself (Vaelo tracks and prepares, but does not submit returns to GSTN/Income-Tax e-filing on the CA's behalf in Phase 1–3), and any feature that would require Vaelo to act as an unsupervised agent on government portals without human sign-off.

### 1.3 Definitions, acronyms, abbreviations
| Term | Meaning |
|---|---|
| CA | Chartered Accountant |
| CMA | Credit Monitoring Arrangement (bank-format report; already implemented) |
| MPBF | Maximum Permissible Bank Finance |
| DSCR | Debt Service Coverage Ratio |
| GSTIN | GST Identification Number |
| QRMP | Quarterly Return Monthly Payment (GST scheme) |
| TRACES | TDS Reconciliation Analysis and Correction Enabling System |
| DPDP Act | Digital Personal Data Protection Act, 2023 (India) |
| ICAI | Institute of Chartered Accountants of India |
| RLS | Row-Level Security (Postgres/Supabase) |
| AuditedValue | Existing Vaelo type: `{ value, formula, inputs }` — every calculated number carries its own derivation |
| FR-XXX-n | Functional requirement ID, grouped by module prefix |

### 1.4 References
- `Vaelo_CA_Practice_OS_Blueprint.md` — research findings and roadmap this SRS implements
- Existing repo: `github.com/Smeetmehta27/vaelo-ca-workspace`
- Existing DB migration: `supabase/migrations/20240823164000_init_schema.sql`
- Existing pipelines: `lib/pipelines/{cma,feasibility,financial-health}.ts`

### 1.5 Document overview
Section 2 gives the overall product description and user classes. Section 3 is the functional requirement catalogue, organized by module, each traceable to the blueprint's pain-point evidence. Section 4 covers external interfaces. Section 5 covers data model changes. Section 6 covers non-functional requirements. Section 7 gives an architecture overview. Section 8 gives representative use cases. Section 9 maps requirements to the phased delivery plan. Section 10 lists assumptions/risks. Section 11 is the full traceability matrix.

---

## 2. Overall description

### 2.1 Product perspective
Vaelo currently exists as a working Next.js/Supabase app with a real, tested calculation core (CMA, Feasibility, Financial Health pipelines — 69 passing tests, clean type-check) sitting inside a thin CRM (CAs, clients, reports). This SRS treats that calculation core as a **permanent, protected asset** — every new module wraps around it, none of it gets rewritten. The product perspective shifts from "report generator" to "the one place a CA opens every morning," with report generation as one module among several.

### 2.2 Product functions (high-level)
1. Client & practice records (existing, extended)
2. Document request & collection tracking
3. Compliance deadline engine (auto-generated recurring tasks)
4. Review & approval workflow
5. Notice management (GST/Income-Tax/TDS)
6. Client communication & timeline
7. Billing & collections
8. Report generation (existing CMA/Feasibility/Health, unchanged core logic)
9. AI-assisted automation layer (document parsing, draft messages, notice triage — always human-confirmed)
10. Command-center dashboard ("what do I need to do today")
11. Knowledge & continuity (client notes/handover)

### 2.3 User classes and characteristics
| User class | Characteristics | Primary needs |
|---|---|---|
| **Solo CA / proprietor** | Owns everything; no delegation | Speed, low setup friction, "don't let me forget anything" |
| **Firm partner** | Owns client relationships, reviews work, delegates | Visibility into what's stuck, who owns what, review queue |
| **Staff / articled assistant** | Executes tasks assigned by partner/manager | Clear task queue, unambiguous "what's expected of me" |
| **Client (of the CA)** | Non-accountant, wants transparency | Simple document upload, clear "what's still needed," visibility into work done for them |

Existing `ca_profiles` table already anchors identity to `auth.users`; staff/team member support is a schema extension (Section 5).

### 2.4 Operating environment
- Web application (desktop-first, must remain usable on mobile browsers given CAs and clients both check status on phones)
- Next.js 14 App Router, deployed on Vercel-compatible infrastructure
- Supabase (Postgres, Auth, Storage, Edge Functions) as the backend
- No native mobile app in v1 scope — mobile web only

### 2.5 Design and implementation constraints
- **All existing pipeline types, exports, and test contracts in `lib/pipelines/` must remain unchanged** — new modules consume them, never modify their signatures.
- All new calculated/derived values that feed into a report must use the existing `AuditedValue` pattern (`createAudited`) — no untraceable numbers enter a report.
- Row-Level Security must be extended, never bypassed, for every new table — data isolation between CAs (and eventually between firm members) is a hard requirement, not a nice-to-have.
- AI-assisted features are **draft-and-confirm only** in this SRS's scope — no autonomous posting of financial data, no autonomous sending of client messages, no autonomous filing/submission to any government portal.
- Client-facing messaging features must remain strictly transactional (status updates on the client's own pending items) — never promotional/broadcast, per ICAI solicitation rules (Section 6.3).

### 2.6 Assumptions and dependencies
- CAs will supply/confirm entity-level data (entity type, GST registration, filing frequency) needed to auto-generate compliance tasks; the system cannot infer this from nothing.
- WhatsApp Business API integration depends on Meta approval and a paid tier — treated as a Phase 3 dependency, not assumed available from day one.
- Direct GST/TRACES/e-filing portal auto-fetch (Phase 4) depends on a feasibility spike; this SRS specifies the manual-logging version now and flags auto-fetch as conditional.
- Items in Section 2 of the blueprint marked "hypothesis-tier" (e.g., predictive deadline-risk scoring, AI history summarization) are represented here as **Phase 4 candidate requirements**, not committed v1–v3 requirements, and should be validated with real CA users before implementation begins.

---

## 3. System features (functional requirements)

Each requirement is tagged with **Priority**: Must (M) / Should (S) / Could (C), per MoSCoW, and **Phase** (1–4) per the blueprint's roadmap.

### 3.1 Client & practice management (extends existing)
- **FR-CLI-1 (M, Phase 1):** System shall retain existing `Client` fields (company_name, entity_type) and add: GSTIN, PAN, filing frequency (monthly/QRMP/annual), registration date, primary contact details.
- **FR-CLI-2 (M, Phase 2):** System shall support assigning a client to a specific staff member (owner) in addition to the CA/firm account, to support delegation.
- **FR-CLI-3 (S, Phase 2):** System shall support multiple team members per firm (see FR-TEAM-1 in Section 5), each scoped by RLS to only their assigned or firm-wide-visible clients depending on role.
- **FR-CLI-4 (M, Phase 1):** System shall preserve full backward compatibility with existing `clients` table and RLS policies; no existing client record or report shall be invalidated by schema changes.

### 3.2 Document collection & management
*Traces to blueprint Section 2 Tier-1 pain #1–2 and Section 4.A.*
- **FR-DOC-1 (M, Phase 1):** CA shall be able to create a named document request list for a client/engagement, with individual line items (document name, required/optional flag, due date).
- **FR-DOC-2 (M, Phase 1):** Each document request line item shall have a status: `requested → received → rejected (resubmission needed) → approved`.
- **FR-DOC-3 (M, Phase 1):** CA shall be able to save and reuse document-request templates per report type (CMA, Feasibility, Health Snapshot, or custom).
- **FR-DOC-4 (M, Phase 1):** Client shall be able to view their own outstanding document requests and upload files against a specific line item without requiring a full account login for the first interaction (a securely tokenized link is acceptable for v1; full client portal login is Phase 2).
- **FR-DOC-5 (S, Phase 2):** System shall show, at the firm level, an aggregate view of all outstanding document requests across all clients, sortable by due date and staleness (days since last update).
- **FR-DOC-6 (C, Phase 3):** System shall flag document requests that are overdue and suggest (never auto-send) a reminder message draft.

### 3.3 Compliance deadline engine
*Traces to blueprint Tier-1 pain #3 ("compliance deadline problem").*
- **FR-CAL-1 (M, Phase 2):** System shall maintain a rules table mapping client entity attributes (entity type, GST registration status, filing frequency, registration date) to recurring compliance task templates (GSTR-1, GSTR-3B, TDS return, advance tax installments, ITR, ROC filings where applicable).
- **FR-CAL-2 (M, Phase 2):** System shall auto-generate compliance tasks for each client based on the rules table, on a scheduled basis (e.g., monthly job), without requiring manual re-creation each period.
- **FR-CAL-3 (M, Phase 2):** Each generated task shall have: client, task type, due date, assigned owner (defaults to client's assigned staff member per FR-CLI-2), and status (pending/in-progress/done/overdue).
- **FR-CAL-4 (M, Phase 2):** System shall provide a firm-wide compliance calendar view, filterable by client, task type, owner, and date range.
- **FR-CAL-5 (S, Phase 2):** System shall support QRMP-scheme-aware task generation (quarterly return, monthly payment) distinct from standard monthly GST filers, per FR-CAL-1's rules table.
- **FR-CAL-6 (C, Phase 4):** System shall surface predictive flags for clients trending toward a missed deadline based on historical task-completion lag (hypothesis-tier — requires validation before commitment).

### 3.4 Review & approval workflow
*Traces to blueprint Tier-1 pain #5 ("partner bottleneck").*
- **FR-REV-1 (M, Phase 2):** System shall extend the existing `Report.status` field's state machine to: `draft → submitted_for_review → changes_requested → approved → finalized`.
- **FR-REV-2 (M, Phase 2):** Reviewers shall be able to attach a comment to a specific figure within a report, referencing that figure's existing `AuditedValue` (formula + inputs), not just the report as a whole.
- **FR-REV-3 (M, Phase 2):** System shall provide a review queue view showing all reports in `submitted_for_review` state, across all clients, for anyone with reviewer permission.
- **FR-REV-4 (S, Phase 2):** System shall notify (in-app, minimum) the preparer when a reviewer requests changes, and notify the reviewer when a preparer resubmits.
- **FR-REV-5 (M, Phase 2):** A report shall not be markable `finalized` until it has passed through `approved` state at least once — enforced server-side, not just in the UI, to preserve the audit trail's integrity.

### 3.5 Notice management
*Traces to blueprint Tier-1 pain #4 — validated by an entire external vendor category.*
- **FR-NOT-1 (M, Phase 2):** CA shall be able to manually log a notice against a client: portal source (GST/Income-Tax/TRACES), notice type/section (e.g., ASMT-10, DRC-01, 143(1), 148, TDS default), date received, response due date, and current status.
- **FR-NOT-2 (M, Phase 2):** Each logged notice shall convert into a tracked task (reusing the task infrastructure from FR-CAL-3) with an assigned owner and due date.
- **FR-NOT-3 (S, Phase 2):** System shall maintain a reusable template library for standard notice responses (e.g., common DRC-01A / mismatch response formats), versioned so updates don't silently change a template mid-use on an open case.
- **FR-NOT-4 (M, Phase 2):** System shall provide a firm-wide notice dashboard showing all open notices sorted by response deadline urgency.
- **FR-NOT-5 (C, Phase 4):** System shall attempt automated notice fetch directly from GST/TRACES/e-filing portals, contingent on a separate technical/legal feasibility spike (portal API availability, ToS compliance, credential-handling security review) — **not committed** until that spike is complete.

### 3.6 Client communication & timeline
*Traces to blueprint Tier-1 pain #2 & #6, and existing Vaelo positioning (client sees what's done for them).*
- **FR-COM-1 (M, Phase 1):** System shall maintain a chronological, per-client timeline aggregating: reports generated, document requests created/fulfilled, notices logged, and free-text notes added — read-only, auto-populated from other modules' activity.
- **FR-COM-2 (S, Phase 1):** Client-facing view of the timeline shall show only client-relevant events (exclude internal review comments and internal-only notes).
- **FR-COM-3 (S, Phase 3):** System shall support sending transactional status reminders (document still pending, notice response due) via email as a baseline channel, with WhatsApp Business API as an additional channel once integrated.
- **FR-COM-4 (M, Phase 3, constraint):** All client-facing messages generated by the system (templated or AI-drafted) shall require explicit CA confirmation before sending — no autonomous send path exists in this SRS's scope.
- **FR-COM-5 (M, all phases, constraint):** No messaging feature shall support bulk/broadcast sending to non-client or prospective-client lists — enforced at the data-model level by scoping all message-sends to an existing `client_id` with an active relationship.

### 3.7 Billing & collections
*Traces to blueprint Tier-2 pain #8.*
- **FR-BIL-1 (M, Phase 2):** When a report transitions to `finalized` (FR-REV-1), system shall prompt the CA to raise an invoice linked to that specific report/client.
- **FR-BIL-2 (S, Phase 2):** System shall track invoice status: draft/sent/paid/overdue, and support recording a payment date and method (manual entry — no payment gateway integration required in v1).
- **FR-BIL-3 (C, Phase 3):** System shall surface an aggregate view of overdue invoices across all clients, sorted by days overdue.
- **FR-BIL-4 (C, Phase 4):** System shall support payment gateway integration for direct client payment links (stretch — not committed).

### 3.8 Reporting engine (existing — retained, extended for continuity)
- **FR-RPT-1 (M, all phases, constraint):** The three existing pipelines (`generateCMAReport`, `calculateDealFeasibility`, `calculateHealthSnapshot`) and their type contracts shall not be modified as part of this SRS's scope — all new functionality wraps around them.
- **FR-RPT-2 (S, Phase 2):** Report generation forms shall be pre-fillable from the client's stored `client_financials` history and any approved document uploads (FR-DOC), reducing re-entry of the same historical figures across report types.
- **FR-RPT-3 (C, Phase 4):** Consider reintroducing a Valuation Report module (present in the legacy notebook, dropped from the current TS app) — **only if** CA demand is validated; not committed in this SRS.

### 3.9 AI-assisted automation layer
*Traces to blueprint Section 8 — ranked by evidence strength.*
- **FR-AI-1 (S, Phase 3):** System shall support uploading a bank statement (PDF/image) and extracting transaction line items via OCR/LLM, presenting them in a staged, editable table before anything is written to `client_financials`.
- **FR-AI-2 (M, Phase 3, constraint):** No AI-extracted data shall be persisted to a client's financial record without explicit human confirmation of the staged table — enforced server-side (the write endpoint requires a `confirmed: true` flag from the reviewing user, not implied by the extraction call itself).
- **FR-AI-3 (C, Phase 3):** System shall draft (not send) a follow-up message when a document request or notice has been outstanding beyond a configurable threshold.
- **FR-AI-4 (C, Phase 3):** System shall suggest a notice-response template based on the logged notice's type/section (FR-NOT-1), for human drafting, not autonomous reply.
- **FR-AI-5 (C, Phase 3):** System shall generate a review checklist per report type, derived from that report's `AuditedValue` formula set, to assist reviewers (FR-REV-2) in knowing what to sanity-check.
- **FR-AI-6 (C, Phase 4, hypothesis-tier):** System may generate a one-paragraph "catch me up" summary of a client's timeline (FR-COM-1) — flagged as unvalidated; requires a feasibility/accuracy review before commitment.

### 3.10 Command-center dashboard
*Traces to blueprint Section 9 (question-to-feature mapping).*
- **FR-DASH-1 (M, Phase 1):** System shall provide a single landing view answering "what's due today," aggregating overdue/due-today items from document requests, compliance tasks, and notices (compliance tasks and notices populate this view starting Phase 2, as those modules ship).
- **FR-DASH-2 (S, Phase 2):** Dashboard shall support filtering by client, by owner (for firms with staff), and by urgency.
- **FR-DASH-3 (S, Phase 2):** Dashboard shall show a "waiting for my review" count/list, sourced from FR-REV-3.

### 3.11 Knowledge & continuity
*Traces to blueprint Section 4.F (hypothesis-tier pain, low-cost to build).*
- **FR-KNOW-1 (S, Phase 2):** System shall support a structured, always-current "client notes" record per client (key facts, standing instructions) distinct from the chronological timeline (FR-COM-1) — built for handover to another staff member.
- **FR-KNOW-2 (C, Phase 2):** Client notes shall be visible only internally, never in the client-facing timeline view.

---

## 4. External interface requirements

### 4.1 User interfaces
- Web app, responsive down to mobile browser widths (client-facing document upload and status views are the highest-priority mobile surfaces, since clients will most often check/upload from a phone).
- CA-facing views assume desktop-primary use but must remain functional on mobile for on-the-go deadline/review checks.

### 4.2 Hardware interfaces
None beyond standard client devices (desktop/mobile browser). No specialized hardware required.

### 4.3 Software interfaces
| Interface | Purpose | Phase | Notes |
|---|---|---|---|
| Supabase Postgres/Auth/Storage | Core data, auth, file storage | 1 (existing) | Already in use; extended per Section 5 |
| Supabase Edge Functions (or equivalent scheduled job) | Recurring compliance task generation (FR-CAL-2) | 2 | Cron-triggered |
| OCR/LLM provider (e.g., document AI API) | Bank statement/invoice extraction (FR-AI-1) | 3 | Vendor TBD; must support staged/non-persistent extraction calls |
| Email provider (transactional) | Client reminders (FR-COM-3 baseline) | 2–3 | Lower integration cost than WhatsApp; ship first |
| WhatsApp Business API (Meta) | Client reminders, richer channel | 3 | Requires Meta Business verification, ongoing cost — confirm ROI before commit |
| GST portal / TRACES / Income-Tax e-filing (auto-fetch) | Automated notice retrieval (FR-NOT-5) | 4, conditional | Requires separate feasibility spike before any commitment |

### 4.4 Communication interfaces
Standard HTTPS for all client-server and third-party API communication. No custom protocols required.

---

## 5. Data requirements

### 5.1 Existing schema (unchanged, retained as-is)
`ca_profiles`, `clients`, `client_financials`, `reports` — as defined in `20240823164000_init_schema.sql`, with existing RLS policies preserved unmodified.

### 5.2 New/extended tables (illustrative — final column list to be refined at implementation time)

```
-- Team support (FR-CLI-2, FR-CLI-3)
team_members (id, firm_id [-> ca_profiles.id], user_id [-> auth.users], role, created_at)

-- Extends clients (FR-CLI-1)
ALTER TABLE clients ADD COLUMN gstin text, pan text,
  filing_frequency text, registration_date date, assigned_to uuid REFERENCES team_members(id);

-- Document collection (FR-DOC-1..6)
document_request_lists (id, client_id, report_type, title, created_at)
document_request_items (id, list_id, name, required boolean, due_date, status, storage_path, updated_at)

-- Compliance engine (FR-CAL-1..6)
compliance_rules (id, entity_type, task_type, frequency, generation_logic)
compliance_tasks (id, client_id, task_type, due_date, owner_id, status, source_rule_id)

-- Review workflow (FR-REV-1..5)
report_review_comments (id, report_id, field_path, comment_text, author_id, created_at, resolved boolean)
-- Report.status enum extended: draft | submitted_for_review | changes_requested | approved | finalized

-- Notice management (FR-NOT-1..5)
notices (id, client_id, source_portal, notice_type, section_ref, received_date, due_date, status, linked_task_id)
notice_response_templates (id, notice_type, template_body, version)

-- Client communication (FR-COM-1..5)
client_timeline_events (id, client_id, event_type, ref_id, ref_table, visible_to_client boolean, created_at)
client_notes (id, client_id, content, visible_internally_only boolean, updated_at)

-- Billing (FR-BIL-1..4)
invoices (id, client_id, report_id, amount, status, due_date, paid_date, payment_method)
```

### 5.3 Data retention & audit trail
- Every new table that feeds a number into a report must produce `AuditedValue`-wrapped output before it reaches the reporting layer (FR-RPT-1 constraint) — raw uploaded/extracted data is never presented as a final figure without going through the existing audited-value construction.
- `report_review_comments` are retained permanently (never hard-deleted) to preserve review-history integrity for peer-review/quality-control purposes (relevant given ICAI's mandatory peer review requirements for larger practice units).
- All new tables require RLS policies scoped consistently with the existing `ca_id = auth.uid()` (or, once `team_members` exists, firm-scoped) pattern — no new table ships without an RLS policy.

---

## 6. Non-functional requirements

### 6.1 Performance
- Dashboard (FR-DASH-1) shall load in under 2 seconds for a firm with up to 500 clients under typical broadband/mobile-data conditions.
- Compliance task generation (FR-CAL-2) shall run as a background job, not blocking any user-facing request.

### 6.2 Security
- All file uploads (documents, bank statements) stored via Supabase Storage with access scoped by RLS-equivalent bucket policies — no publicly guessable URLs for client financial documents.
- Tokenized client-upload links (FR-DOC-4) shall be single-purpose, expiring, and scoped to the specific document request list — not a general account credential.
- AI/OCR extraction calls (FR-AI-1) shall not persist uploaded documents at the third-party provider beyond the extraction call, where the provider's terms allow configuring this; provider selection must confirm this before integration.

### 6.3 Privacy & regulatory compliance
- **DPDP Act, 2023:** All client financial document handling must include clear consent capture at the point of first document request, and data-handling practices (retention, deletion on request) must be documented and enforced, not just described in a policy page.
- **ICAI solicitation rules:** Per FR-COM-4/FR-COM-5, no messaging feature may be used for promotional outreach to non-clients or prospective clients — enforced structurally (message-send always requires an existing `client_id`), not just by policy.
- **ICAI peer review readiness:** For firms subject to mandatory peer review (per ICAI's phased thresholds), the review-comment and audit-trail data (Section 5.3) should be exportable in a form a peer reviewer could reasonably use as documentation evidence.

### 6.4 Reliability & availability
- Compliance task generation and notice due-date tracking are correctness-critical (a missed deadline has real financial/penalty consequences for the CA's client) — these jobs require monitoring/alerting on failure, not just best-effort execution.
- No single point of failure in deadline visibility: the compliance calendar (FR-CAL-4) must be the system of record, replacing (not supplementing) any external spreadsheet, or the "three conflicting deadline lists" failure mode from the research simply recurs inside the new tool.

### 6.5 Auditability & traceability
- Every requirement in Section 3 that touches a number appearing in a client-facing report must satisfy the existing `AuditedValue` contract — this is the product's core differentiator (Section 8 of the blueprint) and must not be diluted by any new feature.
- Task/notice status changes should be timestamped and attributable to a specific user (team-member-aware once FR-CLI-3 ships), supporting internal accountability review.

### 6.6 Usability
- Client-facing views (document upload, status check) must be usable by a non-accountant on a mobile browser without instructions — this directly targets the "clients don't understand what's needed" pain point from the research.
- Internal CA/staff views may assume domain familiarity (GST/TDS/ROC terminology) without needing to explain those terms in-product.

### 6.7 Maintainability & testability
- Every new pipeline-adjacent calculation (e.g., anything producing an `AuditedValue`) must ship with unit tests following the existing Vitest pattern (69 tests currently passing across 8 files) — no new calculation logic ships untested.
- `tsc --noEmit` must remain clean after every module addition — no `any`-typed escape hatches introduced to bypass the existing strict-typing discipline.

### 6.8 Scalability
- Schema and RLS design (Section 5) must support a firm growing from solo-CA to a multi-partner, multi-staff practice without a data-model migration — `team_members` and `assigned_to` fields are designed in from Phase 2 specifically to avoid this.

---

## 7. System architecture overview

```
                        ┌─────────────────────────────┐
                        │   Next.js App Router (UI)    │
                        │  Server Actions per module   │
                        └───────────────┬─────────────┘
                                        │
        ┌───────────────┬──────────────┼──────────────┬───────────────┐
        │               │              │              │               │
   Document        Compliance      Review Queue    Notice Mgmt     Billing
   Requests        Calendar Engine  (report status  (log + task    (invoice
   (FR-DOC)        (FR-CAL,         extension,      linkage,       linkage,
                    scheduled job)   FR-REV)         FR-NOT)        FR-BIL)
        │               │              │              │               │
        └───────────────┴──────────────┼──────────────┴───────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   Existing Pipeline Core    │
                          │  cma.ts / feasibility.ts /   │
                          │  financial-health.ts         │
                          │  (unchanged, AuditedValue)    │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   Supabase Postgres + RLS    │
                          │  (existing tables + Sec. 5)  │
                          └───────────────────────────┘

   AI-assisted layer (FR-AI) sits beside Document Requests and Notice
   Mgmt as a staged/human-confirmed extraction+drafting service —
   never writes directly to client_financials or sends messages.
```

---

## 8. Representative use cases

**UC-1: CA requests documents for a new CMA report.**
CA opens client → creates a document request list from the "CMA" template (FR-DOC-3) → system generates line items with due dates → client receives a link (FR-DOC-4), uploads bank statements and financials → CA sees status update on the firm-wide document dashboard (FR-DOC-5) → once all required items are received, CA proceeds to the existing CMA form (unchanged), pre-filled from uploaded data where FR-RPT-2 applies.

**UC-2: Staff member prepares, partner reviews.**
Staff member (assigned via FR-CLI-2) prepares a Feasibility report, submits for review (FR-REV-1) → partner sees it in the review queue (FR-REV-3), comments on a specific synergy-NPV figure referencing its formula (FR-REV-2) → staff member revises, resubmits → partner approves → report finalizes → invoice prompt fires (FR-BIL-1).

**UC-3: A GST scrutiny notice arrives.**
CA logs the ASMT-10 notice against the client (FR-NOT-1) → system creates a tracked task with the response due date (FR-NOT-2) → notice appears on the firm-wide notice dashboard (FR-NOT-4), sorted by urgency → CA drafts a response using a suggested template (FR-AI-4), reviews and submits externally (submission itself is manual/out-of-scope per Section 1.2) → status marked resolved.

**UC-4: A client can't remember what's still owed.**
Client opens their status link → sees outstanding document requests (FR-DOC-4) and a client-facing timeline of what's been done for them so far (FR-COM-1/FR-COM-2) — no phone call to the CA required.

---

## 9. Phased delivery plan (traceability to blueprint roadmap)

| Phase | Focus | Requirements shipped |
|---|---|---|
| **Phase 1** | Immediate improvements, no new integrations | FR-CLI-1, FR-CLI-4, FR-DOC-1–4, FR-COM-1–2, FR-DASH-1 |
| **Phase 2** | High-value workflows, new tables, no external integrations | FR-CLI-2–3, FR-DOC-5, FR-CAL-1–5, FR-REV-1–5, FR-NOT-1–4, FR-BIL-1–2, FR-RPT-2, FR-DASH-2–3, FR-KNOW-1–2 |
| **Phase 3** | Automation & AI, external integrations, human-reviewed | FR-DOC-6, FR-COM-3–4, FR-AI-1–5, FR-BIL-3 |
| **Phase 4** | Advanced intelligence / conditional items | FR-CAL-6 (hypothesis), FR-NOT-5 (conditional on spike), FR-AI-6 (hypothesis), FR-BIL-4, FR-RPT-3 (conditional on demand) |

---

## 10. Assumptions, risks, and open issues

- **Risk:** WhatsApp Business API cost/approval timeline could delay FR-COM-3's richer channel — mitigation is to ship the email channel first (lower integration cost) and treat WhatsApp as additive, not blocking.
- **Risk:** GST/TRACES/e-filing portal auto-fetch (FR-NOT-5) may not be technically or legally feasible (ToS restrictions, anti-scraping measures) — this SRS deliberately scopes Phase 2's notice management as manual-logging so the product delivers real value even if auto-fetch never ships.
- **Risk:** AI extraction accuracy (FR-AI-1) on messy/scanned Indian bank statement formats needs real-world validation before being trusted with real client data — FR-AI-2's human-confirmation gate exists specifically to contain this risk, not eliminate the need for accuracy testing.
- **Open issue:** Multi-firm/team billing model (per-seat pricing implications of FR-CLI-3's team_members table) is a business decision, not a technical one — flagged here so it's resolved before Phase 2 schema work locks in.
- **Open issue:** Whether Phase 4's predictive/summarization features (FR-CAL-6, FR-AI-6) are worth building at all should be decided from direct conversations with the founding-CA cohort, not from this document alone — both are explicitly hypothesis-tier in the source research.

---

## 11. Requirements traceability matrix

| FR ID | Module | Blueprint source | Priority | Phase |
|---|---|---|---|---|
| FR-CLI-1 | Client mgmt | Onboarding data needs | M | 1 |
| FR-CLI-2 | Client mgmt | Partner bottleneck / delegation | M | 2 |
| FR-CLI-3 | Client mgmt | Team scaling | S | 2 |
| FR-CLI-4 | Client mgmt | Backward compatibility constraint | M | 1 |
| FR-DOC-1–4 | Documents | Tier-1 pain #1 | M | 1 |
| FR-DOC-5 | Documents | Tier-1 pain #1, firm visibility | S | 2 |
| FR-DOC-6 | Documents | AI opportunity #2 | C | 3 |
| FR-CAL-1–5 | Compliance | Tier-1 pain #3 | M/S | 2 |
| FR-CAL-6 | Compliance | Hypothesis-tier, Sec 2 item 18 | C | 4 |
| FR-REV-1–5 | Review | Tier-1 pain #5, partner bottleneck | M | 2 |
| FR-NOT-1–4 | Notices | Tier-1 pain #4 | M/S | 2 |
| FR-NOT-5 | Notices | Differentiator, conditional | C | 4 |
| FR-COM-1–2 | Communication | Tier-1 pain #2/#6, existing positioning | M/S | 1 |
| FR-COM-3–5 | Communication | Tier-1 pain #6, ICAI constraint | M/S | 3 |
| FR-BIL-1–2 | Billing | Tier-2 pain #8 | M/S | 2 |
| FR-BIL-3–4 | Billing | Tier-2 pain #8, stretch | C | 3/4 |
| FR-RPT-1 | Reporting | Core-asset protection constraint | M | all |
| FR-RPT-2 | Reporting | Re-entry reduction | S | 2 |
| FR-RPT-3 | Reporting | Legacy valuation module, conditional | C | 4 |
| FR-AI-1–5 | AI layer | Blueprint Section 8, ranked | S/M/C | 3 |
| FR-AI-6 | AI layer | Hypothesis-tier | C | 4 |
| FR-DASH-1–3 | Dashboard | Command-center mapping | M/S | 1/2 |
| FR-KNOW-1–2 | Continuity | Hypothesis-tier, low-cost | S/C | 2 |

---

*This SRS is a living document — as Phase 1 ships and real CA feedback comes in, requirements marked hypothesis-tier or conditional should be revisited before Phase 3/4 work begins, per the blueprint's own recommendation to validate with a founding-CA cohort rather than build on unvalidated assumptions.*
