
-- Fix: Remove public access to anonymous sessions
-- Instead, anonymous sessions use session_token for access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their sessions" ON public.chat_messages;

-- Recreate chat_sessions policies: authenticated users only
CREATE POLICY "Users can view their own sessions"
ON public.chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
ON public.chat_sessions FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NOT NULL));

CREATE POLICY "Users can update their own sessions"
ON public.chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Recreate chat_messages policies: only for authenticated user's sessions
CREATE POLICY "Users can view messages in their sessions"
ON public.chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chat_sessions
  WHERE chat_sessions.id = chat_messages.session_id
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their sessions"
ON public.chat_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chat_sessions
  WHERE chat_sessions.id = chat_messages.session_id
  AND chat_sessions.user_id = auth.uid()
));
