-- Run this in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_id text not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, youtube_id)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null unique references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  html text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists videos_user_sort_idx on public.videos(user_id, sort_order);
create index if not exists notes_user_idx on public.notes(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
before update on public.videos
for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

alter table public.videos enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Users can read their videos" on public.videos;
create policy "Users can read their videos"
on public.videos for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their videos" on public.videos;
create policy "Users can insert their videos"
on public.videos for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their videos" on public.videos;
create policy "Users can update their videos"
on public.videos for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their videos" on public.videos;
create policy "Users can delete their videos"
on public.videos for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their notes" on public.notes;
create policy "Users can read their notes"
on public.notes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their notes" on public.notes;
create policy "Users can insert their notes"
on public.notes for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.videos
    where videos.id = notes.video_id
    and videos.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their notes" on public.notes;
create policy "Users can update their notes"
on public.notes for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.videos
    where videos.id = notes.video_id
    and videos.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their notes" on public.notes;
create policy "Users can delete their notes"
on public.notes for delete
to authenticated
using (auth.uid() = user_id);
