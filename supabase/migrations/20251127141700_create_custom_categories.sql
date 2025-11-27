-- Create custom_categories table for user-defined categories
create table if not exists custom_categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    created_at timestamptz default now(),
    unique(user_id, name)
);

-- Enable Row Level Security (RLS)
alter table custom_categories enable row level security;

-- Create policies
-- Allow users to view their own custom categories
create policy "Users can view their own custom categories"
    on custom_categories for select
    using (auth.uid() = user_id);

-- Allow users to insert their own custom categories
create policy "Users can insert their own custom categories"
    on custom_categories for insert
    with check (auth.uid() = user_id);

-- Allow users to delete their own custom categories
create policy "Users can delete their own custom categories"
    on custom_categories for delete
    using (auth.uid() = user_id);
