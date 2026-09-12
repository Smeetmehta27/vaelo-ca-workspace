-- 1. Create team_members table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES ca_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','partner','staff')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(firm_id, user_id)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- team_members RLS Policies
CREATE POLICY "Team members can view firm roster" ON team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid())
  );

CREATE POLICY "Owners and partners can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

CREATE POLICY "Owners and partners can update team members" ON team_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

CREATE POLICY "Owners and partners can delete team members" ON team_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

-- 2. Backfill team_members with owners
INSERT INTO team_members (firm_id, user_id, role)
SELECT id, id, 'owner' FROM ca_profiles;

-- 3. Update clients table
ALTER TABLE clients ADD COLUMN assigned_to uuid REFERENCES team_members(id);

-- Backfill assigned_to on clients
UPDATE clients
SET assigned_to = tm.id
FROM team_members tm
WHERE clients.ca_id = tm.firm_id AND tm.role = 'owner';

-- Alter assigned_to to NOT NULL
ALTER TABLE clients ALTER COLUMN assigned_to SET NOT NULL;

-- 4. clients RLS Rewrite
DROP POLICY IF EXISTS "CAs can manage their own clients" ON clients;

CREATE POLICY "Team can view assigned clients" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = clients.ca_id AND (team_members.role IN ('owner','partner') OR clients.assigned_to = team_members.id))
  );

CREATE POLICY "Team can update assigned clients" ON clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = clients.ca_id AND (team_members.role IN ('owner','partner') OR clients.assigned_to = team_members.id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = ca_id AND (team_members.role IN ('owner','partner') OR clients.assigned_to = team_members.id))
  );

CREATE POLICY "Owners and partners can insert clients" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = ca_id AND team_members.role IN ('owner','partner'))
  );

CREATE POLICY "Owners and partners can delete clients" ON clients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = clients.ca_id AND team_members.role IN ('owner','partner'))
  );

-- Trigger to prevent staff from updating assigned_to
CREATE OR REPLACE FUNCTION check_client_reassignment() RETURNS trigger AS $$
BEGIN
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    IF EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
        AND firm_id = OLD.ca_id 
        AND role = 'staff'
    ) THEN
      RAISE EXCEPTION 'Staff members cannot reassign clients';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_client_reassignment
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION check_client_reassignment();

-- 5. Downstream tables
-- client_financials
DROP POLICY IF EXISTS "CAs can manage financials for their clients" ON client_financials;
CREATE POLICY "Team can manage financials for assigned clients" ON client_financials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = client_financials.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = client_financials.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  );

-- reports
DROP POLICY IF EXISTS "CAs can manage reports for their clients" ON reports;
CREATE POLICY "Team can manage reports for assigned clients" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = reports.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = reports.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  );

-- document_request_lists
DROP POLICY IF EXISTS "CAs can manage document request lists for their clients" ON document_request_lists;
CREATE POLICY "Team can manage document request lists for assigned clients" ON document_request_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = document_request_lists.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = document_request_lists.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  );

-- document_request_items
DROP POLICY IF EXISTS "CAs can manage document request items for their clients" ON document_request_items;
CREATE POLICY "Team can manage document request items for assigned clients" ON document_request_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_request_lists
      JOIN clients ON clients.id = document_request_lists.client_id
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE document_request_lists.id = document_request_items.list_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_request_lists
      JOIN clients ON clients.id = document_request_lists.client_id
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE document_request_lists.id = document_request_items.list_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  );

-- document_request_templates
DROP POLICY IF EXISTS "CAs can manage their own templates" ON document_request_templates;
CREATE POLICY "Team can manage firm templates" ON document_request_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.firm_id = document_request_templates.ca_id 
        AND (team_members.role IN ('owner', 'partner') OR team_members.role = 'staff') -- Wait, the user didn't specify templates assigned to.
        -- Actually, they said "Replace each existing policy's inner clients.ca_id = auth.uid() check with the same team_members-based EXISTS pattern used for clients' SELECT policy... confirm this reasoning holds for each table before applying it uniformly".
        -- document_request_templates is NOT joined through clients. It has `ca_id = auth.uid()`.
        -- So for templates, it should probably be firm-wide for all team members (owner/partner/staff) because templates aren't per-client. Let's make it so all members of the firm can manage templates. 
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.firm_id = ca_id 
    )
  );

-- Wait, let's look at the user prompt: "Replace each existing policy's inner clients.ca_id = auth.uid() check with the same team_members-based EXISTS pattern used for clients' SELECT policy... confirm this reasoning holds for each table... flag if any table has a reason to differ".
-- Since document_request_templates isn't tied to a client (it just has ca_id), if we apply the exact same pattern, `clients.assigned_to` doesn't exist for templates. So templates are firm-wide.
-- I'll use: `EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = document_request_templates.ca_id)` for both USING and WITH CHECK.

-- Let's redefine for templates:
-- document_request_templates
DROP POLICY IF EXISTS "CAs can manage their own templates" ON document_request_templates;
CREATE POLICY "Team can manage firm templates" ON document_request_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = document_request_templates.ca_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.user_id = auth.uid() AND team_members.firm_id = ca_id)
  );

-- document_request_template_items
DROP POLICY IF EXISTS "CAs can manage their own template items" ON document_request_template_items;
CREATE POLICY "Team can manage firm template items" ON document_request_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_request_templates
      JOIN team_members ON team_members.firm_id = document_request_templates.ca_id
      WHERE document_request_templates.id = document_request_template_items.template_id
        AND team_members.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_request_templates
      JOIN team_members ON team_members.firm_id = document_request_templates.ca_id
      WHERE document_request_templates.id = document_request_template_items.template_id
        AND team_members.user_id = auth.uid()
    )
  );

-- client_timeline_events
DROP POLICY IF EXISTS "CAs can manage timeline events for their clients" ON client_timeline_events;
CREATE POLICY "Team can manage timeline events for assigned clients" ON client_timeline_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = client_timeline_events.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN team_members ON team_members.firm_id = clients.ca_id
      WHERE clients.id = client_timeline_events.client_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role IN ('owner', 'partner') OR clients.assigned_to = team_members.id)
    )
  );

-- 6. Create team_invites table
CREATE TABLE team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES ca_profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('partner','staff')),
  email text NOT NULL,
  access_token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and partners can view invites" ON team_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_invites.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

CREATE POLICY "Owners and partners can insert invites" ON team_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

CREATE POLICY "Owners and partners can update invites" ON team_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_invites.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );
