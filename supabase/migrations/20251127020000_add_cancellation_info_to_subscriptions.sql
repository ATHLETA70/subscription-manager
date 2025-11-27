-- Add cancellation_info column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_info JSONB;

-- Comment on column
COMMENT ON COLUMN subscriptions.cancellation_info IS 'Stores AI-generated cancellation information specific to this subscription instance';
