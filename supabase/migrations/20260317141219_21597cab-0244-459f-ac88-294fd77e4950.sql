
-- Fix overly permissive INSERT policy on payments
-- Only service role (edge functions) should insert payments
DROP POLICY "Service role can insert payments" ON public.payments;

-- Restrict INSERT to authenticated users inserting their own records
-- (edge functions using service role bypass RLS anyway)
CREATE POLICY "Authenticated users can insert own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
