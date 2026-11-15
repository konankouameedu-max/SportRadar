# SportRadar — Bougez localement, vivez mieux

Plateforme web de réservation d'activités sportives locales qui met en relation **particuliers**, **coachs / associations** et **entreprises**.
Nouvelle version complète du site d'origine (même identité visuelle, mêmes pages et parcours), développée en **Next.js 15 + TypeScript + Tailwind CSS + Supabase**, avec :

- un système d'activités et de réservation entièrement fonctionnel (créneaux, places, annulation, anti-surréservation) ;
- un formulaire d'inscription dynamique selon le type de compte (particulier / coach / entreprise) avec validation e-mail, SIRET/SIREN, téléphone et mots de passe ;
- des CGV, une case d'acceptation obligatoire avant chaque réservation et un récapitulatif de réservation ;
- une sécurité appliquée dans la base de données (Row Level Security Supabase) ;
- des tests unitaires, de sécurité et de bout en bout.

> Aucun paiement en ligne n'existe sur le site d'origine : les réservations sont gratuites et aucune donnée bancaire n'est collectée. Voir [docs/TECHNIQUE.md](docs/TECHNIQUE.md#paiement-en-ligne) pour ajouter Stripe si nécessaire.

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données Supabase](#base-de-données-supabase)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Tests](#tests)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Structure du projet](#structure-du-projet)

## Fonctionnalités

| Profil | Fonctionnalités |
|---|---|
| Visiteur | Accueil, Découvrir (carte Leaflet + liste + filtres), pages Entreprise et Coachs, CGV, mentions légales, confidentialité, cookies, contact |
| Particulier | Inscription / connexion, réservation (date, créneau, nombre de participants, CGV), récapitulatif, *Mes réservations* (annulation), planning personnel, météo, profil, badges |
| Coach / association | Publier, modifier, dépublier, supprimer des activités ; créneaux ponctuels ou récurrents avec nombre de places ; réservations reçues ; géolocalisation de l'adresse |
| Entreprise | Tableau de bord, employés (ajout, statut, activités), défis (création, progression), rapports graphiques + export CSV |
| Administrateur | Utilisateurs (rôles), modération des activités, dossiers partenaires, messages de contact |

## Stack technique

- **Next.js 15** (App Router, Server Components) + **React 19** + **TypeScript** strict
- **Tailwind CSS 3** — palette `sky` du site d'origine, polices Montserrat / Open Sans (auto-hébergées via Fontsource)
- **Supabase** : PostgreSQL, Auth (e-mail / mot de passe), RLS, fonctions RPC, fonction Edge `register`
- **Leaflet / react-leaflet** (OpenStreetMap), **Recharts**, **lucide-react**
- API publiques : [Open-Meteo](https://open-meteo.com) (météo) et [API Adresse](https://adresse.data.gouv.fr) (géocodage) — sans clé
- **Vitest** (tests unitaires), **Playwright** (tests E2E)

## Installation locale

Prérequis : Node.js ≥ 20 et un projet Supabase.

```bash
git clone <url-du-depot> sportradar
cd sportradar
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:3000
```

Commandes utiles :

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm test` | Tests unitaires (validation, fuseaux horaires) |
| `npm run test:e2e` | Tests de bout en bout (application lancée sur :3000) |
| `npm run test:security` | Tests de sécurité de l'API (RLS, RPC, capacité) |

## Variables d'environnement

| Variable | Où | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Clé **publique** (publishable / anon). Elle est conçue pour être exposée au navigateur : la sécurité repose sur les règles RLS. |

La clé `service_role` n'est **jamais** utilisée côté Next.js : seule la fonction Edge `register` y accède (variable injectée automatiquement par Supabase).

## Base de données Supabase

1. Créer un projet Supabase (région recommandée : `eu-west-3` Paris).
2. Exécuter `supabase/migrations/20261115000000_sportradar_schema.sql` (SQL Editor ou `supabase db push`).
3. Déployer la fonction Edge d'inscription :
   ```bash
   supabase functions deploy register --no-verify-jwt
   ```
   (`supabase/functions/_shared/validation.ts` est une copie de `src/lib/validation.ts` : gardez-les synchronisés.)
4. (Facultatif) Créer les comptes de démo via `/register`, puis exécuter `supabase/seed.sql`.
5. Promouvoir un administrateur : `update public.profiles set role = 'admin' where email = '...';`

Schéma et règles de sécurité détaillés : [docs/TECHNIQUE.md](docs/TECHNIQUE.md).

## Déploiement sur Vercel

1. Importer le dépôt GitHub dans Vercel (framework détecté : Next.js).
2. Ajouter les deux variables d'environnement ci-dessus (Production + Preview).
3. Déployer. Chaque `git push` sur `main` redéploie automatiquement.

## Tests

- **Unitaires** (`npm test`) : validation e-mail, SIRET/SIREN (clé de Luhn, cas La Poste), mots de passe, champs par type de compte, conversion de fuseau horaire.
- **Sécurité** (`npm run test:security`) : 18 contrôles — accès anonyme, isolation des données, élévation de privilèges, réservation sans CGV, **réservations simultanées sans surréservation**, double réservation…
- **Bout en bout** (`npm run test:e2e [url]`) : 21 scénarios — inscription des 3 types de compte, messages d'erreur, publication / modification / suppression d'activité, créneaux récurrents, réservation avec CGV, créneau complet, annulation, planning, espace entreprise, contrôle d'accès, admin, affichage mobile / tablette / ordinateur.

## Comptes de démonstration

| Profil | E-mail | Mot de passe |
|---|---|---|
| Particulier | `particulier.demo@sportradar-demo.fr` | `Demo2026!` |
| Coach | `coach.test@sportradar-demo.fr` | `Coach2026!` |
| Coach | `coach2.demo@sportradar-demo.fr` | `Demo2026!` |
| Entreprise | `entreprise.demo@sportradar-demo.fr` | `Demo2026!` |
| Administrateur | `admin.demo@sportradar-demo.fr` | `Admin2026!` |

⚠️ Changez ou supprimez ces comptes avant une utilisation réelle.

## Structure du projet

```
src/
  app/                    Pages (App Router)
    page.tsx              Accueil
    discover/             Carte + liste + réservation
    register/ login/      Authentification
    dashboard/            Espace particulier (réservations, planning, profil, badges)
    coach/                Espace coach (activités, créneaux, réservations reçues)
    business/             Espace entreprise (employés, défis, rapports)
    admin/                Administration
    cgv/ mentions-legales/ confidentialite/ cookies/ contact/ ...
  components/             Composants partagés (Navbar, Footer, BookingModal, ActivityForm, SlotManager…)
  lib/                    Supabase (client/serveur), validation, formatage, types
  middleware.ts           Rafraîchissement de session + protection des espaces privés
supabase/
  migrations/             Schéma SQL complet (tables, RLS, fonctions)
  functions/register/     Fonction Edge d'inscription sécurisée
  seed.sql                Données de démonstration
tests/                    Tests E2E (Playwright) et de sécurité
docs/TECHNIQUE.md         Documentation technique
```
