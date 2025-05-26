-- Add missing contact_preference column to users table
ALTER TABLE users
ADD COLUMN contact_preference TEXT DEFAULT 'email';
