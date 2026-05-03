-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Societies Table (Replaces SOCIETY_CONFIG)
create table societies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subtitle text,
  address text not null,
  email text,
  logo text,
  maintenance_amount numeric not null,
  governing_body jsonb default '[]'::jsonb,
  executive_members jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Users Table (Extends Supabase Auth auth.users)
-- We use a profile table linked to auth.users for application-specific user data.
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Society Users Table (Many-to-Many relationship between Users and Societies)
create table society_users (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid references societies(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(society_id, user_id)
);

-- 4. Members Table
create table members (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid references societies(id) on delete cascade not null,
  name text not null,
  flat_no text not null,
  phone text not null,
  email text,
  type text not null check (type in ('owner', 'tenant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(society_id, flat_no)
);

-- 5. Events Table
create table events (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid references societies(id) on delete cascade not null,
  name text not null,
  expected_amount numeric not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Payments Table
create table payments (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid references societies(id) on delete cascade not null,
  member_id uuid references members(id) on delete cascade not null,
  type text not null check (type in ('maintenance', 'event')),
  event_id uuid references events(id) on delete cascade,
  amount numeric not null,
  status text not null check (status in ('paid', 'pending')),
  date date not null,
  period text,
  payment_mode text check (payment_mode in ('cash', 'online', 'upi', 'cheque')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Expenses Table
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid references societies(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  title text not null,
  amount numeric not null,
  notes text,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_societies_updated_at before update on societies for each row execute procedure update_updated_at_column();
create trigger update_members_updated_at before update on members for each row execute procedure update_updated_at_column();
create trigger update_events_updated_at before update on events for each row execute procedure update_updated_at_column();
create trigger update_payments_updated_at before update on payments for each row execute procedure update_updated_at_column();
create trigger update_expenses_updated_at before update on expenses for each row execute procedure update_updated_at_column();

-- User creation trigger to sync auth.users with public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security (RLS) Policies
-- Note: These policies assume that API routes use server clients matching the authenticated user.

alter table societies enable row level security;
alter table users enable row level security;
alter table society_users enable row level security;
alter table members enable row level security;
alter table events enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;

-- Societies: Users can view societies they belong to
create policy "Users can view their societies" on societies
  for select using (
    exists (
      select 1 from society_users su
      where su.society_id = societies.id
      and su.user_id = auth.uid()
    )
  );

-- Users: Users can view their own profile
create policy "Users can view their own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = id);

-- Society Users: Users can view mappings for their societies
create policy "Users can view society_users for their societies" on society_users
  for select using (user_id = auth.uid());

-- Domain Tables: Users can perform operations if they are part of the society

-- Members
create policy "Members select policy" on members for select using (
  exists (select 1 from society_users where society_id = members.society_id and user_id = auth.uid())
);
create policy "Members insert policy" on members for insert with check (
  exists (select 1 from society_users where society_id = members.society_id and user_id = auth.uid())
);
create policy "Members update policy" on members for update using (
  exists (select 1 from society_users where society_id = members.society_id and user_id = auth.uid())
);
create policy "Members delete policy" on members for delete using (
  exists (select 1 from society_users where society_id = members.society_id and user_id = auth.uid())
);

-- Events
create policy "Events select policy" on events for select using (
  exists (select 1 from society_users where society_id = events.society_id and user_id = auth.uid())
);
create policy "Events insert policy" on events for insert with check (
  exists (select 1 from society_users where society_id = events.society_id and user_id = auth.uid())
);
create policy "Events update policy" on events for update using (
  exists (select 1 from society_users where society_id = events.society_id and user_id = auth.uid())
);
create policy "Events delete policy" on events for delete using (
  exists (select 1 from society_users where society_id = events.society_id and user_id = auth.uid())
);

-- Payments
create policy "Payments select policy" on payments for select using (
  exists (select 1 from society_users where society_id = payments.society_id and user_id = auth.uid())
);
create policy "Payments insert policy" on payments for insert with check (
  exists (select 1 from society_users where society_id = payments.society_id and user_id = auth.uid())
);
create policy "Payments update policy" on payments for update using (
  exists (select 1 from society_users where society_id = payments.society_id and user_id = auth.uid())
);
create policy "Payments delete policy" on payments for delete using (
  exists (select 1 from society_users where society_id = payments.society_id and user_id = auth.uid())
);

-- Expenses
create policy "Expenses select policy" on expenses for select using (
  exists (select 1 from society_users where society_id = expenses.society_id and user_id = auth.uid())
);
create policy "Expenses insert policy" on expenses for insert with check (
  exists (select 1 from society_users where society_id = expenses.society_id and user_id = auth.uid())
);
create policy "Expenses update policy" on expenses for update using (
  exists (select 1 from society_users where society_id = expenses.society_id and user_id = auth.uid())
);
create policy "Expenses delete policy" on expenses for delete using (
  exists (select 1 from society_users where society_id = expenses.society_id and user_id = auth.uid())
);

-- Allow public read of societies temporarily if needed for signup/selection before auth?
-- Not typically recommended unless public registration to existing society is allowed.
