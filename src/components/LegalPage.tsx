export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="container-custom max-w-4xl py-12 md:py-16">
      <article className="legal rounded-xl bg-white p-6 shadow-card md:p-10">
        <h1 className="mb-2 text-3xl md:text-4xl">{title}</h1>
        {updated && <p className="mb-6 text-sm text-neutral-500">Dernière mise à jour : {updated}</p>}
        {children}
      </article>
    </div>
  );
}
