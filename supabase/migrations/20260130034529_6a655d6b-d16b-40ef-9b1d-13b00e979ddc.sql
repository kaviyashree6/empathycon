-- Fix the permissive INSERT policy - only allow service role (via RPC) or authenticated inserts
DROP POLICY IF EXISTS "Service role can insert crisis alerts" ON public.crisis_alerts;

-- Create a more restrictive insert policy - inserts happen via edge function with service role
-- This policy allows no direct inserts from client, only service role bypasses RLS
CREATE POLICY "No direct client inserts"
ON public.crisis_alerts
FOR INSERT
WITH CHECK (false);