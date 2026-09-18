import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, BookOpen, Globe, MessageSquare, Download, AlertTriangle } from 'lucide-react';
import { useKbCoverage, useImportKbSeed, useKbSeedCount } from '@/hooks/admin/useKnowledge';

const FAMILLE_ICON: Record<string, React.ElementType> = {
  Terrain: Database,
  Savoir: BookOpen,
  Public: Globe,
  Usage: MessageSquare,
};

/** Savoirs qui n'existent nulle part aujourd'hui : à écrire. */
const MANQUES = [
  { titre: 'Arrosage', detail: 'Quand, combien, selon la texture du sol et la saison.' },
  { titre: 'Taille et conduite', detail: 'Arbres, arbustes, haies : périodes et gestes.' },
  { titre: 'Semis et calendrier', detail: 'Ce qui se sème, se plante et se récolte, mois par mois.' },
  { titre: 'Compost et amendements', detail: 'Fabriquer, doser, corriger sans surcharger.' },
  { titre: 'Entretien saison par saison', detail: 'Le carnet des gestes attendus à chaque saison.' },
  { titre: 'Compte et données personnelles', detail: 'Inscription, partage du jardin, effacement des données.' },
];

const etat = (v: number) =>
  v === 0
    ? { label: 'Absente', cls: 'bg-destructive/12 text-destructive border-destructive/30' }
    : v < 20
      ? { label: 'Partielle', cls: 'bg-amber-500/12 text-amber-700 border-amber-500/30' }
      : { label: 'Présente', cls: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/30' };

const KbCartographie: React.FC = () => {
  const { data, isLoading } = useKbCoverage();
  const importer = useImportKbSeed();
  const seedCount = useKbSeedCount();

  const familles = React.useMemo(() => {
    const map = new Map<string, typeof data extends undefined ? never : any[]>();
    (data?.sources ?? []).forEach((s) => {
      const arr = map.get(s.famille) ?? [];
      arr.push(s);
      map.set(s.famille, arr);
    });
    return [...map.entries()];
  }, [data]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Lecture de l’état des sources…</p>;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Reprendre les savoirs déjà écrits dans le site</h3>
          <p className="text-sm text-muted-foreground">
            {seedCount} fiches sont reconstituées à l’identique depuis les pages publiques, les méthodes de sol, la
            table des plantes, les fiches d’ouvrages, les inspirations et le nuancier. Elles arrivent en « à relire ».
          </p>
        </div>
        <Button onClick={() => importer.mutate()} disabled={importer.isPending} className="shrink-0">
          <Download className="mr-2 h-4 w-4" />
          {importer.isPending ? 'Import en cours…' : 'Importer'}
        </Button>
      </Card>

      {familles.map(([famille, sources]) => {
        const Icon = FAMILLE_ICON[famille] ?? Database;
        return (
          <div key={famille}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{famille}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(sources as any[]).map((s) => {
                const e = etat(s.volume);
                return (
                  <Card key={s.cle} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{s.libelle}</p>
                      <Badge variant="outline" className={e.cls}>{e.label}</Badge>
                    </div>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">{s.volume.toLocaleString('fr-FR')}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Savoirs à écrire</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MANQUES.map((m) => (
            <Card key={m.titre} className="border-dashed p-4">
              <p className="text-sm font-medium">{m.titre}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KbCartographie;
