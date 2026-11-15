import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mes badges" };

type Badge = { id: string; name: string; description: string; icon: string; points: number; threshold: number };

export default async function Page() {
  const profile = await requireProfile("/dashboard/badges");
  const supabase = await createClient();
  const [{ data: badges }, { data: mine }] = await Promise.all([
    supabase.from("badges").select("*").order("threshold"),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", profile.id),
  ]);
  const earned = new Map((mine ?? []).map((m) => [m.badge_id as string, m.earned_at as string]));
  const points = (badges as Badge[] ?? []).filter((b) => earned.has(b.id)).reduce((s, b) => s + b.points, 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold md:text-3xl">Mes badges</h1>
        <p className="rounded-full bg-primary-50 px-4 py-1 font-semibold text-primary-700">{points} pts</p>
      </div>
      <p className="text-neutral-600">Les badges se débloquent automatiquement à chaque réservation confirmée.</p>
      {(badges ?? []).length === 0 ? <p className="text-center text-neutral-500">Aucun badge disponible pour le moment.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(badges as Badge[]).map((b) => {
            const at = earned.get(b.id);
            return (
              <div key={b.id} className={`flex items-center gap-3 rounded-lg border bg-white p-4 shadow ${at ? "" : "opacity-50 grayscale"}`}>
                <div className="text-3xl" aria-hidden>{b.icon}</div>
                <div>
                  <h2 className="text-lg font-semibold">{b.name}</h2>
                  <p className="text-sm text-neutral-600">{b.description}</p>
                  <p className="mt-1 text-sm font-semibold text-primary-600">+{b.points} pts {at ? `· obtenu le ${new Date(at).toLocaleDateString("fr-FR")}` : "· à débloquer"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
