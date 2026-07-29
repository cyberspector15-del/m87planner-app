-- Add omv_balance to profiles
ALTER TABLE public.profiles ADD COLUMN omv_balance integer DEFAULT 0;

-- Create omv_transactions table
CREATE TABLE public.omv_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for omv_transactions
ALTER TABLE public.omv_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for omv_transactions
CREATE POLICY "Users can view own omv_transactions" ON public.omv_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own omv_transactions" ON public.omv_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_omv_transactions_user_id ON public.omv_transactions(user_id);
