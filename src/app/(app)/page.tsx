export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <div className="text-5xl" style={{ animation: 'var(--animate-flame)' }}>
        🔥
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">ICT Devocional</h1>
      <p className="text-muted text-center text-sm">Tu camino diario con Dios</p>
    </div>
  );
}
