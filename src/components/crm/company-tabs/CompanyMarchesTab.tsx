import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Plus, Calendar, MapPin, Trash2, ExternalLink, Sparkles, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCompanyMarches,
  useUpdateCompanyMarcheLink,
  useCreateMarcheEvent,
  type CompanyMarcheRow,
} from '@/hooks/useCompanyMarches';
import { useLinkCompanyEvent, useUnlinkCompanyEvent, RELATION_TYPES } from '@/hooks/useCrmCompanyEvents';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props {
  companyId: string;
}

export const CompanyMarchesTab: React.FC<Props> = ({ companyId }) => {
  const { data: rows = [], isLoading } = useCompanyMarches(companyId);
  const unlink = useUnlinkCompanyEvent();
  const updateLink = useUpdateCompanyMarcheLink();
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Split past / upcoming
  const sorted = [...rows].sort((a, b) => {
    const da = a.event?.date_marche ? new Date(a.event.date_marche).getTime() : 0;
    const db = b.event?.date_marche ? new Date(b.event.date_marche).getTime() : 0;
    return db - da;
  });
  const now = Date.now();
  const upcoming = sorted.filter((r) => r.event?.date_marche && new Date(r.event.date_marche).getTime() >= now);
  const past = sorted.filter((r) => !r.event?.date_marche || new Date(r.event.date_marche!).getTime() < now);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setLinkOpen(true)}
          className="rounded-xl border bg-card/70 backdrop-blur-sm px-3 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <Link2 className="h-4 w-4" /> Lier une marche
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setCreateOpen(true)}
          className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent px-3 py-3 flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/60 hover:shadow-[0_0_25px_-10px_rgb(16,185,129)] transition-all"
        >
          <Sparkles className="h-4 w-4" /> Nouvelle marche
        </motion.button>
      </div>

      {isLoading && <div className="text-center py-8 text-sm text-muted-foreground">Chargement…</div>}

      {!isLoading && rows.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed bg-muted/20">
          <Footprints className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucune marche associée.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Liez ou créez la première marche.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="relative pl-6">
          {/* Vertical gradient line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-400/40 to-amber-500/60 rounded-full" />

          {upcoming.length > 0 && (
            <>
              <h4 className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-2 ml-1">À venir</h4>
              <div className="space-y-3 mb-5">
                <AnimatePresence mode="popLayout">
                  {upcoming.map((r) => (
                    <TimelineCard
                      key={r.link_id}
                      row={r}
                      upcoming
                      onUnlink={() => { if (confirm('Délier cette marche ?')) unlink.mutate(r.link_id); }}
                      onUpdateRelation={(rt) => updateLink.mutate({ id: r.link_id, patch: { relation_type: rt } })}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h4 className="text-[11px] uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 font-semibold mb-2 ml-1">Passées</h4>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {past.map((r) => (
                    <TimelineCard
                      key={r.link_id}
                      row={r}
                      upcoming={false}
                      onUnlink={() => { if (confirm('Délier cette marche ?')) unlink.mutate(r.link_id); }}
                      onUpdateRelation={(rt) => updateLink.mutate({ id: r.link_id, patch: { relation_type: rt } })}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      )}

      <LinkMarcheDialog open={linkOpen} onOpenChange={setLinkOpen} companyId={companyId} alreadyLinked={rows.map(r => r.event?.id).filter(Boolean) as string[]} />
      <QuickCreateMarcheDialog open={createOpen} onOpenChange={setCreateOpen} companyId={companyId} />
    </div>
  );
};

const TimelineCard: React.FC<{
  row: CompanyMarcheRow;
  upcoming: boolean;
  onUnlink: () => void;
  onUpdateRelation: (rt: string) => void;
}> = ({ row, upcoming, onUnlink, onUpdateRelation }) => {
  const ev = row.event;
  if (!ev) return null;
  const date = ev.date_marche ? new Date(ev.date_marche) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className="relative"
    >
      {/* Marker */}
      <div className={cn(
        'absolute -left-[1.05rem] top-3 h-3.5 w-3.5 rounded-full ring-4 ring-background',
        upcoming
          ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgb(16,185,129)]'
          : 'bg-amber-500/80'
      )} />

      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all">
        <div className="flex">
          {ev.cover_image_url && (
            <div className="w-20 sm:w-28 shrink-0 bg-muted overflow-hidden">
              <img src={ev.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="flex-1 p-3 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm leading-tight line-clamp-2">{ev.title}</h4>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onUnlink}
                title="Délier"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
              {ev.lieu && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ev.lieu}
                </span>
              )}
              {ev.event_type && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{ev.event_type}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Select value={row.relation_type} onValueChange={onUpdateRelation}>
                <SelectTrigger className="h-7 w-auto min-w-[120px] text-[11px] border-dashed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <a
                href={`/admin/marche-events/${ev.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Voir la fiche <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===== Link existing marche =====
const LinkMarcheDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  alreadyLinked: string[];
}> = ({ open, onOpenChange, companyId, alreadyLinked }) => {
  const link = useLinkCompanyEvent();
  const [search, setSearch] = React.useState('');
  const [relationType, setRelationType] = React.useState('participant');

  const { data: events = [] } = useQuery({
    queryKey: ['marche-events-picker', search],
    queryFn: async () => {
      let q = supabase.from('marche_events').select('id, title, date_marche, lieu').order('date_marche', { ascending: false, nullsFirst: false }).limit(50);
      if (search.trim()) q = q.ilike('title', `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const filtered = events.filter((e: any) => !alreadyLinked.includes(e.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lier une marche existante</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Rechercher par titre…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div>
            <Label className="text-xs text-muted-foreground">Type de relation</Label>
            <Select value={relationType} onValueChange={setRelationType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELATION_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1.5 -mx-1 px-1">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune marche disponible.</p>}
            {filtered.map((e: any) => (
              <button
                key={e.id}
                className="w-full text-left p-2.5 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                onClick={() => link.mutate(
                  { company_id: companyId, event_id: e.id, relation_type: relationType },
                  { onSuccess: () => onOpenChange(false) }
                )}
              >
                <p className="font-medium text-sm">{e.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {e.date_marche ? new Date(e.date_marche).toLocaleDateString('fr-FR') : 'Sans date'}
                  {e.lieu ? ` · ${e.lieu}` : ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ===== Quick create marche =====
const QuickCreateMarcheDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
}> = ({ open, onOpenChange, companyId }) => {
  const create = useCreateMarcheEvent();
  const link = useLinkCompanyEvent();
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [lieu, setLieu] = React.useState('');
  const [relationType, setRelationType] = React.useState('organisateur');

  React.useEffect(() => {
    if (!open) { setTitle(''); setDate(''); setLieu(''); setRelationType('organisateur'); }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) return;
    const ev = await create.mutateAsync({ title: title.trim(), date_marche: date || null, lieu: lieu || null });
    await link.mutateAsync({ company_id: companyId, event_id: ev.id, relation_type: relationType });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle marche</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Titre *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Marche du Vivant en Dordogne…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Lieu</Label>
              <Input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Sarlat" />
            </div>
          </div>
          <div>
            <Label>Relation</Label>
            <Select value={relationType} onValueChange={setRelationType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELATION_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!title.trim() || create.isPending || link.isPending}>Créer & lier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
