import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DistributionResult, GardenAnswers, TallyResult } from '@/lib/onboardingStats';

interface Selection {
  titre: string;
  sousTitre: string;
  gardens: GardenAnswers[];
}

/** Liste des jardins derrière un chiffre : on peut toujours remonter au réel. */
export const RespondentsDrawer: React.FC<{
  selection: Selection | null;
  onClose: () => void;
}> = ({ selection, onClose }) => (
  <Drawer open={!!selection} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DrawerContent className="max-h-[85vh]">
      <DrawerHeader className="text-left">
        <DrawerTitle className="text-base">{selection?.titre}</DrawerTitle>
        <DrawerDescription>{selection?.sousTitre}</DrawerDescription>
      </DrawerHeader>
      <ScrollArea className="max-h-[60vh] px-4 pb-6">
        <ul className="space-y-1.5">
          {(selection?.gardens ?? []).map((g) => (
            <li key={g.id}>
              <Link
                to={`/admin/proprietes/${g.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{g.nom}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[g.ville, g.departement].filter(Boolean).join(' · ') || 'Lieu non renseigné'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </DrawerContent>
  </Drawer>
);

const CardShell: React.FC<{
  titre: string;
  repondants: string;
  children: React.ReactNode;
}> = ({ titre, repondants, children }) => (
  <Card className="p-4 sm:p-5">
    <div className="mb-3 flex items-start justify-between gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{titre}</h3>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{repondants}</span>
    </div>
    {children}
  </Card>
);

const EmptyLine = () => (
  <p className="py-4 text-sm text-muted-foreground">Aucune réponse pour cette sélection.</p>
);

/** Répartition en barres, triée du plus choisi au moins choisi. */
export const QuestionBarCard: React.FC<{
  result: TallyResult;
  onSelect: (s: Selection) => void;
}> = ({ result, onSelect }) => {
  const max = Math.max(1, ...result.items.map((i) => i.count));
  return (
    <CardShell titre={result.title} repondants={`${result.answered} / ${result.total} répondants`}>
      {result.items.length === 0 ? <EmptyLine /> : (
        <ul className="space-y-2">
          {result.items.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                onClick={() => onSelect({ titre: item.label, sousTitre: result.title, gardens: item.gardens })}
                className="group w-full text-left"
              >
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-foreground group-hover:underline">
                    {item.label}
                    {item.legacy && <span className="ml-1 text-[10px] text-muted-foreground">(ancienne réponse)</span>}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.count} · {item.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
};

/** Répartition en vignettes, pour les questions illustrées. */
export const QuestionVignetteCard: React.FC<{
  result: TallyResult;
  onSelect: (s: Selection) => void;
}> = ({ result, onSelect }) => (
  <CardShell titre={result.title} repondants={`${result.answered} / ${result.total} répondants`}>
    {result.items.length === 0 ? <EmptyLine /> : (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {result.items.map((item, i) => {
          const vignette = (item as { vignette?: string | null }).vignette ?? null;
          return (
            <li key={item.value}>
              <button
                type="button"
                onClick={() => onSelect({ titre: item.label, sousTitre: result.title, gardens: item.gardens })}
                className="group w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {vignette ? (
                    <img src={vignette} alt={item.label} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🌿</div>
                  )}
                  <Badge className="absolute left-2 top-2 tabular-nums" variant="secondary">
                    {i + 1}
                  </Badge>
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs font-medium group-hover:underline">{item.label}</p>
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                    {item.count} · {item.pct}%
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </CardShell>
);

/** Répartition chiffrée en tranches, avec médiane. */
export const NumericDistributionCard: React.FC<{
  result: DistributionResult;
  onSelect: (s: Selection) => void;
}> = ({ result, onSelect }) => {
  const max = Math.max(1, ...result.buckets.map((b) => b.count));
  return (
    <CardShell titre={result.title} repondants={`${result.answered} / ${result.total} répondants`}>
      <div className="mb-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {result.median != null ? result.median.toLocaleString('fr-FR') : '—'}
        </span>
        <span className="pb-1 text-xs text-muted-foreground">{result.unit} — valeur médiane</span>
      </div>
      <div className="flex h-28 items-end gap-1.5">
        {result.buckets.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => onSelect({ titre: b.label, sousTitre: result.title, gardens: b.gardens })}
            className="group flex h-full flex-1 flex-col justify-end"
            title={`${b.label} : ${b.count} (${b.pct} %)`}
          >
            <span className="mb-1 text-center text-[10px] tabular-nums text-muted-foreground">{b.count}</span>
            <span
              className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max(4, Math.round((b.count / max) * 100))}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {result.buckets.map((b) => (
          <span key={b.label} className="flex-1 text-center text-[9px] leading-tight text-muted-foreground">
            {b.label}
          </span>
        ))}
      </div>
    </CardShell>
  );
};

export type { Selection };
