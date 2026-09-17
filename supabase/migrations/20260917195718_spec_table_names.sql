-- Rename live tables to the spec names and add is_household_member.
-- Do not replace current_member_household_ids() with a different signature.

create function public.is_household_member(p_user_id uuid, p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where user_id = p_user_id
      and household_id = p_household_id
  );
$$;

revoke all on function public.is_household_member(uuid, uuid) from public, anon;
grant execute on function public.is_household_member(uuid, uuid) to authenticated;

alter table public.members rename to household_members;
alter table public.chores rename to tasks;

alter index if exists members_household_id_idx rename to household_members_household_id_idx;
alter index if exists members_user_id_idx rename to household_members_user_id_idx;
alter index if exists chores_household_id_idx rename to tasks_household_id_idx;

create or replace function public.is_household_member(p_user_id uuid, p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where user_id = p_user_id
      and household_id = p_household_id
  );
$$;

create or replace function public.current_member_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.household_members where user_id = auth.uid();
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
  from public.household_members m
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

  select m.id into already from public.household_members m where m.user_id = auth.uid();
  if already is not null then
    return already;
  end if;

  update public.household_members
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
      insert into public.household_members (household_id, name, user_id)
      values (hid, n, auth.uid())
      returning id into first_member;
    else
      insert into public.household_members (household_id, name)
      values (hid, n);
    end if;
  end loop;

  if first_member is null then
    raise exception 'Add at least two people';
  end if;

  return query select hid, code, first_member;
end;
$$;

drop policy if exists "Members can view their household" on public.households;
drop policy if exists "Authenticated users can create households" on public.households;
drop policy if exists "Members can update their household" on public.households;
drop policy if exists "Members can view household members" on public.household_members;
drop policy if exists "Authenticated users can add members when creating or joining" on public.household_members;
drop policy if exists "Members can claim an unclaimed seat" on public.household_members;
drop policy if exists "Members can view chores" on public.tasks;
drop policy if exists "Members can insert chores" on public.tasks;
drop policy if exists "Members can update chores" on public.tasks;
drop policy if exists "Members can delete chores" on public.tasks;

create policy "Members can view their household"
  on public.households for select to authenticated
  using (public.is_household_member(auth.uid(), id));

create policy "Authenticated users can create households"
  on public.households for insert to authenticated
  with check (true);

create policy "Members can update their household"
  on public.households for update to authenticated
  using (public.is_household_member(auth.uid(), id))
  with check (public.is_household_member(auth.uid(), id));

create policy "Members can view household members"
  on public.household_members for select to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can add household members"
  on public.household_members for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_household_member(auth.uid(), household_id)
  );

create policy "Members can update household members"
  on public.household_members for update to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can view tasks"
  on public.tasks for select to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can insert tasks"
  on public.tasks for insert to authenticated
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can update tasks"
  on public.tasks for update to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can delete tasks"
  on public.tasks for delete to authenticated
  using (public.is_household_member(auth.uid(), household_id));

revoke all on function public.current_member_household_ids() from public, anon, authenticated;
drop function public.current_member_household_ids();
