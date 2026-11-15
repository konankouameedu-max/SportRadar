# Documentation technique — SportRadar

## 1. Architecture

```
Navigateur ──► Next.js (Vercel)
                 │  Server Components : lecture des données avec la session de l'utilisateur (cookies)
                 │  Client Components : formulaires, carte, réservation (supabase-js)
                 ▼
              Supabase
                 ├─ Auth (e-mail / mot de passe, sessions JWT en cookies httpOnly via @supabase/ssr)
                 ├─ PostgreSQL + RLS (toutes les règles d'accès sont dans la base)
                 ├─ RPC : book_slot, cancel_booking, slot_availability, coach_bookings, delete_my_account
                 └─ Edge Function `register` (validation serveur + création du compte)
```

- `src/middleware.ts` rafraîchit la session et redirige les visiteurs non connectés qui tentent d'accéder à `/dashboard`, `/coach`, `/business`, `/admin`.
- Chaque espace a un `layout.tsx` serveur qui appelle `requireProfile(path, types)` : un compte d'un autre type est redirigé vers `/acces-refuse`.
- Ces contrôles d'interface sont doublés par les règles RLS : même en appelant l'API directement, un utilisateur ne peut lire ou modifier que ce qui lui est autorisé.

## 2. Modèle de données

| Table | Rôle | Points clés |
|---|---|---|
| `profiles` | 1 ligne par compte (`auth.users`) | `account_type` (particulier/coach/entreprise), `role` (user/admin), champs pro (téléphone, SIRET, adresse, entreprise). Contraintes : SIRET valide (Luhn), champs pro obligatoires selon le type. |
| `activities` | Activités publiées par les coachs | statut `draft/published/archived`, catégorie, niveau, lieu + coordonnées, durée, places par défaut, `coach_name` dénormalisé |
| `activity_slots` | Créneaux (disponibilités) | `starts_at`, `capacity`, unicité (activité, horaire) |
| `bookings` | Réservations | `participants` (1–10), `status` (confirmed/cancelled), `cgv_accepted_at` obligatoire, une seule réservation active par utilisateur et créneau |
| `planning_items` | Planning personnel | privé à l'utilisateur |
| `badges`, `user_badges` | Gamification | attribution automatique après réservation (1, 3, 5, 10 séances) |
| `employees`, `challenges` | Espace entreprise | privés à l'entreprise |
| `partner_applications` | Dossiers coachs/associations | validés par l'admin |
| `contact_messages` | Formulaire de contact | insertion publique, lecture admin |

## 3. Inscription et authentification

1. Le formulaire (`src/app/register/RegisterForm.tsx`) n'affiche et n'envoie que les champs du type choisi (`FIELDS_BY_TYPE`).
2. Validation instantanée côté client (`src/lib/validation.ts`) : e-mail, SIRET (14 chiffres) / SIREN (9 chiffres) avec clé de Luhn, téléphone français, code postal, mot de passe (8 caractères, majuscule, minuscule, chiffre), correspondance des mots de passe, consentement RGPD.
3. La fonction Edge `register` **refait toutes les vérifications** puis crée le compte avec la clé `service_role` (jamais exposée). Le trigger SQL `handle_new_user` crée le profil.
4. La base applique encore des contraintes (`siret_siren_valid`, `pro_fields_required`) : une donnée invalide ne peut pas être enregistrée, même par un appel direct.
5. Les mots de passe sont hachés par Supabase Auth (bcrypt). Le trigger `protect_profile_columns` empêche un utilisateur de modifier son rôle, son type de compte ou son e-mail.

> Les comptes sont créés déjà confirmés : aucun e-mail de vérification n'est envoyé, car le serveur d'e-mails par défaut de Supabase ne peut écrire qu'aux membres de l'équipe. Pour activer la confirmation par e-mail en production, configurez un SMTP (Supabase → Authentication → Emails → SMTP), puis remplacez `email_confirm: true` par l'envoi d'une invitation dans `supabase/functions/register/index.ts`.

## 4. Activités, disponibilités et réservations

- **Coach** : `ActivityForm` (création / modification, géocodage via l'API Adresse) et `SlotManager` (créneaux ponctuels ou récurrents sur N semaines, modification de capacité impossible sous le nombre de places déjà réservées, suppression avec avertissement).
- **Affichage** : `slot_availability()` calcule les places restantes des créneaux futurs des activités publiées. Une activité sans créneau disponible reste visible mais n'est pas réservable.
- **Réservation** : `book_slot(slot, participants, cgv)` s'exécute dans une transaction avec `SELECT … FOR UPDATE` sur le créneau. Elle vérifie la connexion, l'acceptation des CGV, l'état publié, la date future, l'absence de doublon et les places restantes. Des réservations simultanées ne peuvent donc pas dépasser la capacité (vérifié par `tests/security.mjs`).
- **Annulation** : `cancel_booking(id)`, avant le début de la séance uniquement ; les places sont libérées immédiatement.
- Les dates sont saisies et affichées en heure de Paris (`src/lib/format.ts`) et stockées en UTC.

## 5. CGV

- Page `/cgv`, liée dans le pied de page et dans la fenêtre de réservation.
- Case « J'ai lu et j'accepte les CGV » obligatoire : le bouton reste désactivé tant qu'elle n'est pas cochée, et la base refuse toute réservation sans acceptation. La date d'acceptation est enregistrée (`bookings.cgv_accepted_at`).
- Après la réservation, un récapitulatif s'affiche (activité, coach, date, heure, lieu, participants, montant, numéro de réservation) et reste consultable dans *Mes réservations*.

## 6. Paiement en ligne

Le site d'origine ne propose aucun paiement : la nouvelle version n'en implémente donc pas (montant affiché : « Gratuit »). Pour ajouter des activités payantes :

1. Ajouter `price_cents` à `activities` et une table `payments (booking_id, stripe_session_id, amount_cents, status)` en lecture seule pour l'utilisateur.
2. Créer une fonction Edge `create-checkout` qui crée une session **Stripe Checkout** (les coordonnées bancaires restent chez Stripe, jamais dans la base).
3. Créer une fonction Edge `stripe-webhook` qui vérifie la signature et confirme la réservation au paiement (`checkout.session.completed`).
4. Mettre à jour la section « Prix et paiement » des CGV.

## 7. Sécurité

- RLS activée sur **toutes** les tables ; fonctions d'aide dans un schéma `private` non exposé par l'API.
- Écritures sensibles (réservations) uniquement via des fonctions `SECURITY DEFINER` avec `search_path` vide et des droits `EXECUTE` limités.
- En-têtes HTTP de sécurité (`next.config.ts`) : HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Redirections après connexion limitées aux chemins internes (`safeNext`).
- RGPD : consentement à l'inscription, page cookies, suppression du compte et de toutes les données (`delete_my_account`).
- Recommandé dans le tableau de bord Supabase : activer la protection contre les mots de passe divulgués (Auth → Password security) et configurer un SMTP.

## 8. Maintenance

- **Modifier le schéma** : ajouter un fichier SQL dans `supabase/migrations/`, l'appliquer (`supabase db push`), puis lancer `npm run test:security`.
- **Modifier les règles d'inscription** : éditer `src/lib/validation.ts`, le copier dans `supabase/functions/_shared/validation.ts`, puis redéployer la fonction `register`.
- **Ajouter une catégorie ou un niveau** : `CATEGORIES` / `LEVELS` dans `src/lib/types.ts`.
- **Avant chaque mise en production** : `npm run lint && npm run typecheck && npm test && npm run build`, puis `npm run test:e2e` sur l'URL de préproduction.
