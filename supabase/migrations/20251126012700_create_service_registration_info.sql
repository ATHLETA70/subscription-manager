-- Create service_registration_info table for caching registration URLs
CREATE TABLE IF NOT EXISTS service_registration_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT UNIQUE NOT NULL,
  registration_url TEXT NOT NULL,
  registration_steps JSONB, -- Optional registration steps
  has_free_trial BOOLEAN DEFAULT false,
  trial_period TEXT, -- e.g., "30日間"
  notes TEXT, -- Additional notes about registration
  verified BOOLEAN DEFAULT false,
  verification_count INTEGER DEFAULT 0,
  user_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_registration_info_name ON service_registration_info(service_name);

-- Enable Row Level Security
ALTER TABLE service_registration_info ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated and anon)
CREATE POLICY "Allow public read access to registration info" ON service_registration_info
  FOR SELECT USING (true);

-- Allow insert/update only for authenticated users
CREATE POLICY "Allow authenticated insert to registration info" ON service_registration_info
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to registration info" ON service_registration_info
  FOR UPDATE USING (auth.role() = 'authenticated');
