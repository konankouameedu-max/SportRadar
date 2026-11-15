-- =====================================================================
-- SportRadar — schéma complet (état final consolidé des migrations
-- init_schema, rls_and_rpc, replace_definer_views, fix_laposte_siret,
-- delete_own_account, private_helpers_and_indexes appliquées en production)
-- =====================================================================

-- ============ Types ============
create type public.account_type as enum ('particulier', 'coach', 'entreprise');
create type public.user_role as enum ('user', 'admin');
create type public.activity_status as enum ('draft', 'published', 'archived');
create type public.booking_status as enum ('confirmed', 'cancelled');

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ============ Validation SIRET / SIREN (clé de Luhn) ============
create or replace function public.luhn_valid(digits text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare s int := 0; d int; i int; n int := length(digits);
begin
  if digits !~ '^[0-9]+$' then return false; end if;
  for i in 1..n loop
    d := substr(digits, n - i + 1, 1)::int;
    if i % 2 = 0 then d := d * 2; if d > 9 then d := d - 9; end if; end if;
    s := s + d;
  end loop;
  return s % 10 = 0;
end $$;

create or replace function public.siret_siren_valid(v text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare s int := 0; i int;
begin
  if v is null then return false; end if;
  if v ~ '^[0-9]{9}$' then return public.luhn_valid(v); end if;
  if v ~ '^[0-9]{14}$' then
    if left(v, 9) = '356000000' then -- établissements La Poste
      for i in 1..14 loop s := s + substr(v, i, 1)::int; end loop;
      if s % 5 = 0 then return true; end if;
    end if;
    return public.luhn_valid(v);
  end if;
  return false;
end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- ============ Profils ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type public.account_type not null default 'particulier',
  role public.user_role not null default 'user',
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null,
  phone text check (phone is null or phone ~ '^\+?[0-9 .-]{10,20}$'),
  siret text check (siret is null or public.siret_siren_valid(siret)),
  company_name text check (company_name is null or char_length(company_name) between 2 and 120),
  address_line text,
  postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  city text,
  goals text[] not null default array['Faire du sport 3x/semaine','Dormir mieux','Manger équilibré'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pro_fields_required check (
    account_type = 'particulier'
    or (phone is not null and siret is not null and address_line is not null and postal_code is not null and city is not null
        and (account_type <> 'entreprise' or company_name is not null))
  )
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- Fonctions d'aide aux règles RLS (schéma privé, non exposé par l'API)
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function private.my_account_type()
returns public.account_type language sql stable security definer set search_path = '' as $$
  select account_type from public.profiles where id = auth.uid();
$$;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.my_account_type() to anon, authenticated;

-- Profil créé automatiquement à partir des métadonnées d'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, account_type, first_name, last_name, email, phone, siret, company_name, address_line, postal_code, city)
  values (
    new.id,
    coalesce(nullif(m->>'account_type', ''), 'particulier')::public.account_type,
    coalesce(nullif(m->>'first_name', ''), 'Utilisateur'),
    coalesce(nullif(m->>'last_name', ''), '-'),
    new.email,
    nullif(m->>'phone', ''), nullif(m->>'siret', ''), nullif(m->>'company_name', ''),
    nullif(m->>'address_line', ''), nullif(m->>'postal_code', ''), nullif(m->>'city', '')
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Empêche un utilisateur de modifier son rôle, son type de compte ou son e-mail
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() and auth.uid() is not null then
    new.role := old.role;
    new.account_type := old.account_type;
    new.email := old.email;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_columns();

-- ============ Activités ============
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  coach_name text not null default '',
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  category text not null default 'Fitness',
  level text not null default 'Tous niveaux',
  city text not null,
  address text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  duration_min int not null check (duration_min between 10 and 600),
  max_participants int not null default 10 check (max_participants between 1 and 200),
  status public.activity_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activities_coach_idx on public.activities(coach_id);
create index activities_status_idx on public.activities(status);
create trigger activities_updated before update on public.activities for each row execute function public.set_updated_at();

create or replace function public.activities_set_coach_name()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select coalesce(nullif(p.company_name, ''), p.first_name || ' ' || p.last_name) into new.coach_name
  from public.profiles p where p.id = new.coach_id;
  return new;
end $$;
create trigger activities_coach_name before insert or update of coach_id on public.activities
  for each row execute function public.activities_set_coach_name();

-- ============ Créneaux (disponibilités) ============
create table public.activity_slots (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  starts_at timestamptz not null,
  capacity int not null check (capacity between 1 and 200),
  created_at timestamptz not null default now(),
  unique (activity_id, starts_at)
);
create index slots_activity_idx on public.activity_slots(activity_id, starts_at);

-- ============ Réservations ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.activity_slots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  participants int not null check (participants between 1 and 10),
  status public.booking_status not null default 'confirmed',
  cgv_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index bookings_user_idx on public.bookings(user_id);
create index bookings_slot_idx on public.bookings(slot_id);
create unique index bookings_one_active_per_slot on public.bookings(slot_id, user_id) where status = 'confirmed';

-- ============ Planning personnel ============
create table public.planning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  type text,
  date date not null,
  time time not null,
  duration text,
  created_at timestamptz not null default now()
);
create index planning_user_idx on public.planning_items(user_id, date);

-- ============ Badges ============
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text not null default '🏅',
  points int not null default 10,
  threshold int not null default 1
);
create table public.user_badges (
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
create index user_badges_badge_idx on public.user_badges(badge_id);

-- ============ Entreprise : employés et défis ============
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  active boolean not null default true,
  activities_count int not null default 0 check (activities_count >= 0),
  created_at timestamptz not null default now(),
  unique (business_id, email)
);
create index employees_business_idx on public.employees(business_id);
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 2 and 120),
  description text,
  goal int not null check (goal > 0),
  unit text not null default 'Activités' check (unit in ('Pas','Kilomètres','Heures','Activités')),
  progress int not null default 0 check (progress >= 0),
  created_at timestamptz not null default now()
);
create index challenges_business_idx on public.challenges(business_id);

-- ============ Dossiers partenaires & contact ============
create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  structure_name text not null,
  structure_type text not null check (structure_type in ('Coach indépendant','Association')),
  sports text not null,
  message text,
  status text not null default 'en attente' check (status in ('en attente','validé','refusé')),
  created_at timestamptz not null default now()
);
create index partner_applications_user_idx on public.partner_applications(user_id);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  subject text not null default 'Contact',
  message text not null check (char_length(message) between 5 and 4000),
  created_at timestamptz not null default now()
);

-- ============ Row Level Security ============
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.planning_items enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.employees enable row level security;
alter table public.challenges enable row level security;
alter table public.partner_applications enable row level security;
alter table public.contact_messages enable row level security;

create policy "profil: lecture soi-même ou admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy "profil: modification soi-même ou admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

create policy "activités publiées visibles par tous" on public.activities for select to anon, authenticated
  using (status = 'published' or coach_id = (select auth.uid()) or (select private.is_admin()));
create policy "coach crée ses activités" on public.activities for insert to authenticated
  with check (coach_id = (select auth.uid()) and (select private.my_account_type()) in ('coach','entreprise'));
create policy "coach modifie ses activités" on public.activities for update to authenticated
  using (coach_id = (select auth.uid()) or (select private.is_admin()))
  with check (coach_id = (select auth.uid()) or (select private.is_admin()));
create policy "coach supprime ses activités" on public.activities for delete to authenticated
  using (coach_id = (select auth.uid()) or (select private.is_admin()));

create policy "créneaux visibles si activité visible" on public.activity_slots for select to anon, authenticated
  using (exists (select 1 from public.activities a where a.id = activity_id
         and (a.status = 'published' or a.coach_id = (select auth.uid()) or (select private.is_admin()))));
create policy "coach gère ses créneaux (insert)" on public.activity_slots for insert to authenticated
  with check (starts_at > now() and exists (select 1 from public.activities a where a.id = activity_id and a.coach_id = (select auth.uid())));
create policy "coach gère ses créneaux (update)" on public.activity_slots for update to authenticated
  using (exists (select 1 from public.activities a where a.id = activity_id and (a.coach_id = (select auth.uid()) or (select private.is_admin()))));
create policy "coach gère ses créneaux (delete)" on public.activity_slots for delete to authenticated
  using (exists (select 1 from public.activities a where a.id = activity_id and (a.coach_id = (select auth.uid()) or (select private.is_admin()))));

-- Réservations : lecture seule ; écriture uniquement via book_slot / cancel_booking
create policy "réservations : l'utilisateur, le coach concerné ou l'admin" on public.bookings for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()) or exists (
    select 1 from public.activity_slots s join public.activities a on a.id = s.activity_id
    where s.id = slot_id and a.coach_id = (select auth.uid())));

create policy "planning perso" on public.planning_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "badges visibles" on public.badges for select to anon, authenticated using (true);
create policy "mes badges" on public.user_badges for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "employés de mon entreprise" on public.employees for all to authenticated
  using (business_id = (select auth.uid()) or (select private.is_admin()))
  with check (business_id = (select auth.uid()) and (select private.my_account_type()) = 'entreprise');
create policy "défis de mon entreprise" on public.challenges for all to authenticated
  using (business_id = (select auth.uid()) or (select private.is_admin()))
  with check (business_id = (select auth.uid()) and (select private.my_account_type()) = 'entreprise');

create policy "dossier : création par soi" on public.partner_applications for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "dossier : lecture soi ou admin" on public.partner_applications for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "dossier : admin met à jour" on public.partner_applications for update to authenticated
  using ((select private.is_admin()));

create policy "contact : envoi public" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "contact : lecture admin" on public.contact_messages for select to authenticated using ((select private.is_admin()));

-- ============ Fonctions métier (RPC) ============
create or replace function public.award_badges(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  select count(*) into n from public.bookings where user_id = p_user and status = 'confirmed';
  insert into public.user_badges(user_id, badge_id)
  select p_user, b.id from public.badges b where b.threshold <= n
  on conflict do nothing;
end $$;

-- Réservation atomique : verrou sur le créneau, contrôle des places, CGV obligatoires
create or replace function public.book_slot(p_slot uuid, p_participants int, p_accept_cgv boolean)
returns public.bookings language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_slot public.activity_slots;
  v_act public.activities;
  v_taken int;
  v_row public.bookings;
begin
  if v_uid is null then raise exception 'Vous devez être connecté(e) pour réserver.' using errcode = '28000'; end if;
  if not coalesce(p_accept_cgv, false) then raise exception 'Vous devez accepter les CGV pour réserver.' using errcode = '22023'; end if;
  if p_participants is null or p_participants < 1 or p_participants > 10 then
    raise exception 'Nombre de participants invalide (1 à 10).' using errcode = '22023'; end if;

  select * into v_slot from public.activity_slots where id = p_slot for update;
  if not found then raise exception 'Créneau introuvable.' using errcode = 'P0002'; end if;
  select * into v_act from public.activities where id = v_slot.activity_id;
  if v_act.status <> 'published' then raise exception 'Cette activité n''est plus disponible.' using errcode = '22023'; end if;
  if v_slot.starts_at <= now() then raise exception 'Ce créneau est déjà passé.' using errcode = '22023'; end if;
  if v_act.coach_id = v_uid then raise exception 'Vous ne pouvez pas réserver votre propre activité.' using errcode = '22023'; end if;
  if exists (select 1 from public.bookings where slot_id = p_slot and user_id = v_uid and status = 'confirmed') then
    raise exception 'Vous avez déjà une réservation sur ce créneau.' using errcode = '23505'; end if;

  select coalesce(sum(participants), 0) into v_taken from public.bookings where slot_id = p_slot and status = 'confirmed';
  if v_taken + p_participants > v_slot.capacity then
    raise exception 'Plus assez de places : % place(s) restante(s).', v_slot.capacity - v_taken using errcode = '22023'; end if;

  insert into public.bookings(slot_id, user_id, participants, cgv_accepted_at)
  values (p_slot, v_uid, p_participants, now()) returning * into v_row;
  perform public.award_badges(v_uid);
  return v_row;
end $$;

create or replace function public.cancel_booking(p_booking uuid)
returns public.bookings language plpgsql security definer set search_path = '' as $$
declare v_row public.bookings; v_start timestamptz;
begin
  select b.* into v_row from public.bookings b where b.id = p_booking for update;
  if not found or (v_row.user_id <> auth.uid() and not private.is_admin()) then
    raise exception 'Réservation introuvable.' using errcode = 'P0002'; end if;
  if v_row.status = 'cancelled' then return v_row; end if;
  select starts_at into v_start from public.activity_slots where id = v_row.slot_id;
  if v_start <= now() then raise exception 'Impossible d''annuler une séance passée.' using errcode = '22023'; end if;
  update public.bookings set status = 'cancelled', cancelled_at = now() where id = p_booking returning * into v_row;
  return v_row;
end $$;

-- Places restantes des créneaux à venir (activités visibles par l'appelant)
create or replace function public.slot_availability(p_activity uuid default null)
returns table (slot_id uuid, activity_id uuid, starts_at timestamptz, capacity int, remaining int)
language sql stable security definer set search_path = '' as $$
  select s.id, s.activity_id, s.starts_at, s.capacity,
         (s.capacity - coalesce(sum(b.participants) filter (where b.status = 'confirmed'), 0))::int
  from public.activity_slots s
  join public.activities a on a.id = s.activity_id
  left join public.bookings b on b.slot_id = s.id
  where (p_activity is null or s.activity_id = p_activity)
    and (a.status = 'published' or a.coach_id = auth.uid() or private.is_admin())
    and s.starts_at > now()
  group by s.id
  order by s.starts_at;
$$;

-- Réservations reçues par le coach connecté
create or replace function public.coach_bookings()
returns table (booking_id uuid, activity_title text, starts_at timestamptz, participants int, status public.booking_status,
               customer_name text, customer_email text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select b.id, a.title, s.starts_at, b.participants, b.status, p.first_name || ' ' || p.last_name, p.email, b.created_at
  from public.bookings b
  join public.activity_slots s on s.id = b.slot_id
  join public.activities a on a.id = s.activity_id
  join public.profiles p on p.id = b.user_id
  where a.coach_id = auth.uid() or private.is_admin()
  order by s.starts_at;
$$;

-- Droit à l'effacement (RGPD)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Non connecté.' using errcode = '28000'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ============ Droits d'exécution ============
revoke execute on function public.award_badges(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_columns() from public, anon, authenticated;
revoke execute on function public.activities_set_coach_name() from public, anon, authenticated;
revoke execute on function public.book_slot(uuid, int, boolean) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
revoke execute on function public.coach_bookings() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.book_slot(uuid, int, boolean) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.coach_bookings() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.slot_availability(uuid) to anon, authenticated;

-- ============ Données de référence ============
insert into public.badges(code, name, description, icon, points, threshold) values
 ('first', 'Premier pas', 'Votre toute première réservation.', '🥇', 10, 1),
 ('regular', 'Régulier', '3 séances réservées.', '🔥', 30, 3),
 ('sportzen', 'Badge SportZen', '5 séances réservées : vous êtes lancé(e) !', '🧘', 50, 5),
 ('champion', 'Champion local', '10 séances réservées.', '🏆', 100, 10);
