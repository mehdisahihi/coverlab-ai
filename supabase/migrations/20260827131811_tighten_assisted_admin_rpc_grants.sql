revoke execute
on function public.is_coverlab_assisted_admin()
from public, anon;

revoke execute
on function public.admin_list_assisted_production_requests()
from public, anon;

revoke execute
on function public.admin_update_assisted_production_request_status(uuid, text)
from public, anon;

grant execute
on function public.is_coverlab_assisted_admin()
to authenticated, service_role;

grant execute
on function public.admin_list_assisted_production_requests()
to authenticated, service_role;

grant execute
on function public.admin_update_assisted_production_request_status(uuid, text)
to authenticated, service_role;
