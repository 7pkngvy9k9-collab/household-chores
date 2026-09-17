-- Roles, household settings, and membership RPCs.

alter table public.households
  add column if not exists currency text not null default 'EUR',
  add column if not exists timezone text not null default 'Europe/Berlin';

alter table public.household_members
  add column if not exists role text not null default 'member';

alter table public.household_members
  drop constraint if exists household_members_role_check;

alter table public.household_members
  add constraint household_members_role_check
  check (role in ('owner', 'admin', 'member'));

update public.household_members m
set role = 'owner'
where m.id in (
  select distinct on (household_id) id
  from public.household_members
  where user_id is not null
  order by household_id, created_at
);

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
      insert into public.household_members (household_id, name, user_id, role)
      values (hid, n, auth.uid(), 'owner')
      returning id into first_member;
    else
      insert into public.household_members (household_id, name, role)
      values (hid, n, 'member');
    end if;
  end loop;

  if first_member is null then
    raise exception 'Add at least two people';
  end if;

  return query select hid, code, first_member;
end;
$$;

create or replace function public.add_household_member(p_household_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_household_member(auth.uid(), p_household_id) then
    raise exception 'Not a household member';
  end if;
  if trim(p_name) = '' then
    raise exception 'Name is required';
  end if;

  insert into public.household_members (household_id, name, role)
  values (p_household_id, trim(p_name), 'member')
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.leave_household()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  mid uuid;
  my_role text;
  remaining_owners int;
  successor uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, household_id, role into mid, hid, my_role
  from public.household_members
  where user_id = auth.uid();

  if mid is null then
    raise exception 'You are not in a household';
  end if;

  if my_role = 'owner' then
    select count(*) into remaining_owners
    from public.household_members
    where household_id = hid and role = 'owner' and id <> mid;

    if remaining_owners = 0 then
      select id into successor
      from public.household_members
      where household_id = hid and user_id is not null and id <> mid
      order by created_at
      limit 1;

      if successor is not null then
        update public.household_members set role = 'owner' where id = successor;
      end if;
    end if;
  end if;

  update public.household_members
  set user_id = null, role = 'member'
  where id = mid;
end;
$$;

create or replace function public.remove_household_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  caller_role text;
  target_role text;
  owner_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select household_id, role into hid, target_role
  from public.household_members
  where id = p_member_id;

  if hid is null then
    raise exception 'Member not found';
  end if;

  select role into caller_role
  from public.household_members
  where household_id = hid and user_id = auth.uid();

  if caller_role is null or caller_role not in ('owner', 'admin') then
    raise exception 'You cannot remove members';
  end if;

  if p_member_id = (
    select id from public.household_members where household_id = hid and user_id = auth.uid()
  ) then
    raise exception 'Use leave household instead';
  end if;

  if target_role = 'owner' and caller_role <> 'owner' then
    raise exception 'Only an owner can remove another owner';
  end if;

  select count(*) into owner_count
  from public.household_members
  where household_id = hid and role = 'owner';

  if target_role = 'owner' and owner_count <= 1 then
    raise exception 'The household needs at least one owner';
  end if;

  delete from public.household_members where id = p_member_id;
end;
$$;

create or replace function public.change_member_role(p_member_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  caller_role text;
  owner_count int;
  target_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_role not in ('owner', 'admin', 'member') then
    raise exception 'Invalid role';
  end if;

  select household_id, role into hid, target_role
  from public.household_members
  where id = p_member_id;

  if hid is null then
    raise exception 'Member not found';
  end if;

  select role into caller_role
  from public.household_members
  where household_id = hid and user_id = auth.uid();

  if caller_role is distinct from 'owner' then
    raise exception 'Only an owner can change roles';
  end if;

  if target_role = 'owner' and p_role <> 'owner' then
    select count(*) into owner_count
    from public.household_members
    where household_id = hid and role = 'owner';
    if owner_count <= 1 then
      raise exception 'The household needs at least one owner';
    end if;
  end if;

  update public.household_members set role = p_role where id = p_member_id;
end;
$$;

revoke all on function public.add_household_member(uuid, text) from public, anon;
revoke all on function public.leave_household() from public, anon;
revoke all on function public.remove_household_member(uuid) from public, anon;
revoke all on function public.change_member_role(uuid, text) from public, anon;

grant execute on function public.add_household_member(uuid, text) to authenticated;
grant execute on function public.leave_household() to authenticated;
grant execute on function public.remove_household_member(uuid) to authenticated;
grant execute on function public.change_member_role(uuid, text) to authenticated;
