-- Add credits to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0;

-- Add check constraint to prevent negative credits (atomic protection)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS credits_non_negative;
ALTER TABLE public.profiles ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id text UNIQUE NOT NULL,
    payment_id text UNIQUE,
    signature text,
    amount integer NOT NULL, -- in Paise (e.g. ₹1000 = 100000 Paise)
    credits integer NOT NULL,
    status text NOT NULL DEFAULT 'created', -- 'created', 'paid', 'failed'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create credit_history table
CREATE TABLE IF NOT EXISTS public.credit_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount integer NOT NULL, -- positive for purchase, negative for usage
    action text NOT NULL, -- 'generation_spend', 'package_purchase', 'admin_adjustment'
    balance_after integer NOT NULL,
    reference_id text, -- order_id or consent_history.id
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can read their own transactions and credit history)
DROP POLICY IF EXISTS select_own_transactions ON public.transactions;
CREATE POLICY select_own_transactions ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_transactions ON public.transactions;
CREATE POLICY insert_own_transactions ON public.transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS select_own_credit_history ON public.credit_history;
CREATE POLICY select_own_credit_history ON public.credit_history FOR SELECT 
    USING (auth.uid() = user_id);

-- SECURITY DEFINER function to atomically deduct 1 credit
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid, p_reference_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- runs with admin privileges to update credits
AS $$
DECLARE
    v_current_credits integer;
    v_new_credits integer;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO v_current_credits
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    IF v_current_credits < 1 THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- Calculate new balance
    v_new_credits := v_current_credits - 1;

    -- Update profile
    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = now()
    WHERE id = p_user_id;

    -- Log to history
    INSERT INTO public.credit_history (user_id, amount, action, balance_after, reference_id)
    VALUES (p_user_id, -1, 'generation_spend', v_new_credits, p_reference_id);

    RETURN v_new_credits;
END;
$$;

-- SECURITY DEFINER function to verify and add credits safely
CREATE OR REPLACE FUNCTION public.verify_and_add_credits(
    p_user_id uuid,
    p_order_id text,
    p_payment_id text,
    p_signature text,
    p_amount integer,
    p_credits integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- runs with admin privileges
AS $$
DECLARE
    v_status text;
    v_current_credits integer;
    v_new_credits integer;
BEGIN
    -- Get and lock transaction if exists
    SELECT status INTO v_status
    FROM public.transactions
    WHERE order_id = p_order_id
    FOR UPDATE;

    -- If already paid, do nothing (prevent duplicate credit additions)
    IF v_status = 'paid' THEN
        SELECT credits INTO v_new_credits FROM public.profiles WHERE id = p_user_id;
        RETURN v_new_credits;
    END IF;

    -- Lock user profile
    SELECT credits INTO v_current_credits
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_credits IS NULL THEN
        -- Create profile if it doesn't exist for some reason
        INSERT INTO public.profiles (id, credits, role, updated_at)
        VALUES (p_user_id, 0, 'doctor', now());
        v_current_credits := 0;
    END IF;

    -- Calculate new credits
    v_new_credits := v_current_credits + p_credits;

    -- Update profile credits
    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = now()
    WHERE id = p_user_id;

    -- Update or Insert transaction
    INSERT INTO public.transactions (user_id, order_id, payment_id, signature, amount, credits, status, updated_at)
    VALUES (p_user_id, p_order_id, p_payment_id, p_signature, p_amount, p_credits, 'paid', now())
    ON CONFLICT (order_id) 
    DO UPDATE SET 
        payment_id = EXCLUDED.payment_id,
        signature = EXCLUDED.signature,
        status = 'paid',
        updated_at = now();

    -- Log to history
    INSERT INTO public.credit_history (user_id, amount, action, balance_after, reference_id)
    VALUES (p_user_id, p_credits, 'package_purchase', v_new_credits, p_order_id);

    RETURN v_new_credits;
END;
$$;
