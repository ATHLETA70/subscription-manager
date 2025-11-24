CREATE TABLE IF NOT EXISTS service_cancellation_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT UNIQUE NOT NULL,
  cancellation_url TEXT,
  cancellation_steps JSONB, -- Array of { label, description }
  required_info JSONB,      -- Array of { label, value }
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_cancellation_info_name ON service_cancellation_info(service_name);

-- Add RLS policies (optional but recommended)
ALTER TABLE service_cancellation_info ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated and anon)
CREATE POLICY "Allow public read access" ON service_cancellation_info
  FOR SELECT USING (true);

-- Allow insert/update only for authenticated users (or service role)
-- For now, we'll allow authenticated users to insert via the server action
CREATE POLICY "Allow authenticated insert" ON service_cancellation_info
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON service_cancellation_info
  FOR UPDATE USING (auth.role() = 'authenticated');
