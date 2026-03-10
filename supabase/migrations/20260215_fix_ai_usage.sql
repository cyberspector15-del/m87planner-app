-- Create ai_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  used_count INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 10,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_usage 
  FOR SELECT USING (auth.uid() = user_id);

-- Function: get_ai_usage_status
-- Returns usage stats + tier info + conservation mode eligibility
CREATE OR REPLACE FUNCTION public.get_ai_usage_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage RECORD;
  v_is_pro BOOLEAN;
  v_conv_enabled BOOLEAN;
BEGIN
  -- Ensure usage record exists
  INSERT INTO public.ai_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get usage data
  SELECT * INTO v_usage FROM public.ai_usage WHERE user_id = p_user_id;
  
  -- Reset count if it's a new day (simple logic)
  IF v_usage.last_used < CURRENT_DATE THEN
    UPDATE public.ai_usage SET used_count = 0, last_used = now() WHERE user_id = p_user_id;
    v_usage.used_count := 0;
  END IF;

  RETURN json_build_object(
    'used', v_usage.used_count,
    'limit', v_usage.daily_limit,
    'remaining', GREATEST(0, v_usage.daily_limit - v_usage.used_count),
    'tier', v_usage.tier,
    'conversationModeEnabled', false, -- Default to false for now
    'canUseConversationMode', v_usage.tier = 'pro'
  );
END;
$$;

-- Function: increment_ai_usage
-- Checks limit and increments usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage RECORD;
BEGIN
  -- Ensure usage record exists
  INSERT INTO public.ai_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_usage FROM public.ai_usage WHERE user_id = p_user_id;

  -- Reset count if new day
  IF v_usage.last_used < CURRENT_DATE THEN
     UPDATE public.ai_usage SET used_count = 0, last_used = now() WHERE user_id = p_user_id;
     v_usage.used_count := 0;
  END IF;

  -- Check limit
  IF v_usage.used_count >= v_usage.daily_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining', 0,
      'used', v_usage.used_count,
      'tier', v_usage.tier
    );
  END IF;

  -- Increment
  UPDATE public.ai_usage
  SET used_count = used_count + 1,
      last_used = now()
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'allowed', true,
    'remaining', v_usage.daily_limit - (v_usage.used_count + 1),
    'used', v_usage.used_count + 1,
    'tier', v_usage.tier
  );
END;
$$;
