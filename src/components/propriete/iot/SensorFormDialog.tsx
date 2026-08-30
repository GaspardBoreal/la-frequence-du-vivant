import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Satellite } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIotTypes, useCapteurMutation, type IotCapteur } from '@/hooks/iot/useIot';
import { useDiscoverWeenat, useIotIntegrations, type WeenatCandidate } from '@/hooks/iot/useIotIntegrations';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  proprieteId: string;
  capteur?: IotCapteur | null;
}

/** Déclaration ou réglage d'un capteur sur la propriété, tous fournisseurs confondus. */
export const SensorFormDialog: React.FC<Props> = ({ open, onOpenChange, proprieteId, capteur }) => {
  const { data: types = [] } = useIotTypes();
  const mut = useCapteurMutation(proprieteId);
  const { data: integrations = [] } = useIotIntegrations(proprieteId);
  const discover = useDiscoverWeenat();
  const [candidates, setCandidates] = React.useState<WeenatCandidate[] | null>(null);

  const [form, setForm] = React.useState({
    nom: '',
    serial_number: '',
    type_id: '',
    emplacement: '',
    external_id: '',
    external_kind: 'device',
    silence_alert_hours: 6,
    battery_alert_pct: 25,
    actif: true,
    open_data: false,
    notes: '',
  });

  React.useEffect(() => {
    if (!open) return;
    setCandidates(null);
    setForm({
      nom: capteur?.nom ?? '',
      serial_number: capteur?.serial_number ?? '',
      type_id: capteur?.type_id ?? types[0]?.id ?? '',
      emplacement: capteur?.emplacement ?? '',
      external_id: capteur?.external_id ?? '',
      external_kind: capteur?.external_kind ?? 'device',
      silence_alert_hours: capteur?.silence_alert_hours ?? 6,
      battery_alert_pct: capteur?.battery_alert_pct ?? 25,
      actif: capteur?.actif ?? true,
      open_data: capteur?.open_data ?? false,
      notes: capteur?.notes ?? '',
    });
  }, [open, capteur, types]);

  const selectedType = types.find((t) => t.id === form.type_id) ?? null;
  const fournisseurNom = selectedType?.fournisseur?.nom ?? '';
  const isWeenat = /weenat/i.test(fournisseurNom);
  const weenatIntegration = integrations.find(
    (i) => i.propriete_id === proprieteId && i.fournisseur_id === selectedType?.fournisseur_id,
  );

  /** Regroupe les types par fournisseur pour un select lisible. */
  const typesByFournisseur = React.useMemo(() => {
    const map = new Map<string, typeof types>();
    for (const t of types) {
      const key = t.fournisseur?.nom ?? 'Autre';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [types]);

  /** Reprend l'identité du capteur telle que Weenat la déclare. */
  const applyCandidate = (c: WeenatCandidate) => {
    setForm((f) => ({
      ...f,
      nom: f.nom || c.nom || c.model_label || c.serial_number || `Capteur ${c.external_id}`,
      serial_number: c.serial_number || `${c.external_kind}-${c.external_id}`,
      external_id: c.external_id,
      external_kind: c.external_kind,
    }));
    setCandidates(null);
  };

  const submit = () => {
    if (!form.nom.trim() || !form.serial_number.trim() || !form.type_id) return;
    const values = {
      ...form,
      nom: form.nom.trim(),
      serial_number: form.serial_number.trim(),
      emplacement: form.emplacement.trim() || null,
      notes: form.notes.trim() || null,
      external_id: form.external_id.trim() || null,
      external_kind: form.external_id.trim() ? form.external_kind : null,
    };
    mut.mutate(
      capteur ? { action: 'update', id: capteur.id, values } : { action: 'create', values },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{capteur ? 'Régler le capteur' : 'Ajouter un capteur'}</DialogTitle>
        {selectedType?.description && (
          <p className="text-xs text-muted-foreground">{selectedType.description}</p>
        )}
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="sensor-name" className="text-xs">Nom du capteur</Label>
            <Input
              id="sensor-name"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Sonde Potager d'Été"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="sensor-serial" className="text-xs">Numéro de série (fournisseur)</Label>
              <Input
                id="sensor-serial"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="b26s001"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sensor-type" className="text-xs">Type de capteur</Label>
              <Select
                value={form.type_id}
                onValueChange={(value) => setForm({ ...form, type_id: value })}
              >
                <SelectTrigger id="sensor-type" className="w-full">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent className="z-[1300]">
                  {typesByFournisseur.map(([fournisseur, group]) => (
                    <React.Fragment key={fournisseur}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {fournisseur}
                      </div>
                      {group.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-sm">
                          {t.modele}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isWeenat && (
            <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Satellite className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Rattachement au compte Weenat</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!weenatIntegration || discover.isPending}
                  onClick={() =>
                    discover.mutate(
                      { integration_id: weenatIntegration!.id },
                      { onSuccess: (list) => setCandidates(list) },
                    )
                  }
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${discover.isPending ? 'animate-spin' : ''}`} />
                  Découvrir
                </Button>
              </div>

              {!weenatIntegration && (
                <p className="text-xs text-muted-foreground">
                  Aucune clé Weenat n’est encore raccordée à cette propriété : enregistrez-la d’abord dans
                  {' '}« Capteurs et sondes › Raccordements fournisseurs ».
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="weenat-id" className="text-xs">Identifiant Weenat</Label>
                  <Input
                    id="weenat-id"
                    value={form.external_id}
                    onChange={(e) => setForm({ ...form, external_id: e.target.value })}
                    placeholder="11709"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="weenat-kind" className="text-xs">Nature</Label>
                  <Select
                    value={form.external_kind}
                    onValueChange={(value) => setForm({ ...form, external_kind: value })}
                  >
                    <SelectTrigger id="weenat-kind" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[1300]">
                      <SelectItem value="device">Sonde physique</SelectItem>
                      <SelectItem value="plot">Parcelle (station météo virtuelle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {candidates && (
                <ul className="max-h-52 space-y-1 overflow-auto rounded-lg border border-border bg-background p-1">
                  {candidates.length === 0 && (
                    <li className="px-2 py-1.5 text-xs italic text-muted-foreground">
                      Aucun appareil ni parcelle sur ce compte.
                    </li>
                  )}
                  {candidates.map((c) => (
                    <li key={`${c.external_kind}-${c.external_id}`}>
                      <button
                        type="button"
                        onClick={() => applyCandidate(c)}
                        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="font-medium">
                          {c.external_kind === 'plot' ? '☁︎ ' : '⌁ '}
                          {c.nom || c.model_label || c.serial_number}
                        </span>
                        <span className="block text-muted-foreground">
                          #{c.external_id} · {(c.metrics ?? []).slice(0, 5).join(', ') || 'aucune mesure déclarée'}
                          {c.location_text ? ` · ${c.location_text}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="sensor-place" className="text-xs">Emplacement (facultatif)</Label>
            <Input
              id="sensor-place"
              value={form.emplacement}
              onChange={(e) => setForm({ ...form, emplacement: e.target.value })}
              placeholder="Potager d'été"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="silence-hours" className="text-xs">Alerte silence après (heures)</Label>
              <Input
                id="silence-hours"
                type="number"
                min={1}
                value={form.silence_alert_hours}
                onChange={(e) => setForm({ ...form, silence_alert_hours: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="battery-pct" className="text-xs">Alerte batterie sous (%)</Label>
              <Input
                id="battery-pct"
                type="number"
                min={1}
                max={100}
                value={form.battery_alert_pct}
                onChange={(e) => setForm({ ...form, battery_alert_pct: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-xs">Capteur en service</span>
            <Switch checked={form.actif} onCheckedChange={(v) => setForm({ ...form, actif: v })} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-xs">
              Ouvrir ses mesures en Open Data
              <span className="block text-[10px] text-muted-foreground">Prépare la future API Fréquence du Vivant.</span>
            </span>
            <Switch checked={form.open_data} onCheckedChange={(v) => setForm({ ...form, open_data: v })} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {capteur ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SensorFormDialog;
