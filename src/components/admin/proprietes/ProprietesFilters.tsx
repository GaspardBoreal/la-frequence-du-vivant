import React, { useEffect, useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, RotateCcw, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { ProprietesFilterValues } from './types';
import { DEFAULT_FILTERS } from './types';

const toDate = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return isValid(d) ? d : undefined;
};

const DatePick: React.FC<{
  value: string;
  onChange: (iso: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
      >
        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{value ? format(parseISO(value), 'dd MMM yyyy', { locale: fr }) : placeholder}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        locale={fr}
        selected={toDate(value)}
        onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
        initialFocus
        className={cn('p-3 pointer-events-auto')}
      />
    </PopoverContent>
  </Popover>
);

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

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <Select value={values.statut} onValueChange={(v) => set('statut', v as ProprietesFilterValues['statut'])}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="actives">Actives</SelectItem>
            <SelectItem value="archivees">Archivées</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={values.region}
          onValueChange={(v) => {
            const deptStillValid =
              values.dept === 'all' || v === 'all' || regionLabelFromDepartement(values.dept) === v;
            onChange({ ...values, region: v, dept: deptStillValid ? values.dept : 'all' });
          }}
        >
          <SelectTrigger><SelectValue placeholder="Région" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Toutes régions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.dept} onValueChange={(v) => set('dept', v)}>
          <SelectTrigger><SelectValue placeholder="Département" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Tous départements</SelectItem>
            {visibleDepartements.map((d) => (
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

        <Select value={values.periode} onValueChange={(v) => set('periode', v as ProprietesFilterValues['periode'])}>
          <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Création : tout</SelectItem>
            <SelectItem value="aujourdhui">Aujourd'hui</SelectItem>
            <SelectItem value="hier">Hier</SelectItem>
            <SelectItem value="7j">7 derniers jours</SelectItem>
            <SelectItem value="mois">Mois en cours</SelectItem>
            <SelectItem value="trimestre">Trimestre en cours</SelectItem>
            <SelectItem value="annee">Année en cours</SelectItem>
            <SelectItem value="plage">Plage personnalisée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {values.periode === 'plage' && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-md">
          <DatePick value={values.du} onChange={(iso) => set('du', iso)} placeholder="Du…" />
          <DatePick value={values.au} onChange={(iso) => set('au', iso)} placeholder="Au…" />
        </div>
      )}
    </div>
  );
};

export default ProprietesFilters;
