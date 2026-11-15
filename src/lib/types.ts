import type { AccountType } from "./validation";

export type Profile = {
  id: string;
  account_type: AccountType;
  role: "user" | "admin";
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  siret: string | null;
  company_name: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  goals: string[];
  created_at: string;
};

export type Activity = {
  id: string;
  coach_id: string;
  coach_name: string;
  title: string;
  description: string;
  category: string;
  level: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  duration_min: number;
  max_participants: number;
  status: "draft" | "published" | "archived";
  created_at: string;
};

export type SlotAvailability = {
  slot_id: string;
  activity_id: string;
  starts_at: string;
  capacity: number;
  remaining: number;
};

export type Booking = {
  id: string;
  slot_id: string;
  user_id: string;
  participants: number;
  status: "confirmed" | "cancelled";
  cgv_accepted_at: string;
  created_at: string;
};

export const CATEGORIES = ["Fitness", "Running", "Yoga", "Renforcement musculaire", "Vélo", "Natation", "Sports collectifs", "Danse", "Arts martiaux", "Randonnée", "Autre"];
export const LEVELS = ["Tous niveaux", "Débutant", "Intermédiaire", "Avancé"];

export function dashboardPathFor(p: Pick<Profile, "account_type" | "role"> | null | undefined): string {
  if (!p) return "/login";
  if (p.role === "admin") return "/admin";
  if (p.account_type === "entreprise") return "/business";
  if (p.account_type === "coach") return "/coach";
  return "/dashboard";
}

export function displayName(p: Pick<Profile, "first_name" | "last_name" | "company_name" | "account_type">): string {
  if (p.account_type === "entreprise" && p.company_name) return p.company_name;
  return `${p.first_name} ${p.last_name}`.trim();
}
