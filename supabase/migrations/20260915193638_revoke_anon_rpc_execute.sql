revoke execute on function public.create_household(text, text[]) from anon, public;
revoke execute on function public.join_household(text, uuid) from anon, public;
revoke execute on function public.list_members_by_invite(text) from anon, public;
revoke execute on function public.lookup_household_by_invite(text) from anon, public;
revoke execute on function public.current_member_household_ids() from anon, public;

grant execute on function public.create_household(text, text[]) to authenticated;
grant execute on function public.join_household(text, uuid) to authenticated;
grant execute on function public.list_members_by_invite(text) to authenticated;
grant execute on function public.lookup_household_by_invite(text) to authenticated;
grant execute on function public.current_member_household_ids() to authenticated;
