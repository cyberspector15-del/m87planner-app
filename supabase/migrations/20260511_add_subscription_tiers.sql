ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text 
DEFAULT 'none' 
CHECK (subscription_tier = ANY (ARRAY[
  'none'::text,
  'event_horizon'::text, 
  'advance'::text, 
  'apex'::text, 
  'singularity'::text
]));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status text
DEFAULT 'inactive'
CHECK (subscription_status = ANY (ARRAY[
  'inactive'::text,
  'active'::text,
  'cancelled'::text
]));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_period_end timestamp with time zone;

-- For testing: set existing users to active singularity
UPDATE public.profiles 
SET subscription_tier = 'singularity', 
    subscription_status = 'active'
WHERE subscription_tier = 'none';
