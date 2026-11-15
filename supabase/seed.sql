-- Données de démonstration : à exécuter APRÈS avoir créé les comptes coach
-- coach.test@sportradar-demo.fr et coach2.demo@sportradar-demo.fr (via la page /register
-- ou la fonction Edge `register`). Crée 5 activités à Paris et des créneaux sur 3 semaines.
with c1 as (select id from public.profiles where email = 'coach.test@sportradar-demo.fr'),
     c2 as (select id from public.profiles where email = 'coach2.demo@sportradar-demo.fr'),
ins as (
  insert into public.activities (coach_id, title, description, category, level, city, address, latitude, longitude, duration_min, max_participants)
  values
  ((select id from c1), 'Yoga au parc Monceau', 'Séance de hatha yoga en plein air pour se détendre et gagner en souplesse. Apportez votre tapis et une bouteille d''eau.', 'Yoga', 'Tous niveaux', 'Paris', '35 boulevard de Courcelles', 48.8796, 2.3093, 60, 12),
  ((select id from c1), 'Renforcement musculaire express', 'Circuit training de 45 minutes au poids du corps : gainage, squats, pompes adaptées. Idéal à la pause déjeuner.', 'Renforcement musculaire', 'Intermédiaire', 'Paris', 'Jardin des Tuileries', 48.8635, 2.3275, 45, 10),
  ((select id from c2), 'Running des quais de Seine', 'Sortie course de 8 km à allure modérée le long des quais, avec échauffement et étirements encadrés.', 'Running', 'Débutant', 'Paris', 'Quai de la Rapée', 48.8443, 2.3700, 75, 15),
  ((select id from c2), 'Boxe fitness à Oberkampf', 'Cardio-boxe sans contact : enchaînements au sac et travail de coordination. Gants fournis.', 'Arts martiaux', 'Tous niveaux', 'Paris', '12 rue Oberkampf', 48.8647, 2.3730, 60, 8),
  ((select id from c1), 'Pilates au Champ-de-Mars', 'Pilates au sol pour renforcer la sangle abdominale et améliorer la posture. Séance douce et accessible.', 'Fitness', 'Débutant', 'Paris', 'Parc du Champ-de-Mars', 48.8556, 2.2986, 50, 12)
  returning id, max_participants
)
insert into public.activity_slots (activity_id, starts_at, capacity)
select ins.id,
       (date_trunc('day', now() at time zone 'Europe/Paris') + make_interval(days => d) + make_interval(hours => h)) at time zone 'Europe/Paris',
       ins.max_participants
from ins, generate_series(1, 21, 2) d, unnest(array[9, 12, 18]) h;

-- Promouvoir un administrateur :
-- update public.profiles set role = 'admin' where email = 'admin.demo@sportradar-demo.fr';
