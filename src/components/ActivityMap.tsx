"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { Activity } from "@/lib/types";

const pin = (color: string) =>
  L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
const activityIcon = pin("#0369a1");
const meIcon = pin("#f97316");

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 13);
  }, [map, points]);
  return null;
}

export default function ActivityMap({
  activities, userPos, onBook,
}: { activities: Activity[]; userPos: [number, number] | null; onBook: (a: Activity) => void }) {
  const located = activities.filter((a) => a.latitude != null && a.longitude != null);
  const points: [number, number][] = [...located.map((a) => [a.latitude!, a.longitude!] as [number, number]), ...(userPos ? [userPos] : [])];
  return (
    <MapContainer center={[48.8566, 2.3522]} zoom={12} scrollWheelZoom={false} className="h-[360px] w-full md:h-[520px]">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds points={points} />
      {userPos && (
        <Marker position={userPos} icon={meIcon}>
          <Popup>Vous êtes ici 📍</Popup>
        </Marker>
      )}
      {located.map((a) => (
        <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={activityIcon}>
          <Popup>
            <strong>{a.title}</strong>
            <br />
            Par {a.coach_name} · {a.city}
            <br />
            <button className="mt-2 rounded bg-primary-700 px-3 py-1 text-white" onClick={() => onBook(a)}>Réserver</button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
