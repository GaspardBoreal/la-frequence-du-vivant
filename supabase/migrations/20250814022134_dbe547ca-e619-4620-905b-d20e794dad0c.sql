-- Add last_ping column to data_collection_logs table for better debugging
ALTER TABLE data_collection_logs ADD COLUMN IF NOT EXISTS last_ping TIMESTAMP WITH TIME ZONE;