-- 1. Create notices table
CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  portal_source text NOT NULL,
  notice_type text NOT NULL,
  date_received date NOT NULL,
  response_due_date date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create notice_tasks table
CREATE TABLE notice_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL UNIQUE REFERENCES notices(id) ON DELETE CASCADE,
  task_type text NOT NULL DEFAULT 'Notice Response',
  due_date date NOT NULL,
  owner_id uuid REFERENCES team_members(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create notice_response_templates table
CREATE TABLE notice_response_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_type text NOT NULL,
  template_text text NOT NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_response_templates ENABLE ROW LEVEL SECURITY;

-- 5. RLS for notices
CREATE POLICY "Team can manage notices for assigned clients" ON notices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = notices.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = notices.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- 6. RLS for notice_tasks
-- Notice tasks follow the same visibility as the notice they belong to
CREATE POLICY "Team can manage tasks for notices of assigned clients" ON notice_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notices
      JOIN clients ON clients.id = notices.client_id
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE notices.id = notice_tasks.notice_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM notices
      JOIN clients ON clients.id = notices.client_id
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE notices.id = notice_tasks.notice_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- 7. RLS for templates (readable by everyone, writable by service role)
CREATE POLICY "Templates are readable by authenticated users" ON notice_response_templates
  FOR SELECT TO authenticated USING (true);

-- 8. Seed templates
INSERT INTO notice_response_templates (notice_type, template_text, version) VALUES 
('DRC-01A', 
'Subject: Intimation of tax ascertained as being payable under section 73(5)/74(5) [DRC-01A]

[WARNING: THIS IS A BOILERPLATE DRAFT. REVIEW BEFORE FILING]

Dear Sir/Madam,

This is with reference to the Intimation in Form GST DRC-01A dated [DATE] issued for the period [PERIOD]. 

1. We have reviewed the computation of liability enclosed with the said intimation.
2. [CA to insert: Detailed point-by-point reconciliation explaining why the liability is incorrect OR outlining partial acceptance and challan details].
3. In view of the above submissions, it is requested that proceedings under section 73/74 may not be initiated.

Thank you.

For [COMPANY_NAME]
Authorized Signatory', 
1),
('143(1)', 
'Subject: Response to Intimation u/s 143(1) for AY [AY]

[WARNING: THIS IS A BOILERPLATE DRAFT. REVIEW BEFORE FILING]

Dear Sir/Madam,

We are in receipt of the intimation under section 143(1) dated [DATE] for PAN [PAN] concerning Assessment Year [AY].

1. The intimation proposes a variation in the returned income / tax liability due to [CA to insert reason: e.g., mismatch in TDS / arithmetical error].
2. We respectfully disagree with the proposed adjustment. The correct position is as follows: [CA to insert facts].
3. We enclose herewith [CA to list attachments e.g., Form 26AS, revised computation] in support of our claim.

We request you to kindly rectify the order u/s 154 and grant the legitimate refund/delete the demand.

Thank you.

For [COMPANY_NAME]
Authorized Signatory', 
1);

-- 9. RPC for transactional notice creation
CREATE OR REPLACE FUNCTION create_notice_with_task(
  p_client_id uuid,
  p_portal_source text,
  p_notice_type text,
  p_date_received date,
  p_response_due_date date,
  p_created_by uuid,
  p_owner_id uuid
) RETURNS uuid AS $$
DECLARE
  v_notice_id uuid;
BEGIN
  -- Insert notice
  INSERT INTO notices (client_id, portal_source, notice_type, date_received, response_due_date, created_by)
  VALUES (p_client_id, p_portal_source, p_notice_type, p_date_received, p_response_due_date, p_created_by)
  RETURNING id INTO v_notice_id;

  -- Insert linked task
  INSERT INTO notice_tasks (notice_id, due_date, owner_id)
  VALUES (v_notice_id, p_response_due_date, p_owner_id);

  RETURN v_notice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

