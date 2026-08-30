import React from 'react';
import { KeyRound, Plug, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useIotFournisseurs } from '@/hooks/iot/useIot';
import {
  useIotIntegrations,
  useUpsertIotIntegration,
  usePullWeenat,
  useDiscoverWeenat,
  type WeenatCandidate,
} from '@/hooks/iot/useIotIntegrations';
import { fmtHorodatage } from '@/lib/iot/grandeurs';

interface Props {
  proprieteId: string;
}

/**
 * « Raccordements fournisseurs » : une propriété peut porter des sondes de
 * plusieurs fabricants. Brad pousse ses trames vers notre webhook, Weenat
 * demande au contraire d'aller chercher la donnée avec une clé API.
 */
export const ProviderIntegrationsPanel: React.FC<Props> = ({ proprieteId }) => {
  const { data: fournisseurs = [] } = useIotFournisseurs();
  const { data: integrations = [] } = useIotIntegrations(proprieteId);
  const upsert = useUpsertIotIntegration();
  const pull = usePullWeenat(proprieteId);
  const discover = useDiscoverWeenat();

  const [fournisseurId, setFournisseurId] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [plotId, setPlotId] = React.useState('');
  const [actif, setActif] = React.useState(true);
  const [plots, setPlots] = React.useState<WeenatCandidate[] | null>(null);

  const current = integrations.find((i) => i.fournisseur_id === fournisseurId) ?? null;

  React.useEffect(() => {
    if (!fournisseurId) return;
    setApiKey('');
    setLabel(current?.label ?? '');
    setPlotId(current?.external_plot_id ?? '');
    setActif(current?.actif ?? true);
    setPlots(null);
  }, [fournisseurId, current?.id]);

  const save = () =>
    upsert.mutate({
      propriete_id: proprieteId,
      fournisseur_id: fournisseurId,
      api_key: apiKey.trim() || null,
      label: label.trim() || null,
      external_plot_id: plotId.trim() || null,
      actif,
    });

  return (
    <details className="rounded-3xl border border-border bg-card p-4">
      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.24em] text-foreground">
        <Plug className="mr-1 inline h-3 w-3" /> Raccordements fournisseurs ({integrations.length})
      </summary>

      <ul className="mt-3 space-y-1.5 text-[11px] text-foreground">
        {integrations.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{i.fournisseur_nom ?? 'Fournisseur'}</span>
            <span className="text-muted-foreground">{i.label ?? '—'}</span>
            {i.external_plot_id && <span className="text-muted-foreground">parcelle #{i.external_plot_id}</span>}
            <span className="ml-auto text-muted-foreground">
              {i.actif ? 'actif' : 'suspendu'} · {fmtHorodatage(i.last_pull_at)}
              {i.last_pull_status ? ` · ${i.last_pull_status}` : ''}
            </span>
          </li>
        ))}
        {integrations.length === 0 && <li className="italic text-muted-foreground">Aucun compte fournisseur raccordé.</li>}
      </ul>

      <div className="mt-3 grid gap-2 rounded-2xl border border-border bg-background p-3">
        <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-foreground">Fournisseur</Label>
            <select
              value={fournisseurId}
              onChange={(e) => setFournisseurId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">—</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-foreground">Clé API {current ? '(laisser vide pour conserver)' : ''}</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="clé fournie par le fabricant"
              className="bg-background"
            />
          </div>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-foreground">Intitulé du compte</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="LFDV-CDF-DEVIAT" className="bg-background" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-foreground">Parcelle de référence (grandeurs agronomiques)</Label>
            <Input value={plotId} onChange={(e) => setPlotId(e.target.value)} placeholder="122193" className="bg-background" />
          </div>

        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <span className="text-xs text-foreground">Collecte automatique active</span>
          <Switch checked={actif} onCheckedChange={setActif} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!fournisseurId || upsert.isPending} onClick={save}>
            Enregistrer le raccordement
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!current || discover.isPending}
            onClick={() => discover.mutate({ integration_id: current!.id }, { onSuccess: setPlots })}
          >
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${discover.isPending ? 'animate-spin' : ''}`} /> Lister le parc
          </Button>
          <Button size="sm" variant="outline" disabled={pull.isPending} onClick={() => pull.mutate(24)}>
            <Download className={`mr-1 h-3.5 w-3.5 ${pull.isPending ? 'animate-pulse' : ''}`} /> Collecter maintenant
          </Button>
        </div>

        {plots && (
          <ul className="space-y-1 text-[11px]">
            {plots.length === 0 && <li className="italic text-muted-foreground">Aucun appareil ni parcelle sur ce compte.</li>}
            {plots.map((p) => {
              const virtuelle = p.model === 'SMV' || /virtual/i.test(p.model_label ?? '');
              return (
                <li key={`${p.external_kind}-${p.external_id}`}>
                  <button
                    type="button"
                    disabled={p.external_kind !== 'plot'}
                    onClick={() => setPlotId(p.external_id)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-left text-foreground enabled:hover:bg-accent disabled:cursor-default"
                  >

                    <span className="font-medium">
                      {p.external_kind === 'plot' ? '▦ ' : virtuelle ? '☁︎ ' : '⌁ '}
                      {p.nom ?? p.model_label ?? p.serial_number ?? `#${p.external_id}`}
                      {virtuelle ? ' — station météo virtuelle' : ''}
                    </span>
                    <span className="block text-muted-foreground">
                      #{p.external_id} · {p.external_kind === 'plot' ? 'parcelle' : `appareil ${p.serial_number ?? ''}`}
                      {p.metrics?.length ? ` · ${p.metrics.slice(0, 6).join(', ')}` : ''}
                      {p.location_text ? ` · ${p.location_text}` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

      </div>
    </details>
  );
};

export default ProviderIntegrationsPanel;
