-- Phase 2 household modules: posts, events, absences, invitations,
-- polls, notifications, budgets, receipts. Seat-claim join stays;
-- invite lookup also accepts expiring invitation codes.

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique,
  created_by uuid references public.household_members(id) on delete set null,
  expires_at timestamptz,
  uses integer not null default 0,
  max_uses integer,
  created_at timestamptz not null default now(),
  constraint household_invitations_uses_check check (uses >= 0),
  constraint household_invitations_max_uses_check check (max_uses is null or max_uses >= 1)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  author_id uuid not null references public.household_members(id) on delete cascade,
  title text not null,
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.household_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  event_date date not null,
  notes text,
  created_by uuid references public.household_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid not null references public.household_members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint absences_dates_check check (end_date >= start_date)
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  question text not null,
  created_by uuid references public.household_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  member_id uuid not null references public.household_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, member_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid not null references public.household_members(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month date not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  unique (household_id, month)
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  amount numeric not null,
  paid_by uuid references public.household_members(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists household_invitations_household_id_idx on public.household_invitations(household_id);
create index if not exists posts_household_id_idx on public.posts(household_id);
create index if not exists household_events_household_id_idx on public.household_events(household_id);
create index if not exists absences_household_id_idx on public.absences(household_id);
create index if not exists polls_household_id_idx on public.polls(household_id);
create index if not exists notifications_member_id_idx on public.notifications(member_id);
create index if not exists budgets_household_id_idx on public.budgets(household_id);
create index if not exists receipts_household_id_idx on public.receipts(household_id);

alter table public.household_invitations enable row level security;
alter table public.posts enable row level security;
alter table public.household_events enable row level security;
alter table public.absences enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.notifications enable row level security;
alter table public.budgets enable row level security;
alter table public.receipts enable row level security;

create policy "Members manage invitations"
  on public.household_invitations for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage posts"
  on public.posts for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage events"
  on public.household_events for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage absences"
  on public.absences for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage polls"
  on public.polls for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage poll options"
  on public.poll_options for all to authenticated
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_household_member(auth.uid(), p.household_id)
    )
  )
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_household_member(auth.uid(), p.household_id)
    )
  );

create policy "Members manage poll votes"
  on public.poll_votes for all to authenticated
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_household_member(auth.uid(), p.household_id)
    )
  )
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_household_member(auth.uid(), p.household_id)
    )
  );

create policy "Members view own notifications"
  on public.notifications for select to authenticated
  using (
    public.is_household_member(auth.uid(), household_id)
    and member_id in (select id from public.household_members where user_id = auth.uid())
  );

create policy "Members update own notifications"
  on public.notifications for update to authenticated
  using (
    member_id in (select id from public.household_members where user_id = auth.uid())
  )
  with check (
    member_id in (select id from public.household_members where user_id = auth.uid())
  );

create policy "Members insert notifications"
  on public.notifications for insert to authenticated
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage budgets"
  on public.budgets for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members manage receipts"
  on public.receipts for all to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

grant select, insert, update, delete on public.household_invitations, public.posts, public.household_events, public.absences, public.polls, public.poll_options, public.poll_votes, public.budgets, public.receipts to authenticated;
grant select, insert, update on public.notifications to authenticated;

create or replace function public.household_id_from_invite_code(p_code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hid from (
    select h.id as hid
    from public.households h
    where lower(h.invite_code) = lower(trim(p_code))
    union all
    select i.household_id as hid
    from public.household_invitations i
    where lower(i.code) = lower(trim(p_code))
      and (i.expires_at is null or i.expires_at > now())
      and (i.max_uses is null or i.uses < i.max_uses)
  ) codes
  limit 1;
$$;

create or replace function public.lookup_household_by_invite(p_code text)
returns table (id uuid, name text, invite_code text)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.name, h.invite_code
  from public.households h
  where h.id = public.household_id_from_invite_code(p_code)
  limit 1;
$$;

create or replace function public.list_members_by_invite(p_code text)
returns table (id uuid, name text, claimed boolean)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.name, (m.user_id is not null) as claimed
  from public.household_members m
  where m.household_id = public.household_id_from_invite_code(p_code)
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

  hid := public.household_id_from_invite_code(p_code);
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

  update public.household_invitations
  set uses = uses + 1
  where household_id = hid
    and lower(code) = lower(trim(p_code));

  return p_member_id;
end;
$$;

create or replace function public.create_household_invitation(p_household_id uuid, p_days integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
  mid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_household_member(auth.uid(), p_household_id) then
    raise exception 'Not a household member';
  end if;

  select id into mid from public.household_members
  where household_id = p_household_id and user_id = auth.uid();

  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.household_invitations (household_id, code, created_by, expires_at, max_uses)
  values (
    p_household_id,
    code,
    mid,
    case when p_days is null or p_days < 1 then now() + interval '7 days' else now() + (p_days || ' days')::interval end,
    20
  );
  return code;
end;
$$;

revoke all on function public.household_id_from_invite_code(text) from public, anon;
grant execute on function public.household_id_from_invite_code(text) to authenticated;
revoke all on function public.create_household_invitation(uuid, integer) from public, anon;
grant execute on function public.create_household_invitation(uuid, integer) to authenticated;

create or replace function public.notify_household(p_household_id uuid, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_household_member(auth.uid(), p_household_id) then
    raise exception 'Not a household member';
  end if;
  insert into public.notifications (household_id, member_id, title, body)
  select p_household_id, m.id, p_title, p_body
  from public.household_members m
  where m.household_id = p_household_id and m.user_id is not null;
end;
$$;

revoke all on function public.notify_household(uuid, text, text) from public, anon;
grant execute on function public.notify_household(uuid, text, text) to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['posts', 'household_events', 'absences', 'polls', 'poll_options', 'poll_votes', 'notifications']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
