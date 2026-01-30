-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'therapist', 'user');

-- Create user_roles table for proper authorization
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create crisis_alerts table for real-time escalation notifications
CREATE TABLE public.crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID,
  pseudo_user_id TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('high', 'medium')),
  primary_feeling TEXT,
  message_preview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on crisis_alerts
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Therapists can view all crisis alerts
CREATE POLICY "Therapists can view all crisis alerts"
ON public.crisis_alerts
FOR SELECT
USING (public.has_role(auth.uid(), 'therapist') OR public.has_role(auth.uid(), 'admin'));

-- Therapists can update crisis alerts (acknowledge/resolve)
CREATE POLICY "Therapists can update crisis alerts"
ON public.crisis_alerts
FOR UPDATE
USING (public.has_role(auth.uid(), 'therapist') OR public.has_role(auth.uid(), 'admin'));

-- System can insert crisis alerts (via service role in edge functions)
CREATE POLICY "Service role can insert crisis alerts"
ON public.crisis_alerts
FOR INSERT
WITH CHECK (true);

-- Enable realtime for crisis_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_alerts;

-- Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));