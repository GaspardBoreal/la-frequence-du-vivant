-- Fix session_id type incompatibility in dordonia_parlement
-- First drop the foreign key constraint, then change the type

-- Drop the foreign key constraint
ALTER TABLE dordonia_parlement 
DROP CONSTRAINT IF EXISTS dordonia_parlement_session_id_fkey;

-- Now change the column type from uuid to text
ALTER TABLE dordonia_parlement 
ALTER COLUMN session_id TYPE text;