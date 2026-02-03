-- Create wellness_streaks table for gamification
CREATE TABLE public.wellness_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_check_ins INTEGER NOT NULL DEFAULT 0,
  last_check_in DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily_check_ins table
CREATE TABLE public.daily_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  gratitude_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- Create community_stories table for anonymous peer support
CREATE TABLE public.community_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anonymous_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood_tag TEXT,
  hearts_count INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_hearts table for tracking likes
CREATE TABLE public.story_hearts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.community_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Create ai_insights table for weekly reports
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  mood_summary TEXT,
  patterns_detected JSONB,
  recommendations JSONB,
  average_mood DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS on all tables
ALTER TABLE public.wellness_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_hearts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wellness_streaks
CREATE POLICY "Users can view own streaks" ON public.wellness_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.wellness_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.wellness_streaks FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_check_ins
CREATE POLICY "Users can view own check-ins" ON public.daily_check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check-ins" ON public.daily_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check-ins" ON public.daily_check_ins FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for community_stories
CREATE POLICY "Anyone can view approved stories" ON public.community_stories FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own stories" ON public.community_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for story_hearts
CREATE POLICY "Anyone can view hearts" ON public.story_hearts FOR SELECT USING (true);
CREATE POLICY "Users can insert hearts" ON public.story_hearts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own hearts" ON public.story_hearts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "Users can view own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points) VALUES
('First Step', 'Complete your first daily check-in', '🌱', 'check-in', 'total_check_ins', 1, 10),
('Week Warrior', '7-day check-in streak', '🔥', 'streak', 'current_streak', 7, 50),
('Two Week Champion', '14-day check-in streak', '💪', 'streak', 'current_streak', 14, 100),
('Month Master', '30-day check-in streak', '🏆', 'streak', 'current_streak', 30, 250),
('Journaler', 'Write 5 journal entries', '📝', 'journal', 'journal_entries', 5, 30),
('Story Teller', 'Share your first community story', '💬', 'community', 'stories_shared', 1, 25),
('Breathing Pro', 'Complete 10 breathing exercises', '🌬️', 'breathing', 'breathing_sessions', 10, 40),
('Voice Explorer', 'Have 5 voice conversations', '🎤', 'voice', 'voice_sessions', 5, 35),
('Mood Tracker', 'Track mood for 7 consecutive days', '📊', 'mood', 'mood_streak', 7, 45),
('Wellness Warrior', 'Earn 500 total points', '⭐', 'milestone', 'total_points', 500, 100);

-- Create trigger for updating timestamps
CREATE TRIGGER update_wellness_streaks_updated_at
BEFORE UPDATE ON public.wellness_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();