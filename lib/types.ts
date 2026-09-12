export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReportType = 'cma' | 'feasibility' | 'financial_health';
export type ReportStatus = 'draft' | 'reviewed' | 'finalized';

export interface CAProfile {
  id: string; // matches auth.users.id
  name: string | null;
  firm_name: string | null;
  icai_membership_number: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  ca_id: string;
  assigned_to: string;
  company_name: string;
  entity_type: string | null;
  gstin: string | null;
  pan: string | null;
  filing_frequency: string | null;
  registration_date: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  created_at: string;
}

export interface ClientFinancials {
  id: string;
  client_id: string;
  financial_year: string;
  raw_data: Json;
  created_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  report_type: ReportType;
  status: ReportStatus;
  output_data: Json;
  generated_at: string | null;
  created_at: string;
}

export interface DocumentRequestList {
  id: string;
  client_id: string;
  report_type: string | null;
  title: string;
  access_token: string;
  token_revoked: boolean;
  created_at: string;
}

export interface DocumentRequestItem {
  id: string;
  list_id: string;
  name: string;
  required: boolean;
  due_date: string | null;
  status: string;
  storage_path: string | null;
  updated_at: string;
}

export interface DocumentRequestTemplate {
  id: string;
  ca_id: string;
  report_type: string;
  name: string;
  created_at: string;
}

export interface DocumentRequestTemplateItem {
  id: string;
  template_id: string;
  name: string;
  required: boolean;
  sort_order: number;
}

export interface ClientTimelineEvent {
  id: string;
  client_id: string;
  event_type: string;
  summary: string;
  ref_table?: string;
  ref_id?: string;
  visible_to_client: boolean;
  created_at: string;
}

export type TeamRole = 'owner' | 'partner' | 'staff';

export interface TeamMember {
  id: string;
  firm_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
}

export interface TeamInvite {
  id: string;
  firm_id: string;
  role: 'partner' | 'staff';
  email: string;
  access_token: string;
  expires_at: string;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
}
