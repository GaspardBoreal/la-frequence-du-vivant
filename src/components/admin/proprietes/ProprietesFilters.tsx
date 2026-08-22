import React, { useEffect, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProprietesFilterValues } from './types';
import { DEFAULT_FILTERS } from './types';

interface Props {
  values: ProprietesFilterValues;
  onChange: (v: ProprietesFilterValues) => void;
  regions: string[];
  departements: string[];
  entreprises: { id: string; nom: string }[];
}

const ProprietesFilters: React.FC<Props> = ({ values, onChange, regions, departements, entreprises }) => {
  const [q, setQ] = useState(values.q);

  // Resynchronise le champ quand l'URL change (retour navigateur, KPI…)
  useEffect(() => setQ(values.q), [values.q]);

  // Recherche débouncée pour ne pas multiplier les requêtes
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (q !== values.q) onChange({ ...values, q });
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const set = <K extends keyof ProprietesFilterValues>(k: K, v: ProprietesFilterValues[K]) =>
    onChange({ ...values, [k]: v });

  const isDirty = JSON.stringify({ ...values, q: values.q }) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un nom, une ville, un code postal…"
            className="pl-9"
          />
        </div>
        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ('');
              onChange(DEFAULT_FILTERS);
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Select value={values.statut} onValueChange={(v) => set('statut', v as ProprietesFilterValues['statut'])}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="actives">Actives</SelectItem>
            <SelectItem value="archivees">Archivées</SelectItem>
          </SelectContent>
        </Select>

        <Select value={values.region} onValueChange={(v) => set('region', v)}>
          <SelectTrigger><SelectValue placeholder="Région" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes régions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.dept} onValueChange={(v) => set('dept', v)}>
          <SelectTrigger><SelectValue placeholder="Département" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous départements</SelectItem>
            {departements.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.entreprise} onValueChange={(v) => set('entreprise', v)}>
          <SelectTrigger><SelectValue placeholder="Entreprise" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes entreprises</SelectItem>
            {entreprises.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.gps} onValueChange={(v) => set('gps', v as ProprietesFilterValues['gps'])}>
          <SelectTrigger><SelectValue placeholder="GPS" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">GPS : toutes</SelectItem>
            <SelectItem value="avec">Géolocalisées</SelectItem>
            <SelectItem value="sans">Sans coordonnées GPS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={values.sondes} onValueChange={(v) => set('sondes', v as ProprietesFilterValues['sondes'])}>
          <SelectTrigger><SelectValue placeholder="Sondes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sondes : toutes</SelectItem>
            <SelectItem value="avec">Avec sondes IoT</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProprietesFilters;
