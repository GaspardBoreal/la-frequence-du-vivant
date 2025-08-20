-- Fix security issue: Restrict access to user tracking data in exploration_clicks table

-- Drop the overly permissive policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on exploration_clicks" ON public.exploration_clicks;

-- Create restrictive policies for analytics data
-- Users can insert their own click data for tracking purposes
CREATE POLICY "Allow anonymous click tracking"
ON public.exploration_clicks
FOR INSERT
WITH CHECK (true);

-- Completely restrict read access to protect user privacy
-- Only system administrators should access this analytics data directly from database
CREATE POLICY "Restrict analytics data access"
ON public.exploration_clicks
FOR SELECT
USING (false);

-- Prevent unauthorized modifications and deletions
CREATE POLICY "Prevent unauthorized updates"
ON public.exploration_clicks
FOR UPDATE
USING (false);

CREATE POLICY "Prevent unauthorized deletions"
ON public.exploration_clicks
FOR DELETE
USING (false);