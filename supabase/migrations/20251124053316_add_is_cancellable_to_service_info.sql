ALTER TABLE service_cancellation_info 
ADD COLUMN IF NOT EXISTS is_cancellable BOOLEAN DEFAULT true;
