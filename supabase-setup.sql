-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → your project → SQL Editor)

CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  signed_up_at TIMESTAMPTZ DEFAULT now()
);

-- Allow inserts from the frontend (anon key)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Optional: allow reading count for admin purposes
CREATE POLICY "Allow authenticated reads" ON waitlist
  FOR SELECT
  USING (auth.role() = 'authenticated');
