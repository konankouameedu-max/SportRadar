import Link from "next/link";

export const metadata = { title: "Accès refusé" };

export default function Forbidden() {
  return (
    <div className="container-custom flex flex-col items-center py-24 text-center">
      <p className="font-heading text-6xl font-bold text-red-500">403</p>
      <h1 className="mt-4 text-2xl md:text-3xl">Accès refusé</h1>
      <p className="mt-2 max-w-lg text-neutral-600">Cet espace est réservé à un autre type de compte (particulier, coach, entreprise ou administrateur).</p>
      <Link href="/" className="btn-primary mt-8">Retour à l&apos;accueil</Link>
    </div>
  );
}
