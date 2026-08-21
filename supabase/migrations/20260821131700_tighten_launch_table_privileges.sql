revoke all privileges on table public.projects from authenticated;
revoke all privileges on table public.project_versions from authenticated;
revoke all privileges on table public.policy_acknowledgements from authenticated;

grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert on table public.project_versions to authenticated;
grant select, insert on table public.policy_acknowledgements to authenticated;
