import React from 'react';
import {
  Activity, Eye, FlaskConical, Leaf, Hammer, Footprints, Stethoscope, Radio,
  ExternalLink, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProprieteDashboard, type ModuleStat } from '@/hooks/propriete/useProprieteDashboard';
import ProprieteBiodiversityCards from './ProprieteBiodiversityCards';

interface Props {
  proprieteId: string;
  slug?: string | null;
}

type CardDef = {
  key: keyof ReturnType<typeof keysOf>;
  label: string;
  icon: React.ReactNode;
  accent: string;
  unite: string;
  vide: string;
};

// Astuce de typage : la liste des modules suit exactement les clés du hook.
const keysOf = () => ({
  observations: 0, sol: 0, flore: 0, palette: 0, atelier: 0, tours: 0, clinique: 0, capteurs: 0,
});

const CARDS: CardDef[] = [
  { key: 'observations', label: 'Observations', icon: <Eye className="h-4 w-4" />, accent: 'text-emerald-600 bg-emerald-500/10', unite: 'notes de terrain', vide: 'Aucune observation notée' },
  { key: 'sol', label: 'Analyse du sol', icon: <FlaskConical className="h-4 w-4" />, accent: 'text-amber-600 bg-amber-500/10', unite: 'prélèvements', vide: 'Registre de sol vierge' },
  { key: 'flore', label: 'Identification', icon: <Leaf className="h-4 w-4" />, accent: 'text-lime-600 bg-lime-500/10', unite: 'plantes relevées', vide: 'Aucun diagnostic flore' },
  { key: 'palette', label: 'Palette végétale', icon: <Leaf className="h-4 w-4" />, accent: 'text-teal-600 bg-teal-500/10', unite: 'zones composées', vide: 'Palette non commencée' },
  { key: 'atelier', label: 'Atelier du jardin', icon: <Hammer className="h-4 w-4" />, accent: 'text-orange-600 bg-orange-500/10', unite: 'objets dessinés', vide: 'Aucun ouvrage dessiné' },
  { key: 'tours', label: 'Tour de jardin', icon: <Footprints className="h-4 w-4" />, accent: 'text-sky-600 bg-sky-500/10', unite: 'tours réalisés', vide: 'Aucun tour encore' },
  { key: 'clinique', label: 'Clinique du jardin', icon: <Stethoscope className="h-4 w-4" />, accent: 'text-rose-600 bg-rose-500/10', unite: 'consultations', vide: 'Aucune consultation ouverte' },
  { key: 'capteurs', label: 'Capteurs et sondes', icon: <Radio className="h-4 w-4" />, accent: 'text-indigo-600 bg-indigo-500/10', unite: 'sondes installées', vide: 'Aucune sonde rattachée' },
];

const relative = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jours = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 31) return `il y a ${jours} jours`;
  return `le ${d.toLocaleDateString('fr-FR')}`;
};

/** Carte d'un module : un chiffre lisible de loin, une ligne de contexte. */
const Card: React.FC<{ def: CardDef; stat: ModuleStat; index: number }> = ({ def, stat, index }) => {
  const vivant = stat.count > 0 || !!stat.lastAt;
  return (
    <div
      style={{ animationDelay: `${index * 45}ms` }}
      className={cn(
        'animate-fade-in rounded-2xl border p-4 transition-colors',
        vivant ? 'border-border bg-card hover:bg-muted/40' : 'border-dashed border-border/70 bg-muted/20',
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', def.accent)}>
          {def.icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {def.label}
        </span>
      </div>

      {vivant ? (
        <>
          <p className="mt-3 text-3xl font-semibold leading-none text-foreground tabular-nums">
            {stat.count}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{def.unite}</p>
          <p className="mt-2 text-xs text-foreground/70">
            {stat.detail}
            {stat.detail && relative(stat.lastAt) ? ' · ' : ''}
            {relative(stat.lastAt) ? `dernière trace ${relative(stat.lastAt)}` : ''}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm italic text-muted-foreground/70">{def.vide}</p>
      )}
    </div>
  );
};

/** Tableau de bord lecture seule des modules du jardin, en tête de la fiche admin. */
const ProprieteDashboard: React.FC<Props> = ({ proprieteId, slug }) => {
  const { data, isLoading, error } = useProprieteDashboard(proprieteId);

  const actifs = data ? CARDS.filter((c) => (data[c.key].count > 0 || data[c.key].lastAt)).length : 0;
  const derniere = data
    ? CARDS.map((c) => data[c.key].lastAt).filter(Boolean).sort().slice(-1)[0] ?? null
    : null;

  return (
    <div className="space-y-4">
      <ProprieteBiodiversityCards proprieteId={proprieteId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Lecture des modules…</span>
          ) : error ? (
            <span className="text-destructive">Synthèse indisponible : {(error as Error).message}</span>
          ) : (
            <>
              <span className="font-medium text-foreground">{actifs} module{actifs > 1 ? 's' : ''} sur {CARDS.length}</span>
              {' '}en activité
              {derniere ? <> — dernière trace {relative(derniere)}</> : ' — ce jardin n’a encore rien enregistré'}
            </>
          )}
        </p>
        {slug && (
          <Link
            to={`/propriete/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ouvrir l’espace jardinier
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data
          ? CARDS.map((c) => (
              <div key={c.key} className="h-32 animate-pulse rounded-2xl border border-border/70 bg-muted/30" />
            ))
          : CARDS.map((c, i) => <Card key={c.key} def={c} stat={data[c.key]} index={i} />)}
      </div>
    </div>
  );
};

export const DashboardIcon = Activity;
export default ProprieteDashboard;
