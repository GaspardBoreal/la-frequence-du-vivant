import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio, Plus, Pencil, Trash2, Globe, Building2, Cpu, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useIotFournisseurs, useIotTypes, useFournisseurMutation, useTypeMutation,
  type IotFournisseur, type IotTypeCapteur,
} from '@/hooks/iot/useIot';
import { GRANDEURS } from '@/lib/iot/grandeurs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TelemetryControl from '@/components/iot/TelemetryControl';
import SensorsMapTab from '@/components/iot/SensorsMapTab';
import IotChatBotMount from '@/components/iot/chatbot/IotChatBotMount';
import IotPartnersTab from '@/components/iot/IotPartnersTab';

const FAMILLES = ['sol', 'meteo', 'eau', 'air', 'autre'];

/** Administration du catalogue IoT : fournisseurs et types de capteurs. */
const AdminIot: React.FC = () => {
  const { data: fournisseurs = [] } = useIotFournisseurs();
  const { data: types = [] } = useIotTypes();
  const fMut = useFournisseurMutation();
  const tMut = useTypeMutation();

  const [fDraft, setFDraft] = React.useState<Partial<IotFournisseur> | null>(null);
  const [tDraft, setTDraft] = React.useState<Partial<IotTypeCapteur> | null>(null);
  const [confirm, setConfirm] = React.useState<{ kind: 'f' | 't'; id: string; nom: string } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-emerald-950 text-emerald-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm" className="border-emerald-400/30 bg-transparent text-emerald-200 hover:bg-emerald-800">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour Admin
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Radio className="h-4 w-4 text-emerald-300" /> Objets connectés · catalogue
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <Tabs defaultValue="telemetrie">
          <TabsList className="mb-4">
            <TabsTrigger value="telemetrie">Poste de contrôle</TabsTrigger>
            <TabsTrigger value="carte">Carte des sondes</TabsTrigger>
            <TabsTrigger value="partenaires">Partenaires</TabsTrigger>
            <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          </TabsList>

          <TabsContent value="telemetrie">
            <TelemetryControl />
          </TabsContent>

          <TabsContent value="carte">
            <SensorsMapTab />
          </TabsContent>

          <TabsContent value="partenaires">
            <IotPartnersTab />
          </TabsContent>

          <TabsContent value="catalogue" className="space-y-8">
        {/* Fournisseurs */}
        <section>
          <header className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-lg font-semibold">Fournisseurs · {fournisseurs.length}</h2>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setFDraft({ nom: '', website: '', pays: 'France' })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
            </Button>
          </header>

          {fDraft && (
            <div className="mb-3 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-4">
              <div className="grid gap-1">
                <Label className="text-xs">Nom</Label>
                <Input value={fDraft.nom ?? ''} onChange={(e) => setFDraft({ ...fDraft, nom: e.target.value })} />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label className="text-xs">Site web</Label>
                <Input value={fDraft.website ?? ''} onChange={(e) => setFDraft({ ...fDraft, website: e.target.value })} placeholder="https://…" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Pays</Label>
                <Input value={fDraft.pays ?? ''} onChange={(e) => setFDraft({ ...fDraft, pays: e.target.value })} />
              </div>
              <div className="flex gap-2 sm:col-span-4">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!fDraft.nom?.trim()) return;
                    const values = { nom: fDraft.nom.trim(), website: fDraft.website || null, pays: fDraft.pays || null };
                    fMut.mutate(fDraft.id ? { action: 'update', id: fDraft.id, values } : { action: 'create', values });
                    setFDraft(null);
                  }}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFDraft(null)}>
                  <X className="mr-1 h-3.5 w-3.5" /> Annuler
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {fournisseurs.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.nom}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {f.pays ?? '—'}
                    {f.website && (
                      <a href={f.website} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                        <Globe className="h-3 w-3" /> site
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => setFDraft(f)} className="p-1 opacity-60 hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setConfirm({ kind: 'f', id: f.id, nom: f.nom })} className="p-1 text-red-600/70 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Types de capteurs */}
        <section>
          <header className="mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-600" />
            <h2 className="text-lg font-semibold">Types de capteurs · {types.length}</h2>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => setTDraft({ modele: '', famille: 'sol', fournisseur_id: fournisseurs[0]?.id, profondeurs_m: [], grandeurs: ['soil_moisture'] })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
            </Button>
          </header>

          {tDraft && (
            <div className="mb-3 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-xs">Modèle</Label>
                <Input value={tDraft.modele ?? ''} onChange={(e) => setTDraft({ ...tDraft, modele: e.target.value })} placeholder="Sonde sol 5/15" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Fournisseur</Label>
                <select
                  value={tDraft.fournisseur_id ?? ''}
                  onChange={(e) => setTDraft({ ...tDraft, fournisseur_id: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Famille</Label>
                <select
                  value={tDraft.famille ?? 'sol'}
                  onChange={(e) => setTDraft({ ...tDraft, famille: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {FAMILLES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Profondeurs mesurées (cm, séparées par des virgules)</Label>
                <Input
                  value={(tDraft.profondeurs_m ?? []).map((m) => Math.round(Number(m) * 100)).join(', ')}
                  onChange={(e) =>
                    setTDraft({
                      ...tDraft,
                      profondeurs_m: e.target.value.split(',').map((s) => Number(s.trim()) / 100).filter((n) => Number.isFinite(n) && n > 0),
                    })
                  }
                  placeholder="5, 15"
                />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label className="text-xs">Grandeurs mesurées</Label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(GRANDEURS).map(([k, meta]) => {
                    const on = (tDraft.grandeurs ?? []).includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          setTDraft({
                            ...tDraft,
                            grandeurs: on ? (tDraft.grandeurs ?? []).filter((g) => g !== k) : [...(tDraft.grandeurs ?? []), k],
                          })
                        }
                        className={`rounded-full border px-2 py-1 text-[11px] ${on ? 'border-emerald-500 bg-emerald-500/15' : 'border-border'}`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!tDraft.modele?.trim() || !tDraft.fournisseur_id) return;
                    const values = {
                      modele: tDraft.modele.trim(),
                      fournisseur_id: tDraft.fournisseur_id,
                      famille: tDraft.famille ?? 'sol',
                      profondeurs_m: tDraft.profondeurs_m ?? [],
                      grandeurs: tDraft.grandeurs ?? [],
                      description: tDraft.description ?? null,
                    };
                    tMut.mutate(tDraft.id ? { action: 'update', id: tDraft.id, values } : { action: 'create', values });
                    setTDraft(null);
                  }}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTDraft(null)}>Annuler</Button>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.modele}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.fournisseur?.nom} · {t.famille}
                    {t.profondeurs_m.length > 0 && ` · ${t.profondeurs_m.map((m) => `${Math.round(m * 100)} cm`).join(' / ')}`}
                  </div>
                </div>
                <button onClick={() => setTDraft(t)} className="p-1 opacity-60 hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setConfirm({ kind: 't', id: t.id, nom: t.modele })} className="p-1 text-red-600/70 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 text-sm">
          <h3 className="mb-1 font-semibold">Réception des données</h3>
          <p className="text-xs text-muted-foreground">
            Passerelle Brad Technology : les mesures arrivent sur la fonction <code>iot-webhook-brad</code>,
            signées en HMAC-SHA256 (en-tête <code>X-Brad-Signature</code>), dédupliquées par livraison,
            puis stockées en unités normalisées (°C, %, Pa, lx, mm, V).
          </p>
        </section>
          </TabsContent>
        </Tabs>
      </div>

      {/* IA de Jardin cadrée sur le poste de commandement des sondes */}
      <IotChatBotMount />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {confirm?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette suppression est définitive. Les capteurs qui s'appuient sur cet élément doivent être retirés au préalable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                (confirm.kind === 'f' ? fMut : tMut).mutate({ action: 'delete', id: confirm.id });
                setConfirm(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminIot;
