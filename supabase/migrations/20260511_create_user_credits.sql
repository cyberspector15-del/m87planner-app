CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  balance integer DEFAULT 0 NOT NULL,
  monthly_allowance integer DEFAULT 0 NOT NULL,
  last_reset_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  amount integer NOT NULL,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY[
    'monthly_reset','simulation','auto_plan',
    'ai_command','conversation_mode',
    'smart_reschedule','addon_purchase'
  ])),
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_costs (
  action_type text PRIMARY KEY,
  cost integer NOT NULL
);

INSERT INTO public.credit_costs (action_type, cost) VALUES
  ('simulation', 200),
  ('auto_plan', 50),
  ('ai_command', 15),
  ('conversation_mode', 30),
  ('smart_reschedule', 20)
ON CONFLICT (action_type) DO NOTHING;

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read credit costs"
  ON public.credit_costs FOR SELECT
  TO authenticated USING (true);
