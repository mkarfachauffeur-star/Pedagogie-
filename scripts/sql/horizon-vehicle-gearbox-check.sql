select v.plate, v.brand, v.model, v.details->>'gearbox' as gearbox
from public.vehicles v
join public.profiles p on p.organization_id = v.organization_id
where p.email = 'horizon.gerant@demo.pedagogia.local'
order by v.created_at;
