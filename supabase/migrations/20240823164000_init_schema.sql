-- Enums
CREATE TYPE report_type AS ENUM ('cma', 'feasibility', 'financial_health');
CREATE TYPE report_status AS ENUM ('draft', 'reviewed', 'finalized');

-- ca_profiles
CREATE TABLE ca_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  firm_name text,
  icai_membership_number text,
  created_at timestamptz DEFAULT now()
);

-- clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_id uuid NOT NULL REFERENCES ca_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  entity_type text,
  created_at timestamptz DEFAULT now()
);

-- client_financials
CREATE TABLE client_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, financial_year)
);

-- reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  status report_status DEFAULT 'draft',
  output_data jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ca_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- CA Profiles: Can only read and update their own profile
CREATE POLICY "Users can view own profile" ON ca_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON ca_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON ca_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients: Can only read/write clients where ca_id = auth.uid()
CREATE POLICY "CAs can manage their own clients" ON clients FOR ALL USING (auth.uid() = ca_id) WITH CHECK (auth.uid() = ca_id);

-- Client Financials: Can only read/write financials for their own clients
CREATE POLICY "CAs can manage financials for their clients" ON client_financials FOR ALL
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_financials.client_id AND clients.ca_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_financials.client_id AND clients.ca_id = auth.uid()));

-- Reports: Can only read/write reports for their own clients
CREATE POLICY "CAs can manage reports for their clients" ON reports FOR ALL
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = reports.client_id AND clients.ca_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = reports.client_id AND clients.ca_id = auth.uid()));

-- Trigger for auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.ca_profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
