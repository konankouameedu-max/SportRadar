/** Géocodage via l'API Adresse de l'État (gratuite, sans clé). Retourne null si introuvable. */
export async function geocode(address: string, city: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const q = [address, city].filter(Boolean).join(" ").trim();
  if (q.length < 3) return null;
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`);
    if (!res.ok) return null;
    const json = await res.json();
    const f = json.features?.[0];
    if (!f || f.properties?.score < 0.4) return null;
    const [lng, lat] = f.geometry.coordinates;
    return { lat, lng, label: f.properties.label };
  } catch {
    return null;
  }
}
