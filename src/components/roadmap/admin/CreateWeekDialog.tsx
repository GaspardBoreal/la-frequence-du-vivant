import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useRoadmapAdmin } from '@/hooks/roadmap/useRoadmap';
import { isoWeekInfo, isoWeeksBetween, type IsoWeekRef, type RoadmapWeek } from '@/lib/roadmap/types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: RoadmapWeek[];
  onCreated: (weekId: string) => void;
}

const DateField: React.FC<{ value?: Date; onChange: (d?: Date) => void; label: string }> = ({
  value,
  onChange,
  label,
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, 'd MMMM yyyy', { locale: fr }) : label}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={value}
        onSelect={onChange}
        initialFocus
        locale={fr}
        className={cn('p-3 pointer-events-auto')}
      />
    </PopoverContent>
  </Popover>
);

/** Créer une édition à une date choisie, ou reconstituer toute une période. */
const CreateWeekDialog: React.FC<Props> = ({ open, onOpenChange, existing, onCreated }) => {
  const { upsertWeek } = useRoadmapAdmin();
  const [single, setSingle] = React.useState<Date | undefined>();
  const [from, setFrom] = React.useState<Date | undefined>();
  const [to, setTo] = React.useState<Date | undefined>();
  const [busy, setBusy] = React.useState(false);

  const exists = (w: IsoWeekRef) =>
    existing.find((e) => e.iso_year === w.isoYear && e.iso_week === w.isoWeek);

  const singleInfo = single ? isoWeekInfo(single) : null;
  const periodWeeks = from && to ? isoWeeksBetween(from, to) : [];
  const missing = periodWeeks.filter((w) => !exists(w));

  const create = async (w: IsoWeekRef) =>
    upsertWeek.mutateAsync({
      iso_year: w.isoYear,
      iso_week: w.isoWeek,
      starts_on: w.startsOn,
      ends_on: w.endsOn,
      title: `Semaine ${w.isoWeek}`,
      status: 'draft',
    });

  const submitSingle = async () => {
    if (!singleInfo) return;
    const already = exists(singleInfo);
    if (already) {
      onCreated(already.id);
      onOpenChange(false);
      toast.info('Cette édition existait déjà : elle est sélectionnée.');
      return;
    }
    setBusy(true);
    try {
      const created = await create(singleInfo);
      onCreated(created.id);
      onOpenChange(false);
      toast.success(`Semaine ${singleInfo.isoWeek} créée en brouillon`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Création impossible');
    } finally {
      setBusy(false);
    }
  };

  const submitPeriod = async () => {
    if (missing.length === 0) return;
    setBusy(true);
    let lastId: string | null = null;
    let ok = 0;
    try {
      for (const w of missing) {
        const created = await create(w);
        lastId = created.id;
        ok += 1;
      }
      if (lastId) onCreated(lastId);
      onOpenChange(false);
      toast.success(
        `${ok} semaine${ok > 1 ? 's' : ''} créée${ok > 1 ? 's' : ''} en brouillon` +
          (periodWeeks.length - missing.length > 0
            ? ` · ${periodWeeks.length - missing.length} déjà existante(s) ignorée(s)`
            : ''),
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Génération interrompue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une édition</DialogTitle>
          <DialogDescription>
            Les éditions sont créées en brouillon : rien n’apparaît en public tant que vous ne les
            publiez pas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="une">
          <TabsList className="w-full">
            <TabsTrigger value="une" className="flex-1">
              Une semaine
            </TabsTrigger>
            <TabsTrigger value="periode" className="flex-1">
              Période
            </TabsTrigger>
          </TabsList>

          <TabsContent value="une" className="space-y-4 pt-4">
            <DateField value={single} onChange={setSingle} label="Choisir une date" />
            {singleInfo && (
              <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Semaine <strong className="text-foreground">{singleInfo.isoWeek}</strong> ·{' '}
                {singleInfo.isoYear} — {format(new Date(singleInfo.startsOn), 'd MMM', { locale: fr })}{' '}
                → {format(new Date(singleInfo.endsOn), 'd MMM', { locale: fr })}
                {exists(singleInfo) && ' · déjà créée'}
              </p>
            )}
            <Button className="w-full" onClick={submitSingle} disabled={!singleInfo || busy}>
              <Plus className="mr-2 h-4 w-4" />
              {exists(singleInfo ?? ({} as IsoWeekRef)) ? 'Ouvrir cette édition' : 'Créer'}
            </Button>
          </TabsContent>

          <TabsContent value="periode" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <DateField value={from} onChange={setFrom} label="Du…" />
              <DateField value={to} onChange={setTo} label="Au…" />
            </div>
            {periodWeeks.length > 0 && (
              <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <strong className="text-foreground">{missing.length}</strong> semaine
                {missing.length > 1 ? 's' : ''} à créer
                {periodWeeks.length - missing.length > 0 &&
                  ` · ${periodWeeks.length - missing.length} déjà existante(s)`}
              </p>
            )}
            <Button
              className="w-full"
              onClick={submitPeriod}
              disabled={missing.length === 0 || busy}
            >
              <Layers className="mr-2 h-4 w-4" />
              {busy ? 'Génération…' : 'Générer les semaines'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWeekDialog;
