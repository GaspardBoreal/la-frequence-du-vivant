import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import {
  CAMPAIGN_OBJECTIF_OPTIONS,
  CAMPAIGN_STATUT_OPTIONS,
  type CrmCampaign,
  type CampaignCiblage,
  type CampaignScript,
} from '@/types/crmCampaign';
import { FRENCH_DEPARTMENTS_WITH_CODES, FRENCH_REGIONS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign?: CrmCampaign | null;
  onSubmit: (payload: Partial<CrmCampaign>) => void;
  isSubmitting?: boolean;
}

const NONE = '__none__';

export const CampaignFormDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  campaign,
  onSubmit,
  isSubmitting,
}) => {
  const { activeMembers } = useTeamMembers();
  const [nom, setNom] = React.useState('');
  const [objectif, setObjectif] = React.useState('partenariat');
  const [statut, setStatut] = React.useState('active');
  const [description, setDescription] = React.useState('');
  const [dateDebut, setDateDebut] = React.useState('');
  const [dateFin, setDateFin] = React.useState('');
  const [piloteId, setPiloteId] = React.useState<string>(NONE);
  const [objectifContacts, setObjectifContacts] = React.useState('100');
  const [objectifTaux, setObjectifTaux] = React.useState('10');
  const [ciblage, setCiblage] = React.useState<CampaignCiblage>({});
  const [script, setScript] = React.useState<CampaignScript>({});

  React.useEffect(() => {
    if (!open) return;
    setNom(campaign?.nom ?? '');
    setObjectif(campaign?.objectif ?? 'partenariat');
    setStatut(campaign?.statut ?? 'active');
    setDescription(campaign?.description ?? '');
    setDateDebut(campaign?.date_debut ?? '');
    setDateFin(campaign?.date_fin ?? '');
    setPiloteId(campaign?.pilote_id ?? NONE);
    setObjectifContacts(String(campaign?.objectif_contacts ?? 100));
    setObjectifTaux(String(campaign?.objectif_taux ?? 10));
    setCiblage((campaign?.ciblage as CampaignCiblage) ?? {});
    setScript((campaign?.script as CampaignScript) ?? {});
  }, [open, campaign]);

  const submit = () => {
    onSubmit({
      nom: nom.trim(),
      objectif,
      statut,
      description: description.trim() || null,
      date_debut: dateDebut || null,
      date_fin: dateFin || null,
      pilote_id: piloteId === NONE ? null : piloteId,
      objectif_contacts: Number(objectifContacts) || 0,
      objectif_taux: Number(objectifTaux) || 0,
      ciblage,
      script,
    });
  };

  const setCib = (k: keyof CampaignCiblage, v: string) =>
    setCiblage((c) => ({ ...c, [k]: v === NONE || v === '' ? undefined : v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}</DialogTitle>
          <DialogDescription>
            Une cible nette, un script court, un objectif de détection d'intérêt mesurable.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="identite">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="ciblage">Ciblage</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
          </TabsList>

          <TabsContent value="identite" className="space-y-4 pt-4">
            <div>
              <Label>Nom de la campagne</Label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Mécénat agroalimentaire bio — Nouvelle-Aquitaine"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Objectif</Label>
                <Select value={objectif} onValueChange={setObjectif}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OBJECTIF_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Début</Label>
                <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div>
                <Label>Fin</Label>
                <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
              <div>
                <Label>Pilote</Label>
                <Select value={piloteId} onValueChange={setPiloteId}>
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Non assigné</SelectItem>
                    {activeMembers.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.prenom} {m.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contacts visés</Label>
                  <Input
                    type="number"
                    value={objectifContacts}
                    onChange={(e) => setObjectifContacts(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Détection cible (%)</Label>
                  <Input
                    type="number"
                    value={objectifTaux}
                    onChange={(e) => setObjectifTaux(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Note d'intention</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Pourquoi cette cible, quelle promesse, quel signal d'intérêt on cherche."
              />
            </div>
          </TabsContent>

          <TabsContent value="ciblage" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Ces critères servent à recruter automatiquement des prospects de l'annuaire dans la campagne.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stade annuaire</Label>
                <Select value={ciblage.stage ?? NONE} onValueChange={(v) => setCib('stage', v)}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tous</SelectItem>
                    <SelectItem value="suspect">Suspect</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Région</Label>
                <Select value={ciblage.region ?? NONE} onValueChange={(v) => setCib('region', v)}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value={NONE}>Toutes</SelectItem>
                    {FRENCH_REGIONS_WITH_CODES.map((r) => (
                      <SelectItem key={r.code} value={r.label}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Département</Label>
                <Select value={ciblage.departement ?? NONE} onValueChange={(v) => setCib('departement', v)}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value={NONE}>Tous</SelectItem>
                    {FRENCH_DEPARTMENTS_WITH_CODES.map((d) => (
                      <SelectItem key={d.code} value={d.code}>{d.code} — {d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  value={ciblage.ville ?? ''}
                  onChange={(e) => setCib('ville', e.target.value)}
                  placeholder="Poitiers"
                />
              </div>
              <div>
                <Label>Code NAF</Label>
                <Input
                  value={ciblage.code_naf ?? ''}
                  onChange={(e) => setCib('code_naf', e.target.value)}
                  placeholder="10.71C"
                />
              </div>
              <div>
                <Label>Mot-clé (nom, ville)</Label>
                <Input
                  value={ciblage.search ?? ''}
                  onChange={(e) => setCib('search', e.target.value)}
                  placeholder="bio"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="script" className="space-y-4 pt-4">
            <div>
              <Label>Accroche (15 secondes)</Label>
              <Textarea
                rows={2}
                maxLength={600}
                value={script.accroche ?? ''}
                onChange={(e) => setScript((s) => ({ ...s, accroche: e.target.value }))}
                placeholder="Nous cartographions le vivant sur les territoires avec les habitants…"
              />
            </div>
            <div>
              <Label>Preuve concrète</Label>
              <Textarea
                rows={2}
                maxLength={600}
                value={script.preuve ?? ''}
                onChange={(e) => setScript((s) => ({ ...s, preuve: e.target.value }))}
                placeholder="Observations certifiées, données ouvertes reversées au GBIF…"
              />
            </div>
            <div>
              <Label>Demande précise</Label>
              <Textarea
                rows={2}
                maxLength={600}
                value={script.demande ?? ''}
                onChange={(e) => setScript((s) => ({ ...s, demande: e.target.value }))}
                placeholder="20 minutes avec la personne qui pilote vos engagements territoire."
              />
            </div>
            <div>
              <Label>Lien plaquette</Label>
              <Input
                value={script.lien ?? ''}
                onChange={(e) => setScript((s) => ({ ...s, lien: e.target.value }))}
                placeholder="https://…"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!nom.trim() || isSubmitting}>
            {campaign ? 'Enregistrer' : 'Créer la campagne'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
