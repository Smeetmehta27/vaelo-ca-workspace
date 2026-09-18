CREATE TABLE IF NOT EXISTS client_notes (
    client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_by UUID REFERENCES team_members(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- Team can manage notes for clients of their firm
CREATE POLICY "Team can manage client notes" ON client_notes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM clients
            JOIN get_my_team_memberships() tm(id, firm_id, role) 
              ON tm.firm_id = clients.ca_id
            WHERE clients.id = client_notes.client_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients
            JOIN get_my_team_memberships() tm(id, firm_id, role) 
              ON tm.firm_id = clients.ca_id
            WHERE clients.id = client_notes.client_id
        )
    );


