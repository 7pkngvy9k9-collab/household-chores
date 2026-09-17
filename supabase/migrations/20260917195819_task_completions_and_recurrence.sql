-- Task completion history, richer recurrence, complete_task RPC, realtime.

alter table public.tasks
  add column if not exists description text,
  add column if not exists priority text not null default 'normal',
  add column if not exists points integer not null default 0,
  add column if not exists repeat_interval integer not null default 1;

alter table public.tasks
  drop constraint if exists chores_repeat_check;

alter table public.tasks
  drop constraint if exists tasks_repeat_check;

alter table public.tasks
  add constraint tasks_repeat_check
  check (repeat in ('none', 'daily', 'weekly', 'monthly'));

alter table public.tasks
  drop constraint if exists tasks_priority_check;

alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('low', 'normal', 'high'));

alter table public.tasks
  drop constraint if exists tasks_repeat_interval_check;

alter table public.tasks
  add constraint tasks_repeat_interval_check
  check (repeat_interval >= 1);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  completed_at timestamptz not null default now(),
  points_earned integer not null default 0
);

create index if not exists task_completions_task_id_idx on public.task_completions(task_id);

alter table public.task_completions enable row level security;

create policy "Members can view task completions"
  on public.task_completions for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.is_household_member(auth.uid(), t.household_id)
    )
  );

create policy "Members can insert task completions"
  on public.task_completions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.is_household_member(auth.uid(), t.household_id)
    )
  );

grant select, insert on public.task_completions to authenticated;

create or replace function public.complete_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tasks;
  mid uuid;
  next_due date;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into t from public.tasks where id = p_task_id;
  if t.id is null then
    raise exception 'Task not found';
  end if;
  if not public.is_household_member(auth.uid(), t.household_id) then
    raise exception 'Not a household member';
  end if;

  select id into mid
  from public.household_members
  where household_id = t.household_id and user_id = auth.uid();

  insert into public.task_completions (task_id, user_id, points_earned)
  values (t.id, auth.uid(), t.points);

  if t.kind = 'repeating' then
    if t.repeat = 'daily' then
      next_due := (current_date + (t.repeat_interval || ' days')::interval)::date;
    elsif t.repeat = 'weekly' then
      next_due := (current_date + (t.repeat_interval * 7 || ' days')::interval)::date;
    elsif t.repeat = 'monthly' then
      next_due := (current_date + (t.repeat_interval || ' months')::interval)::date;
    else
      next_due := t.due_date;
    end if;

    update public.tasks
    set
      done = false,
      holder_index = case when t.rotate then t.holder_index + 1 else t.holder_index end,
      due_date = next_due,
      last_done_at = now(),
      last_done_by = mid,
      updated_at = now()
    where id = t.id
    returning * into t;
  else
    update public.tasks
    set
      done = true,
      last_done_at = now(),
      last_done_by = mid,
      updated_at = now()
    where id = t.id
    returning * into t;
  end if;

  return t;
end;
$$;

revoke all on function public.complete_task(uuid) from public, anon;
grant execute on function public.complete_task(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    execute 'alter publication supabase_realtime add table public.tasks';
  end if;
end;
$$;
