import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Satellite } from 'lucide-react';
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
      <DialogContent className="max-w-lg bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))]">
        <DialogHeader>
          <DialogTitle className="font-serif">{capteur ? 'Régler le capteur' : 'Ajouter un capteur'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Nom du capteur</Label>
            <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Sonde Potager d'Été" className="bg-white/70" />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Numéro de série (fournisseur)</Label>
              <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="b26s001" className="bg-white/70" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Type de capteur</Label>
              <select
                value={form.type_id}
                onChange={(e) => setForm({ ...form, type_id: e.target.value })}
                className="h-10 rounded-md border border-input bg-white/70 px-3 text-sm"
              >
                <option value="">—</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.modele} · {t.fournisseur?.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Emplacement (facultatif)</Label>
            <Input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} placeholder="Potager d'été" className="bg-white/70" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Alerte silence après (heures)</Label>
              <Input type="number" min={1} value={form.silence_alert_hours} onChange={(e) => setForm({ ...form, silence_alert_hours: Number(e.target.value) })} className="bg-white/70" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Alerte batterie sous (%)</Label>
              <Input type="number" min={1} max={100} value={form.battery_alert_pct} onChange={(e) => setForm({ ...form, battery_alert_pct: Number(e.target.value) })} className="bg-white/70" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2">
            <span className="text-xs">Capteur en service</span>
            <Switch checked={form.actif} onCheckedChange={(v) => setForm({ ...form, actif: v })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2">
            <span className="text-xs">
              Ouvrir ses mesures en Open Data
              <span className="block text-[10px] opacity-60">Prépare la future API Fréquence du Vivant.</span>
            </span>
            <Switch checked={form.open_data} onCheckedChange={(v) => setForm({ ...form, open_data: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={mut.isPending}>{capteur ? 'Enregistrer' : 'Ajouter'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SensorFormDialog;
