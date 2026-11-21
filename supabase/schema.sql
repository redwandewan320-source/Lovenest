-- Run in Supabase SQL Editor on a fresh project.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.published_sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  slug text not null unique,
  is_published boolean not null default true,
  published_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','moderator','user')),
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.published_sites(id) on delete cascade,
  event_type text not null check (event_type in ('page_view','qr_entry','button_click')),
  button_id text,
  created_at timestamptz not null default now(),
  check ((event_type='button_click' and button_id is not null) or
         (event_type<>'button_click' and button_id is null))
);

create table public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.published_sites(id) on delete cascade,
  session_hash text not null,
  session_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique(site_id,session_hash,session_date)
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  thumbnail text,
  content_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.published_sites(id) on delete set null,
  reason text not null,
  status text not null default 'pending' check(status in ('pending','reviewed','resolved')),
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index published_sites_slug_idx on public.published_sites(slug);
create index analytics_events_site_date_idx on public.analytics_events(site_id,created_at);

alter table public.projects enable row level security;
alter table public.published_sites enable row level security;
alter table public.user_roles enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.templates enable row level security;
alter table public.content_reports enable row level security;

-- Security-definer role helper avoids recursive RLS on user_roles.
create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(allowed_roles)
  );
$$;

revoke all on function public.has_admin_role(text[]) from public;
grant execute on function public.has_admin_role(text[]) to authenticated;

create policy "Project owners manage their projects"
on public.projects for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Anyone can read content of published projects"
on public.projects for select to anon, authenticated
using (exists (
  select 1 from public.published_sites s
  where s.project_id = projects.id and s.is_published = true
));

create policy "Public can read published site records"
on public.published_sites for select to anon, authenticated
using (is_published = true);

create policy "Owners publish own projects"
on public.published_sites for insert to authenticated
with check (exists (
  select 1 from public.projects p
  where p.id = project_id and p.user_id = auth.uid()
));

create policy "Owners update own published sites"
on public.published_sites for update to authenticated
using (exists (
  select 1 from public.projects p
  where p.id = project_id and p.user_id = auth.uid()
))
with check (exists (
  select 1 from public.projects p
  where p.id = project_id and p.user_id = auth.uid()
));

create policy "Owners delete own published sites"
on public.published_sites for delete to authenticated
using (exists (
  select 1 from public.projects p
  where p.id = project_id and p.user_id = auth.uid()
));

create policy "Users read own role"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Admins read analytics events"
on public.analytics_events for select to authenticated
using (exists (
  select 1 from public.published_sites s
  join public.projects p on p.id=s.project_id
  where s.id=analytics_events.site_id and p.user_id=auth.uid()
) or public.has_admin_role(array['super_admin','admin','moderator']));

create policy "Admins read analytics sessions"
on public.analytics_sessions for select to authenticated
using (exists (
  select 1 from public.published_sites s
  join public.projects p on p.id=s.project_id
  where s.id=analytics_sessions.site_id and p.user_id=auth.uid()
) or public.has_admin_role(array['super_admin','admin','moderator']));

create policy "Public read active templates"
on public.templates for select to anon, authenticated
using (is_active = true);

create policy "Admins manage templates"
on public.templates for all to authenticated
using (public.has_admin_role(array['super_admin','admin']))
with check (public.has_admin_role(array['super_admin','admin']));

create policy "Admins read reports"
on public.content_reports for select to authenticated
using (public.has_admin_role(array['super_admin','admin','moderator']));

create policy "Admins update reports"
on public.content_reports for update to authenticated
using (public.has_admin_role(array['super_admin','admin','moderator']))
with check (public.has_admin_role(array['super_admin','admin','moderator']));

-- No browser-side INSERT policy for analytics.
-- Only the Edge Function service role writes analytics events.
