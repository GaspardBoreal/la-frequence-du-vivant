-- Fix security issue: Restrict access to narrative_interactions table
-- Remove the overly permissive policy that allows anyone to read user interaction data

-- Drop the existing policy that allows all operations to everyone
DROP POLICY IF EXISTS "Allow all operations on narrative_interactions" ON narrative_interactions;

-- Create restrictive policies for narrative_interactions
-- Only allow INSERT for logging interactions (applications need this)
CREATE POLICY "Allow insert narrative_interactions"
ON narrative_interactions
FOR INSERT
WITH CHECK (true);

-- Completely restrict SELECT access - this sensitive behavioral data should not be publicly readable
-- Only system administrators or service role should access this data
CREATE POLICY "Restrict narrative_interactions access"
ON narrative_interactions
FOR SELECT
USING (false);

-- Restrict UPDATE and DELETE - normal users shouldn't modify interaction logs
CREATE POLICY "Restrict narrative_interactions modifications"
ON narrative_interactions
FOR UPDATE
USING (false);

CREATE POLICY "Restrict narrative_interactions deletions"
ON narrative_interactions
FOR DELETE
USING (false);