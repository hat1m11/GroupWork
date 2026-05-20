-- ============================================================
-- Blocked status: extend tasks.status check constraint
-- ============================================================
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'done', 'blocked'));

-- ============================================================
-- Labels / tags on tasks
-- ============================================================
alter table public.tasks
  add column if not exists tags text[] not null default '{}';

create index if not exists tasks_tags_idx on public.tasks using gin(tags);

-- ============================================================
-- Emoji reactions on messages
-- ============================================================
create table public.reactions (
  id         uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  emoji      text not null check (length(emoji) <= 10),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

alter table public.reactions enable row level security;

create policy "Group members can view reactions"
  on public.reactions for select
  using (
    exists (
      select 1 from public.messages m
      join public.group_members gm on gm.group_id = m.group_id
      where m.id = reactions.message_id and gm.user_id = auth.uid()
    )
  );

create policy "Group members can add reactions"
  on public.reactions for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.messages m
      join public.group_members gm on gm.group_id = m.group_id
      where m.id = reactions.message_id and gm.user_id = auth.uid()
    )
  );

create policy "Users can delete own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

create index on public.reactions (message_id);

-- ============================================================
-- Pinned messages + threaded replies
-- ============================================================
alter table public.messages
  add column if not exists pinned boolean not null default false;

alter table public.messages
  add column if not exists parent_id uuid references public.messages(id) on delete cascade;

create index on public.messages (parent_id) where parent_id is not null;
create index on public.messages (group_id, pinned) where pinned = true;

-- Enable realtime for reactions too
alter publication supabase_realtime add table public.reactions;

-- ============================================================
-- Group notes (shared wiki per group)
-- ============================================================
create table public.group_notes (
  group_id   uuid primary key references public.groups(id) on delete cascade,
  content    text not null default '',
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.group_notes enable row level security;

create policy "Group members can view notes"
  on public.group_notes for select
  using (public.is_group_member(group_id));

create policy "Group members can insert notes"
  on public.group_notes for insert
  with check (public.is_group_member(group_id));

create policy "Group members can update notes"
  on public.group_notes for update
  using (public.is_group_member(group_id));
