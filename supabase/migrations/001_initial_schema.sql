-- ============================================================
-- LoveLink Chat — Supabase SQL Schema Migration
-- Run this entire file in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  bio text,
  is_guest boolean default false,
  role text default 'USER', -- USER | MODERATOR | ADMIN
  muted_until timestamptz,
  coin_balance integer default 0,
  is_online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username, is_guest)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'is_guest')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. ROOMS
-- ─────────────────────────────────────────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  description text,
  is_private boolean default false,
  max_users integer default 100,
  created_by uuid references public.profiles(id),
  online_count integer default 0,
  created_at timestamptz default now()
);

-- Seed default rooms
insert into public.rooms (room_name, description) values
  ('General', 'Main public chat room for everyone'),
  ('Lounge', 'Relax and chill here'),
  ('Tech Talk', 'Discuss technology and programming'),
  ('Music & Art', 'Share your creative side'),
  ('Gaming', 'Gamers unite!')
on conflict do nothing;

-- ─────────────────────────────────────────
-- 3. MESSAGES (public room messages)
-- ─────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  content text,
  type text default 'TEXT', -- TEXT | IMAGE | WHISPER | JOIN | WELCOME | SYSTEM
  receiver_id uuid references public.profiles(id), -- for whispers
  image_url text,
  created_at timestamptz default now()
);

create index if not exists messages_room_id_idx on public.messages(room_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

-- ─────────────────────────────────────────
-- 4. PRIVATE MESSAGES
-- ─────────────────────────────────────────
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  content text,
  image_url text,
  status text default 'sent', -- sent | delivered | read
  created_at timestamptz default now()
);

create index if not exists pm_sender_idx on public.private_messages(sender_id);
create index if not exists pm_receiver_idx on public.private_messages(receiver_id);

-- ─────────────────────────────────────────
-- 5. BLOCKS
-- ─────────────────────────────────────────
create table if not exists public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

-- ─────────────────────────────────────────
-- 6. FRIENDSHIPS
-- ─────────────────────────────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  addressee_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending', -- pending | accepted | rejected
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- ─────────────────────────────────────────
-- 7. GIFTS
-- ─────────────────────────────────────────
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  gift_type text not null,
  coin_cost integer default 0,
  message text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 8. REPORTS
-- ─────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id),
  reported_id uuid references public.profiles(id),
  reason text,
  description text,
  status text default 'pending', -- pending | reviewed | dismissed
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- 9. NOTIFICATIONS
-- ─────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null, -- message | gift | friend_request | system
  title text,
  body text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notif_user_idx on public.notifications(user_id);

-- ─────────────────────────────────────────
-- 10. ROW LEVEL SECURITY POLICIES
-- ─────────────────────────────────────────

-- PROFILES
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by all" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ROOMS
alter table public.rooms enable row level security;
create policy "Rooms are viewable by all" on public.rooms for select using (true);
create policy "Authenticated users can create rooms" on public.rooms for insert with check (auth.role() = 'authenticated');

-- MESSAGES
alter table public.messages enable row level security;
create policy "Messages are viewable by all" on public.messages for select using (true);
create policy "Authenticated users can insert messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can delete own messages" on public.messages for delete using (auth.uid() = sender_id);

-- PRIVATE MESSAGES
alter table public.private_messages enable row level security;
create policy "Participants can view private messages" on public.private_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Sender can insert private messages" on public.private_messages
  for insert with check (auth.uid() = sender_id);

-- BLOCKS
alter table public.blocks enable row level security;
create policy "Users see own blocks" on public.blocks using (auth.uid() = blocker_id);
create policy "Users can block others" on public.blocks for insert with check (auth.uid() = blocker_id);
create policy "Users can unblock" on public.blocks for delete using (auth.uid() = blocker_id);

-- FRIENDSHIPS
alter table public.friendships enable row level security;
create policy "Users see own friendships" on public.friendships
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on public.friendships
  for insert with check (auth.uid() = requester_id);
create policy "Addressee can update status" on public.friendships
  for update using (auth.uid() = addressee_id);

-- GIFTS
alter table public.gifts enable row level security;
create policy "Participants see gifts" on public.gifts
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send gifts" on public.gifts for insert with check (auth.uid() = sender_id);

-- REPORTS
alter table public.reports enable row level security;
create policy "Users see own reports" on public.reports using (auth.uid() = reporter_id);
create policy "Users can create reports" on public.reports for insert with check (auth.uid() = reporter_id);

-- NOTIFICATIONS
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications using (auth.uid() = user_id);
create policy "System can create notifications" on public.notifications for insert with check (true);

-- ─────────────────────────────────────────
-- 11. ENABLE REALTIME
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.private_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.profiles;
