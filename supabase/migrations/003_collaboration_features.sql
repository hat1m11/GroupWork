-- ============================================================
-- FEATURE 6: last_active_at on group_members
-- ============================================================
alter table public.group_members
  add column last_active_at timestamptz;

create index on public.group_members (group_id, last_active_at desc nulls last);

-- ============================================================
-- FEATURE 1: Shared Resources
-- ============================================================
create table public.resources (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  task_id     uuid references public.tasks(id) on delete set null,
  title       text not null check (length(title) between 1 and 200),
  url         text not null check (length(url) between 1 and 2000),
  category    text not null default 'link'
                check (category in ('doc','sheet','slide','pdf','link')),
  description text,
  created_by  uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "Group members can view resources"
  on public.resources for select
  using (public.is_group_member(group_id));

create policy "Group members can add resources"
  on public.resources for insert
  with check (auth.uid() = created_by and public.is_group_member(group_id));

create policy "Creator or owner can delete resources"
  on public.resources for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.group_members
      where group_members.group_id = resources.group_id
        and group_members.user_id = auth.uid()
        and group_members.role = 'owner'
    )
  );

create index on public.resources (group_id, created_at desc);
create index on public.resources (task_id) where task_id is not null;

-- ============================================================
-- FEATURE 2: Meeting Scheduling
-- ============================================================
create table public.meetings (
  id               uuid primary key default uuid_generate_v4(),
  group_id         uuid not null references public.groups(id) on delete cascade,
  title            text not null check (length(title) between 1 and 200),
  scheduled_at     timestamptz not null,
  duration_minutes int not null default 60
                     check (duration_minutes > 0 and duration_minutes <= 1440),
  call_link        text check (call_link is null or length(call_link) <= 2000),
  platform         text check (platform is null or platform in ('zoom','meet','teams','other')),
  created_by       uuid not null references public.users(id) on delete cascade,
  created_at       timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "Group members can view meetings"
  on public.meetings for select
  using (public.is_group_member(group_id));

create policy "Group members can create meetings"
  on public.meetings for insert
  with check (auth.uid() = created_by and public.is_group_member(group_id));

create policy "Creator or owner can delete meetings"
  on public.meetings for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.group_members
      where group_members.group_id = meetings.group_id
        and group_members.user_id = auth.uid()
        and group_members.role = 'owner'
    )
  );

create index on public.meetings (group_id, scheduled_at asc);
