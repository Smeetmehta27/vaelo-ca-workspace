-- 1. Create compliance_rules table
CREATE TABLE compliance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  task_type text NOT NULL,
  frequency text NOT NULL,
  requires_gst boolean DEFAULT false,
  qrmp_only boolean DEFAULT false,
  day_of_period_due int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Create compliance_tasks table
CREATE TABLE compliance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_rule_id uuid REFERENCES compliance_rules(id),
  task_type text NOT NULL,
  period_label text NOT NULL,
  due_date date NOT NULL,
  owner_id uuid REFERENCES team_members(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, task_type, period_label)
);

-- 3. Enable RLS
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

-- 4. RLS for compliance_rules (publicly readable, writable by service role)
CREATE POLICY "Rules are readable by authenticated users" ON compliance_rules
  FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for compliance_rules, so it's only writable by service_role

-- 5. RLS for compliance_tasks (use get_my_team_memberships)
CREATE POLICY "Team can manage tasks for assigned clients" ON compliance_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = compliance_tasks.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = compliance_tasks.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- 6. Seed compliance_rules
-- GSTR-1: Monthly (day 11), QRMP variant (day 13)
INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'GSTR-1', 'monthly', true, false, 11
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'GSTR-1', 'quarterly', true, true, 13
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

-- GSTR-3B: Monthly (day 20), QRMP variant (day 24)
INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'GSTR-3B', 'monthly', true, false, 20
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'GSTR-3B', 'quarterly', true, true, 24
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

-- TDS Return: Quarterly (day 31)
INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'TDS_RETURN', 'quarterly', false, false, 31
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

-- Advance Tax: Quarterly (4 installments)
-- Instead of one rule with multiple due dates, we create 4 separate rules
-- 15 Jun (day 15 of 3rd month), 15 Sep (day 15 of 6th month), 15 Dec (day 15 of 9th month), 15 Mar (day 15 of 12th month)
-- Since the engine relies on 'day_of_period_due', and Advance Tax has specific months,
-- we'll model them as 'quarterly' and the engine will map them to the 15th of the quarter's last month.
-- Wait, advance tax is 15th of June, Sep, Dec, Mar. These are the 3rd, 6th, 9th, 12th months of the financial year (April-March).
-- So day 15 of the last month of the quarter.
INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'ADVANCE_TAX', 'quarterly', false, false, 15
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

-- ITR: Annual (Oct 31 for companies/LLP typically, but let's use default 31 for Oct)
INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'ITR', 'annual', false, false, 31
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP'), ('Partnership'), ('Proprietorship'), ('Trust')) AS t(entity_type);

-- ROC Filings: Annual (applicable only to Company/LLP)
INSERT INTO compliance_rules (entity_type, task_type, frequency, requires_gst, qrmp_only, day_of_period_due)
SELECT entity_type, 'ROC_FILING', 'annual', false, false, 30
FROM (VALUES ('Private Limited Company'), ('Public Limited Company'), ('LLP')) AS t(entity_type);
