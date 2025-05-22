-- Add user authentication table
CREATE TABLE user_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Will store bcrypt hash (salt is included in the hash)
  salt TEXT, -- No longer needed with bcrypt but kept for backward compatibility
  failed_attempts INTEGER DEFAULT 0, -- For account lockout after multiple failed attempts
  locked_until TIMESTAMP WITH TIME ZONE, -- Timestamp until account is locked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_auth_email ON user_auth(email);

-- Add RLS policies to secure the user_auth table
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own auth data
CREATE POLICY "Users can view own auth data" ON user_auth
  FOR SELECT USING (auth.uid()::text = id::text);

-- Allow inserts for registration
CREATE POLICY "Anyone can register" ON user_auth
  FOR INSERT WITH CHECK (true);

-- Only allow users to update their own auth data
CREATE POLICY "Users can update own auth data" ON user_auth
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow users to delete their own auth data
CREATE POLICY "Users can delete own auth data" ON user_auth
  FOR DELETE USING (auth.uid()::text = id::text);
