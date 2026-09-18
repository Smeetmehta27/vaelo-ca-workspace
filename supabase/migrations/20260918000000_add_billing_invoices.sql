-- 1. Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  due_date date NOT NULL,
  paid_date date,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 3. RLS for invoices
CREATE POLICY "Team can manage invoices for assigned clients" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = invoices.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = invoices.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );
