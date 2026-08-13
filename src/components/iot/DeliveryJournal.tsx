import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PaginationControls from '@/components/admin/marche-events/PaginationControls';
import { useDebounce } from '@/hooks/useDebounce';
import { useIotConsole } from '@/components/iot/console/IotConsoleContext';

import {
  TEST_SERIALS,
  useDeliveryFournisseurs,
  useDeliverySerials,
  useTelemetryDeliveriesPaged,
  type DeliveryEtat,
  type TelemetryDelivery,
} from '@/hooks/iot/useIotTelemetry';

/* ── Utilitaires ───────────────────────────────────────────────────────── */

const PARIS = 'Europe/Paris';

const fmtParis = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    timeZone: PARIS, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

const PERIODES: { value: string; label: string; hours: number | null }[] = [
  { value: '24h', label: '24 heures', hours: 24 },
  { value: '7j', label: '7 jours', hours: 24 * 7 },
  { value: '30j', label: '30 jours', hours: 24 * 30 },
  { value: 'all', label: 'Tout', hours: null },
  { value: 'custom', label: 'Plage personnalisée', hours: null },
];

const ETATS: { value: DeliveryEtat; label: string }[] = [
  { value: 'all', label: 'Tous les états' },
  { value: 'avec', label: 'Avec relevé' },
  { value: 'sans', label: 'Sans relevé' },
  { value: 'refusee', label: 'Signature refusée' },
  { value: 'erreur', label: 'Erreur de traitement' },
  { value: 'essai', label: 'Essai fournisseur' },
];

type EtatVisuel = { label: string; dot: string; tone: string };

const etatDe = (d: TelemetryDelivery): EtatVisuel => {
  if (TEST_SERIALS.includes(d.serial_number ?? '')) return { label: 'Essai', dot: 'bg-slate-400', tone: 'text-slate-500' };
  if (d.signature_valid === false) return { label: 'Signature refusée', dot: 'bg-red-500', tone: 'text-red-600' };
  if (d.error) return { label: 'Erreur', dot: 'bg-amber-500', tone: 'text-amber-600' };
  if ((d.mesures_count ?? 0) === 0) return { label: 'Sans relevé', dot: 'bg-amber-400', tone: 'text-amber-600' };
  return { label: 'Avec relevé', dot: 'bg-emerald-500', tone: 'text-emerald-700' };
};

/** Convertit une date locale « yyyy-mm-dd » en ISO (début / fin de journée Paris, approx. UTC+2). */
const jourEnIso = (jour: string, fin: boolean) =>
  jour ? new Date(`${jour}T${fin ? '23:59:59' : '00:00:00'}+02:00`).toISOString() : null;

/* ── Journal ───────────────────────────────────────────────────────────── */

export const DeliveryJournal: React.FC = () => {
  const { capabilities: { rawPayload } } = useIotConsole();

  const [params, setParams] = useSearchParams();

  const periode = params.get('per') ?? '24h';
  const du = params.get('du') ?? '';
  const au = params.get('au') ?? '';
  const fournisseur = params.get('four') ?? '';
  const serial = params.get('sonde') ?? '';
  const etat = (params.get('etat') as DeliveryEtat) ?? 'all';
  const page = Number(params.get('p') ?? 1);
  const pageSize = Number(params.get('ps') ?? 20);

  const [recherche, setRecherche] = React.useState(params.get('q') ?? '');
  const q = useDebounce(recherche, 350);

  const patch = React.useCallback(
    (next: Record<string, string | number | null>, resetPage = true) => {
      const p = new URLSearchParams(params);
      Object.entries(next).forEach(([k, v]) => {
        if (v === null || v === '' ) p.delete(k);
        else p.set(k, String(v));
      });
      if (resetPage) p.delete('p');
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  React.useEffect(() => {
    const actuel = params.get('q') ?? '';
    if (q !== actuel) patch({ q: q || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const { since, until } = React.useMemo(() => {
    if (periode === 'custom') return { since: jourEnIso(du, false), until: jourEnIso(au, true) };
    const h = PERIODES.find((p) => p.value === periode)?.hours ?? null;
    return { since: h ? new Date(Date.now() - h * 3_600_000).toISOString() : null, until: null };
  }, [periode, du, au]);

  const filtres = { since, until, fournisseur, serial, etat, q, page, pageSize };
  const { data, isFetching } = useTelemetryDeliveriesPaged(filtres);
  const { data: fournisseurs = [] } = useDeliveryFournisseurs();
  const { data: serials = [] } = useDeliverySerials();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const [open, setOpen] = React.useState<string | null>(null);

  const actifs =
    (periode !== '24h' ? 1 : 0) + (fournisseur ? 1 : 0) + (serial ? 1 : 0) + (etat !== 'all' ? 1 : 0) + (q ? 1 : 0);

  const reinitialiser = () => {
    setRecherche('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">
          Journal des livraisons · {total} sur la période
        </h3>
        {actifs > 0 && <Badge variant="secondary">{actifs} filtre{actifs > 1 ? 's' : ''}</Badge>}
        {isFetching && <span className="text-xs text-muted-foreground">actualisation…</span>}
        {actifs > 0 && (
          <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={reinitialiser}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Select value={periode} onValueChange={(v) => patch({ per: v === '24h' ? null : v })}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {periode === 'custom' && (
          <>
            <Input type="date" className="h-9 w-[150px]" value={du} onChange={(e) => patch({ du: e.target.value })} aria-label="Du" />
            <Input type="date" className="h-9 w-[150px]" value={au} onChange={(e) => patch({ au: e.target.value })} aria-label="Au" />
          </>
        )}

        <Select value={fournisseur || 'all'} onValueChange={(v) => patch({ four: v === 'all' ? null : v })}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Fournisseur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            {fournisseurs.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={serial || 'all'} onValueChange={(v) => patch({ sonde: v === 'all' ? null : v })}>
          <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Sonde" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sondes</SelectItem>
            {serials.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={etat} onValueChange={(v) => patch({ etat: v === 'all' ? null : v })}>
          <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ETATS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder="N° de série, identifiant de livraison, erreur…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((d) => {
          const e = etatDe(d);
          return (
            <div key={d.id} className="text-sm">
              <button
                onClick={() => rawPayload && setOpen(open === d.id ? null : d.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left ${rawPayload ? 'hover:bg-muted/40' : 'cursor-default'}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${e.dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{d.serial_number ?? 'sonde inconnue'}</span>
                  <span className={`ml-2 text-xs ${e.tone}`}>{e.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {fmtParis(d.created_at)} · {d.fournisseur} · {d.mesures_count ?? 0} mesure{(d.mesures_count ?? 0) > 1 ? 's' : ''}
                    {d.error ? ` · ${d.error}` : ''}
                  </span>
                </span>
                {rawPayload && (
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${open === d.id ? 'rotate-180' : ''}`} />
                )}
              </button>
              {rawPayload && open === d.id && (
                <pre className="max-h-72 overflow-auto border-t border-border bg-muted/30 px-3 py-2 text-[11px] leading-relaxed">
                  {JSON.stringify({ delivery_id: d.delivery_id, event: d.event, signature_valid: d.signature_valid, payload: d.payload }, null, 2)}
                </pre>
              )}
            </div>

          );
        })}
        {rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Aucune livraison ne correspond à ces filtres.</p>
        )}
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => patch({ p: p > 1 ? p : null }, false)}
        onPageSizeChange={(s) => patch({ ps: s === 20 ? null : s })}
      />
    </section>
  );
};

export default DeliveryJournal;
