-- Expenses, splits, settlements, balances, and shopping conversion.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  paid_by uuid not null references public.household_members(id),
  expense_date date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.household_members(id),
  amount numeric(12, 2) not null,
  percentage numeric(6, 3),
  share numeric,
  unique (expense_id, user_id)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  from_user uuid not null references public.household_members(id),
  to_user uuid not null references public.household_members(id),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'open' check (status in ('open', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists expenses_household_id_idx on public.expenses(household_id);
create index if not exists expense_splits_expense_id_idx on public.expense_splits(expense_id);
create index if not exists settlements_household_id_idx on public.settlements(household_id);

alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

create policy "Members can view expenses"
  on public.expenses for select to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can insert expenses"
  on public.expenses for insert to authenticated
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can update expenses"
  on public.expenses for update to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can delete expenses"
  on public.expenses for delete to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can view expense splits"
  on public.expense_splits for select to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and public.is_household_member(auth.uid(), e.household_id)
    )
  );

create policy "Members can insert expense splits"
  on public.expense_splits for insert to authenticated
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and public.is_household_member(auth.uid(), e.household_id)
    )
  );

create policy "Members can delete expense splits"
  on public.expense_splits for delete to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and public.is_household_member(auth.uid(), e.household_id)
    )
  );

create policy "Members can view settlements"
  on public.settlements for select to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can insert settlements"
  on public.settlements for insert to authenticated
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can update settlements"
  on public.settlements for update to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, delete on public.expense_splits to authenticated;
grant select, insert, update on public.settlements to authenticated;

create or replace function public.create_expense(
  p_household_id uuid,
  p_title text,
  p_amount numeric,
  p_paid_by uuid,
  p_participant_ids uuid[],
  p_expense_date date default current_date,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  eid uuid;
  participant uuid;
  share numeric;
  currency text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_household_member(auth.uid(), p_household_id) then
    raise exception 'Not a household member';
  end if;
  if p_participant_ids is null or cardinality(p_participant_ids) < 1 then
    raise exception 'Choose at least one person to split with';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select h.currency into currency from public.households h where h.id = p_household_id;

  insert into public.expenses (
    household_id, title, description, amount, currency, paid_by, expense_date, created_by
  )
  values (
    p_household_id,
    trim(p_title),
    p_description,
    p_amount,
    coalesce(currency, 'EUR'),
    p_paid_by,
    coalesce(p_expense_date, current_date),
    auth.uid()
  )
  returning id into eid;

  share := round((p_amount / cardinality(p_participant_ids))::numeric, 2);

  foreach participant in array p_participant_ids loop
    insert into public.expense_splits (expense_id, user_id, amount, share)
    values (eid, participant, share, 1);
  end loop;

  return eid;
end;
$$;

create or replace function public.calculate_balances(p_household_id uuid)
returns table (
  member_id uuid,
  member_name text,
  balance numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    round((
      coalesce((
        select sum(e.amount) from public.expenses e
        where e.household_id = p_household_id and e.paid_by = m.id
      ), 0)
      - coalesce((
        select sum(s.amount)
        from public.expense_splits s
        join public.expenses e on e.id = s.expense_id
        where e.household_id = p_household_id and s.user_id = m.id
      ), 0)
      + coalesce((
        select sum(st.amount) from public.settlements st
        where st.household_id = p_household_id
          and st.from_user = m.id
          and st.status = 'confirmed'
      ), 0)
      - coalesce((
        select sum(st.amount) from public.settlements st
        where st.household_id = p_household_id
          and st.to_user = m.id
          and st.status = 'confirmed'
      ), 0)
    )::numeric, 2) as balance
  from public.household_members m
  where m.household_id = p_household_id
    and public.is_household_member(auth.uid(), p_household_id)
  order by m.created_at;
$$;

create or replace function public.convert_shopping_to_expense(
  p_list_id uuid,
  p_title text,
  p_amount numeric,
  p_paid_by uuid,
  p_participant_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into hid from public.shopping_lists where id = p_list_id;
  if hid is null then
    raise exception 'Shopping list not found';
  end if;

  return public.create_expense(
    hid,
    coalesce(nullif(trim(p_title), ''), 'Shopping'),
    p_amount,
    p_paid_by,
    p_participant_ids,
    current_date,
    'Converted from shopping list'
  );
end;
$$;

revoke all on function public.create_expense(uuid, text, numeric, uuid, uuid[], date, text) from public, anon;
revoke all on function public.calculate_balances(uuid) from public, anon;
revoke all on function public.convert_shopping_to_expense(uuid, text, numeric, uuid, uuid[]) from public, anon;

grant execute on function public.create_expense(uuid, text, numeric, uuid, uuid[], date, text) to authenticated;
grant execute on function public.calculate_balances(uuid) to authenticated;
grant execute on function public.convert_shopping_to_expense(uuid, text, numeric, uuid, uuid[]) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses'
  ) then
    execute 'alter publication supabase_realtime add table public.expenses';
  end if;
end;
$$;
