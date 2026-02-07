-- Add ElevenLabs agent ID to profiles
ALTER TABLE public.profiles
ADD COLUMN elevenlabs_agent_id TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.elevenlabs_agent_id IS 'User-configurable ElevenLabs Conversational AI Agent ID';