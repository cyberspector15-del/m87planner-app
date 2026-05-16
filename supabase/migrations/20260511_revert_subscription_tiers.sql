UPDATE public.profiles
SET subscription_tier = 'none',
    subscription_status = 'inactive'
WHERE subscription_tier = 'singularity';
