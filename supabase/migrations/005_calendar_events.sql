-- Calendar events: group-level entries (meeting, deadline, custom)
create table if not exists calendar_events (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  created_by  uuid not null references users(id),
  type        text not null check (type in ('meeting', 'deadline', 'custom')),
  title       text not null check (char_length(title) between 1 and 25),
  date        date not null,
  created_at  timestamptz default now()
);

alter table calendar_events enable row level security;

create policy "members can view calendar events"
  on calendar_events for select
  using (is_group_member(group_id));

create policy "members can insert calendar events"
  on calendar_events for insert
  with check (is_group_member(group_id) and auth.uid() = created_by);

create policy "creator can delete calendar events"
  on calendar_events for delete
  using (auth.uid() = created_by);
