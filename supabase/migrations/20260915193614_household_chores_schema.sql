-- Household chores schema
create extension if not exists pgcrypto;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('repeating', 'dated', 'on_demand')),
  repeat text not null default 'none' check (repeat in ('none', 'daily', 'weekly')),
  due_date date,
  rotate boolean not null default false,
  holder_ids uuid[] not null default '{}',
  holder_index integer not null default 0,
  done boolean not null default false,
  last_done_at timestamptz,
  last_done_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_household_id_idx on public.members(household_id);
create index members_user_id_idx on public.members(user_id);
create index chores_household_id_idx on public.chores(household_id);
create index households_invite_code_idx on public.households(invite_code);

create or replace function public.current_member_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.members where user_id = auth.uid();
$$;

revoke all on function public.current_member_household_ids() from public;
grant execute on function public.current_member_household_ids() to authenticated;

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.chores enable row level security;

create policy "Members can view their household"
  on public.households for select to authenticated
  using (id in (select public.current_member_household_ids()));

create policy "Authenticated users can create households"
  on public.households for insert to authenticated
  with check (true);

create policy "Members can update their household"
  on public.households for update to authenticated
  using (id in (select public.current_member_household_ids()));

create policy "Members can view household members"
  on public.members for select to authenticated
  using (household_id in (select public.current_member_household_ids()));

create policy "Authenticated users can add members when creating or joining"
  on public.members for insert to authenticated
  with check (
    user_id = auth.uid()
    or household_id in (select public.current_member_household_ids())
  );

create policy "Members can claim an unclaimed seat"
  on public.members for update to authenticated
  using (
    household_id in (select public.current_member_household_ids())
    or user_id is null
  )
  with check (
    user_id = auth.uid()
    or user_id is null
    or household_id in (select public.current_member_household_ids())
  );

create policy "Members can view chores"
  on public.chores for select to authenticated
  using (household_id in (select public.current_member_household_ids()));

create policy "Members can insert chores"
  on public.chores for insert to authenticated
  with check (household_id in (select public.current_member_household_ids()));

create policy "Members can update chores"
  on public.chores for update to authenticated
  using (household_id in (select public.current_member_household_ids()))
  with check (household_id in (select public.current_member_household_ids()));

create policy "Members can delete chores"
  on public.chores for delete to authenticated
  using (household_id in (select public.current_member_household_ids()));

-- Join helpers: look up household by invite code before membership exists
create or replace function public.lookup_household_by_invite(p_code text)
returns table (
  id uuid,
  name text,
  invite_code text
)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.name, h.invite_code
  from public.households h
  where lower(h.invite_code) = lower(trim(p_code))
  limit 1;
$$;

create or replace function public.list_members_by_invite(p_code text)
returns table (
  id uuid,
  name text,
  claimed boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.name, (m.user_id is not null) as claimed
  from public.members m
  join public.households h on h.id = m.household_id
  where lower(h.invite_code) = lower(trim(p_code))
  order by m.created_at;
$$;

create or replace function public.join_household(p_code text, p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  already uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select h.id into hid
  from public.households h
  where lower(h.invite_code) = lower(trim(p_code));

  if hid is null then
    raise exception 'Invalid invite code';
  end if;

  select m.id into already from public.members m where m.user_id = auth.uid();
  if already is not null then
    return already;
  end if;

  update public.members
  set user_id = auth.uid()
  where id = p_member_id
    and household_id = hid
    and user_id is null;

  if not found then
    raise exception 'Member seat unavailable';
  end if;

  return p_member_id;
end;
$$;

create or replace function public.create_household(
  p_name text,
  p_member_names text[]
)
returns table (
  household_id uuid,
  invite_code text,
  member_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  code text;
  first_member uuid;
  n text;
  i int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_member_names is null or cardinality(p_member_names) < 2 then
    raise exception 'Add at least two people';
  end if;

  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.households (name, invite_code)
  values (trim(p_name), code)
  returning id into hid;

  foreach n in array p_member_names loop
    n := trim(n);
    if n = '' then
      continue;
    end if;
    i := i + 1;
    if i = 1 then
      insert into public.members (household_id, name, user_id)
      values (hid, n, auth.uid())
      returning id into first_member;
    else
      insert into public.members (household_id, name)
      values (hid, n);
    end if;
  end loop;

  if first_member is null then
    raise exception 'Add at least two people';
  end if;

  return query select hid, code, first_member;
end;
$$;

revoke all on function public.lookup_household_by_invite(text) from public;
revoke all on function public.list_members_by_invite(text) from public;
revoke all on function public.join_household(text, uuid) from public;
revoke all on function public.create_household(text, text[]) from public;

grant execute on function public.lookup_household_by_invite(text) to authenticated;
grant execute on function public.list_members_by_invite(text) to authenticated;
grant execute on function public.join_household(text, uuid) to authenticated;
grant execute on function public.create_household(text, text[]) to authenticated;
