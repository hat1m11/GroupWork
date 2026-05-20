-- Priority field on tasks
alter table public.tasks
  add column priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent'));

create index on public.tasks (priority);
create index on public.tasks (assigned_to);
create index on public.tasks (group_id, due_date);

-- ============================================================
-- SUBTASKS
-- ============================================================
create table public.subtasks (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  title      text not null,
  completed  boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.subtasks enable row level security;

create policy "Group members can view subtasks" on public.subtasks for select
  using (exists (
    select 1 from public.tasks t
    join public.group_members gm on gm.group_id = t.group_id
    where t.id = subtasks.task_id and gm.user_id = auth.uid()
  ));

create policy "Group members can insert subtasks" on public.subtasks for insert
  with check (exists (
    select 1 from public.tasks t
    join public.group_members gm on gm.group_id = t.group_id
    where t.id = subtasks.task_id and gm.user_id = auth.uid()
  ));

create policy "Group members can update subtasks" on public.subtasks for update
  using (exists (
    select 1 from public.tasks t
    join public.group_members gm on gm.group_id = t.group_id
    where t.id = subtasks.task_id and gm.user_id = auth.uid()
  ));

create policy "Group members can delete subtasks" on public.subtasks for delete
  using (exists (
    select 1 from public.tasks t
    join public.group_members gm on gm.group_id = t.group_id
    where t.id = subtasks.task_id and gm.user_id = auth.uid()
  ));

create index on public.subtasks (task_id);

-- ============================================================
-- MESSAGES (group chat)
-- ============================================================
create table public.messages (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null check (length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

create policy "Group members can view messages" on public.messages for select
  using (public.is_group_member(group_id));

create policy "Group members can send messages" on public.messages for insert
  with check (auth.uid() = user_id and public.is_group_member(group_id));

create index on public.messages (group_id, created_at desc);
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  group_id   uuid references public.groups(id) on delete cascade,
  type       text not null check (type in ('task_assigned', 'task_overdue', 'mention', 'member_joined')),
  message    text not null,
  read       boolean not null default false,
  link       text,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications read" on public.notifications for update
  using (auth.uid() = user_id);

create index on public.notifications (user_id, read, created_at desc);
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- TRIGGER: notify on task assignment
-- ============================================================
create or replace function public.notify_task_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_to is not null and (
    tg_op = 'INSERT' or old.assigned_to is distinct from new.assigned_to
  ) then
    insert into public.notifications (user_id, group_id, type, message, link)
    values (
      new.assigned_to,
      new.group_id,
      'task_assigned',
      'You were assigned: "' || new.title || '"',
      '/groups/' || new.group_id::text
    );
  end if;
  return new;
end;
$$;

create trigger tasks_notify_assigned
  after insert or update of assigned_to on public.tasks
  for each row execute procedure public.notify_task_assigned();

-- ============================================================
-- TRIGGER: notify owner when member joins
-- ============================================================
create or replace function public.notify_member_joined()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_group_name text;
  v_owner uuid;
begin
  select full_name into v_name from public.users where id = new.user_id;
  select name, created_by into v_group_name, v_owner from public.groups where id = new.group_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, group_id, type, message, link)
    values (
      v_owner,
      new.group_id,
      'member_joined',
      coalesce(v_name, 'Someone') || ' joined "' || v_group_name || '"',
      '/groups/' || new.group_id::text
    );
  end if;
  return new;
end;
$$;

create trigger group_members_notify_joined
  after insert on public.group_members
  for each row execute procedure public.notify_member_joined();
