"use client";

import { useEffect, useState } from "react";

type Daily = { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] };

export function Weather() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FParis")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setDaily(d.daily))
      .catch(() => setFailed(true));
  }, []);
  if (failed) return null;
  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold md:text-xl">Prévisions météo (Paris)</h2>
      {!daily ? (
        <p className="text-sm text-neutral-500">Chargement…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {daily.time.map((t, i) => {
            const rain = daily.precipitation_probability_max[i];
            return (
              <div key={t} className="w-32 shrink-0 rounded-lg border bg-neutral-50 p-3 text-center">
                <p className="text-sm font-medium">{new Date(t).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>
                <p className="my-1 text-2xl" aria-label={rain > 80 ? "Fortement pluvieux" : rain > 50 ? "Risque de pluie" : "Beau temps"}>{rain > 80 ? "🌧️" : rain > 50 ? "⚠️" : "☀️"}</p>
                <p className="text-sm">{Math.round(daily.temperature_2m_min[i])}° / {Math.round(daily.temperature_2m_max[i])}°C</p>
                <p className="text-xs text-neutral-500">{rain}% pluie</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
