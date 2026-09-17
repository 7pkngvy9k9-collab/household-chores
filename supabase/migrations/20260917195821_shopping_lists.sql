-- Shared shopping lists with realtime.

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  category text,
  note text,
  image_url text,
  created_by uuid references auth.users(id) on delete set null,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopping_lists_household_id_idx on public.shopping_lists(household_id);
create index if not exists shopping_items_list_id_idx on public.shopping_items(shopping_list_id);

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;

create policy "Members can view shopping lists"
  on public.shopping_lists for select to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can insert shopping lists"
  on public.shopping_lists for insert to authenticated
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can update shopping lists"
  on public.shopping_lists for update to authenticated
  using (public.is_household_member(auth.uid(), household_id))
  with check (public.is_household_member(auth.uid(), household_id));

create policy "Members can delete shopping lists"
  on public.shopping_lists for delete to authenticated
  using (public.is_household_member(auth.uid(), household_id));

create policy "Members can view shopping items"
  on public.shopping_items for select to authenticated
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
        and public.is_household_member(auth.uid(), sl.household_id)
    )
  );

create policy "Members can insert shopping items"
  on public.shopping_items for insert to authenticated
  with check (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
        and public.is_household_member(auth.uid(), sl.household_id)
    )
  );

create policy "Members can update shopping items"
  on public.shopping_items for update to authenticated
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
        and public.is_household_member(auth.uid(), sl.household_id)
    )
  )
  with check (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
        and public.is_household_member(auth.uid(), sl.household_id)
    )
  );

create policy "Members can delete shopping items"
  on public.shopping_items for delete to authenticated
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
        and public.is_household_member(auth.uid(), sl.household_id)
    )
  );

grant select, insert, update, delete on public.shopping_lists to authenticated;
grant select, insert, update, delete on public.shopping_items to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shopping_items'
  ) then
    execute 'alter publication supabase_realtime add table public.shopping_items';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shopping_lists'
  ) then
    execute 'alter publication supabase_realtime add table public.shopping_lists';
  end if;
end;
$$;
