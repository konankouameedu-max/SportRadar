import type { LucideIcon } from "lucide-react";

export function Stat({ icon: Icon, label, value, hint, tone = "primary" }: { icon: LucideIcon; label: string; value: string | number; hint?: string; tone?: "primary" | "green" | "orange" | "violet" }) {
  const tones = { primary: "bg-primary-100 text-primary-700", green: "bg-green-100 text-green-700", orange: "bg-orange-100 text-orange-700", violet: "bg-violet-100 text-violet-700" };
  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tones[tone]}`}><Icon size={18} aria-hidden /></span>
      </div>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
