-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (mirrors auth.users with extra profile data)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Auto-insert profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- GROUPS
-- ============================================================
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  course_code text not null,
  assignment_name text not null,
  due_date date,
  invite_code text not null unique default upper(substring(md5(random()::text), 1, 8)),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "Group members can view group"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Group creator can update group"
  on public.groups for update
  using (auth.uid() = created_by);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
create table public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Members can view group_members of their groups"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Users can insert themselves as member"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Group owner can remove members"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    )
  );

-- ============================================================
-- RUBRIC SECTIONS
-- ============================================================
create table public.rubric_sections (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  weight_pct numeric not null check (weight_pct > 0 and weight_pct <= 100),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rubric_sections enable row level security;

create policy "Group members can view rubric_sections"
  on public.rubric_sections for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = rubric_sections.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can insert rubric_sections"
  on public.rubric_sections for insert
  with check (
    exists (
      select 1 from public.group_members
      where group_members.group_id = rubric_sections.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can update rubric_sections"
  on public.rubric_sections for update
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = rubric_sections.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can delete rubric_sections"
  on public.rubric_sections for delete
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = rubric_sections.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  rubric_section_id uuid references public.rubric_sections(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Group members can view tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = tasks.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can insert tasks"
  on public.tasks for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.group_members
      where group_members.group_id = tasks.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = tasks.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = tasks.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- CONTRIBUTION LOGS (append-only)
-- ============================================================
create table public.contribution_logs (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action_type text not null,
  description text,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.contribution_logs enable row level security;

create policy "Group members can view contribution_logs"
  on public.contribution_logs for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = contribution_logs.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can insert contribution_logs"
  on public.contribution_logs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members
      where group_members.group_id = contribution_logs.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- No update/delete on contribution_logs — append-only by design

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.group_members (group_id);
create index on public.group_members (user_id);
create index on public.tasks (group_id);
create index on public.tasks (rubric_section_id);
create index on public.contribution_logs (group_id, created_at desc);
create index on public.groups (invite_code);
