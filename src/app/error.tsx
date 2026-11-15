"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-custom py-24 text-center">
      <h1 className="text-2xl md:text-3xl">Une erreur est survenue</h1>
      <p className="mt-2 text-neutral-600">Veuillez réessayer. Si le problème persiste, contactez-nous.</p>
      <button onClick={reset} className="btn-primary mt-6">Réessayer</button>
    </div>
  );
}
