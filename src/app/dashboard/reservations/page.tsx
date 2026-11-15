import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchMyBookings } from "@/lib/queries";
import { ReservationsList } from "./ReservationsList";

export const metadata = { title: "Mes réservations" };

export default async function Page() {
  const profile = await requireProfile("/dashboard/reservations");
  const bookings = await fetchMyBookings(await createClient(), profile.id);
  return <ReservationsList bookings={bookings} />;
}
