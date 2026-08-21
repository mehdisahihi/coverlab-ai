create index if not exists project_versions_user_idx
  on public.project_versions (user_id);

create index if not exists project_versions_source_version_idx
  on public.project_versions (source_version_id);

create index if not exists policy_acknowledgements_user_idx
  on public.policy_acknowledgements (user_id);
