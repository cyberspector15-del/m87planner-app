-- Add settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS planning_mode text DEFAULT 'ai',
ADD COLUMN IF NOT EXISTS focus_hours_start time without time zone DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS focus_hours_end time without time zone DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS auto_carry_tasks boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_strictness text DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS ask_before_reschedule boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_ai_explanations boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS haptic_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sound_enabled boolean DEFAULT true;