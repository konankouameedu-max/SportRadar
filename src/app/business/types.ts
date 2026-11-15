export type Employee = { id: string; first_name: string; last_name: string; email: string; active: boolean; activities_count: number; created_at: string };
export type Challenge = { id: string; name: string; description: string | null; goal: number; unit: "Pas" | "Kilomètres" | "Heures" | "Activités"; progress: number; created_at: string };
