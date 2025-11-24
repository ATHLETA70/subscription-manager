-- Create subscriptions table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  amount integer not null,
  currency text default 'JPY',
  cycle text default 'monthly', -- 'monthly' or 'yearly'
  category text,
  first_payment_date date,
  next_payment_date date,
  image_url text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table subscriptions enable row level security;

-- Create policies
-- Allow users to view their own subscriptions
create policy "Users can view their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Allow users to insert their own subscriptions
create policy "Users can insert their own subscriptions"
  on subscriptions for insert
  with check (auth.uid() = user_id);

-- Allow users to update their own subscriptions
create policy "Users can update their own subscriptions"
  on subscriptions for update
  using (auth.uid() = user_id);

-- Allow users to delete their own subscriptions
create policy "Users can delete their own subscriptions"
  on subscriptions for delete
  using (auth.uid() = user_id);
