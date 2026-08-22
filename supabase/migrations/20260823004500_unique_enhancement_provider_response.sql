create unique index if not exists project_versions_enhancement_provider_response_unique
on public.project_versions (
  user_id,
  project_id,
  (metadata ->> 'providerResponseId')
)
where operation = 'enhancement'
  and image_path is not null
  and coalesce(metadata ->> 'providerResponseId', '') <> '';
