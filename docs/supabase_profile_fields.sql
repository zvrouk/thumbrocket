-- Add subscription fields to profiles table
alter table profiles
  add column if not exists subscription_status text default 'inactive',
  add column if not exists subscription_plan text,
  add column if not exists paystack_reference text,
  add column if not exists current_period_end timestamp with time zone;

-- Optional: allow authenticated users to read their own profile
-- Adjust RLS policies as needed in your Supabase project.

