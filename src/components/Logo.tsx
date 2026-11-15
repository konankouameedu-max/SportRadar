import { Activity } from "lucide-react";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Activity className={dark ? "h-7 w-7 text-primary-300" : "h-7 w-7 text-primary-500"} aria-hidden />
      <span className={`font-heading text-lg font-semibold ${dark ? "text-white" : "text-neutral-800"}`}>
        Sport<span className={dark ? "text-primary-300" : "text-primary-500"}>Radar</span>
      </span>
    </span>
  );
}
