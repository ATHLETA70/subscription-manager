-- Add user verification tracking to service_cancellation_info
ALTER TABLE service_cancellation_info 
ADD COLUMN IF NOT EXISTS user_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_count INTEGER DEFAULT 0;
