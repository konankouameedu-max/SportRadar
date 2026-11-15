import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtShortDate, fmtTime } from "@/lib/format";

export const metadata = { title: "Réservations reçues" };

type Row = { booking_id: string; activity_title: string; starts_at: string; participants: number; status: "confirmed" | "cancelled"; customer_name: string; customer_email: string; created_at: string };

export default async function Page() {
  await requireProfile("/coach/reservations", ["coach"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("coach_bookings");
  const rows = (data as Row[]) ?? [];
  const now = Date.now();
  const upcoming = rows.filter((r) => new Date(r.starts_at).getTime() > now);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Réservations reçues</h1>
      {error && <div className="alert-error">Impossible de charger les réservations.</div>}
      {upcoming.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">Aucune réservation à venir pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b text-neutral-500"><th className="py-2">Séance</th><th>Date</th><th>Participant</th><th>Places</th><th>Statut</th></tr></thead>
            <tbody>
              {upcoming.map((r) => (
                <tr key={r.booking_id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{r.activity_title}</td>
                  <td>{fmtShortDate(r.starts_at)} {fmtTime(r.starts_at)}</td>
                  <td>{r.customer_name}<br /><a href={`mailto:${r.customer_email}`} className="text-xs text-primary-700">{r.customer_email}</a></td>
                  <td>{r.participants}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"}`}>{r.status === "confirmed" ? "Confirmée" : "Annulée"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
