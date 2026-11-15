import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-custom flex flex-col items-center py-24 text-center">
      <p className="font-heading text-6xl font-bold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl md:text-3xl">Page introuvable</h1>
      <p className="mt-2 text-neutral-600">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">Retour à l&apos;accueil</Link>
        <Link href="/discover" className="btn-outline">Voir les activités</Link>
      </div>
    </div>
  );
}
