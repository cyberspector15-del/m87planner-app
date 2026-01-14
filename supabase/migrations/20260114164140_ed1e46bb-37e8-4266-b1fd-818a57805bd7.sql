-- Add subscription tier and AI usage tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS conversation_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_commands_used_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_commands_reset_date DATE DEFAULT CURRENT_DATE;

-- Create a function to reset daily AI usage
CREATE OR REPLACE FUNCTION public.reset_daily_ai_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If the reset date is not today, reset the counter
  IF NEW.ai_commands_reset_date IS DISTINCT FROM CURRENT_DATE THEN
    NEW.ai_commands_used_today := 0;
    NEW.ai_commands_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-reset on any profile update
DROP TRIGGER IF EXISTS reset_ai_usage_trigger ON public.profiles;
CREATE TRIGGER reset_ai_usage_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.reset_daily_ai_usage();

-- Create a function to increment AI command usage and check limits
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_tier TEXT;
  v_used INTEGER;
  v_limit INTEGER;
  v_reset_date DATE;
  v_result JSON;
BEGIN
  -- Get current user data
  SELECT subscription_tier, ai_commands_used_today, ai_commands_reset_date
  INTO v_tier, v_used, v_reset_date
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Reset if new day
  IF v_reset_date IS DISTINCT FROM CURRENT_DATE THEN
    v_used := 0;
  END IF;

  -- Determine limit based on tier
  IF v_tier = 'pro' THEN
    v_limit := 20;
  ELSE
    v_limit := 3;
  END IF;

  -- Check if limit reached
  IF v_used >= v_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'used', v_used,
      'limit', v_limit,
      'tier', v_tier,
      'remaining', 0
    );
  END IF;

  -- Increment usage
  UPDATE public.profiles
  SET ai_commands_used_today = v_used + 1,
      ai_commands_reset_date = CURRENT_DATE
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'allowed', true,
    'used', v_used + 1,
    'limit', v_limit,
    'tier', v_tier,
    'remaining', v_limit - v_used - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to get AI usage status without incrementing
CREATE OR REPLACE FUNCTION public.get_ai_usage_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_tier TEXT;
  v_used INTEGER;
  v_limit INTEGER;
  v_reset_date DATE;
  v_conv_mode BOOLEAN;
BEGIN
  -- Get current user data
  SELECT subscription_tier, ai_commands_used_today, ai_commands_reset_date, conversation_mode_enabled
  INTO v_tier, v_used, v_reset_date, v_conv_mode
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Reset if new day
  IF v_reset_date IS DISTINCT FROM CURRENT_DATE THEN
    v_used := 0;
  END IF;

  -- Determine limit based on tier
  IF v_tier = 'pro' THEN
    v_limit := 20;
  ELSE
    v_limit := 3;
  END IF;

  RETURN json_build_object(
    'used', v_used,
    'limit', v_limit,
    'tier', v_tier,
    'remaining', GREATEST(v_limit - v_used, 0),
    'conversationModeEnabled', v_conv_mode,
    'canUseConversationMode', v_tier = 'pro'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;