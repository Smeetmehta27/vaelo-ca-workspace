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
  company_name: string;
  entity_type: string | null;
  created_at: string;
}

export interface ClientFinancials {
  id: string;
  client_id: string;
  financial_year: string;
  raw_data: any;
  created_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  report_type: ReportType;
  status: ReportStatus;
  output_data: any;
  generated_at: string | null;
  created_at: string;
}
