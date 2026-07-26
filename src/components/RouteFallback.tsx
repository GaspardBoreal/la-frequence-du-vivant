/**
 * Écran d'attente affiché pendant le chargement à la demande d'une section.
 * Volontairement sobre et intégré au thème (pas de spinner générique).
 */
export default function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 rounded-full border border-primary/25" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          <span className="absolute inset-[30%] rounded-full bg-primary/70 animate-pulse" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground animate-pulse">
          La fréquence s'accorde…
        </p>
      </div>
    </div>
  );
}
