import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  companyName: string;
}

const SECTIONS = [
  { key: 'hero', label: 'Hero scénographie + QR code' },
  { key: 'kpis', label: 'KPIs (participants, espèces, empreinte)' },
  { key: 'pratiques', label: 'Top pratiques remarquables' },
  { key: 'temoignages', label: 'Témoignages des marcheurs' },
  { key: 'carte', label: 'Carte des observations' },
  { key: 'closing', label: '« Et si c\'était chez vous ? »' },
];

export const DossierPreuveDialog: React.FC<Props> = ({ open, onOpenChange, companyId, companyName }) => {
  const qc = useQueryClient();
  const [marcheId, setMarcheId] = React.useState<string>('');
  const [sections, setSections] = React.useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true]))
  );

  const { data: marches = [] } = useQuery({
    queryKey: ['crm-past-marches-for-deck'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, public_slug')
        .lt('date_marche', new Date().toISOString())
        .order('date_marche', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: decks = [] } = useQuery({
    queryKey: ['prospect-decks', companyId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_prospect_decks')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      if (!marcheId) throw new Error('Sélectionnez une marche source');
      const selected = Object.entries(sections).filter(([, v]) => v).map(([k]) => k);
      const userRes = await supabase.auth.getUser();
      const { error } = await supabase.from('crm_prospect_decks').insert({
        company_id: companyId,
        marche_id: marcheId,
        generated_by: userRes.data.user?.id,
        sections: { selected },
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dossier prospect demandé', {
        description: 'Génération en file. Le PDF sera disponible dès qu\'il sera prêt.',
      });
      qc.invalidateQueries({ queryKey: ['prospect-decks', companyId] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Générer le dossier prospect
          </DialogTitle>
          <DialogDescription>
            Construit un dossier PDF premium pour <strong>{companyName}</strong>, à partir des données
            d'une marche passée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Marche source</Label>
            <Select value={marcheId} onValueChange={setMarcheId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une marche passée…" />
              </SelectTrigger>
              <SelectContent>
                {marches.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title} — {new Date(m.date_marche).toLocaleDateString('fr-FR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sections à inclure</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECTIONS.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded border bg-muted/30 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={sections[s.key]}
                    onCheckedChange={(c) => setSections((p) => ({ ...p, [s.key]: !!c }))}
                  />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {decks.length > 0 && (
            <div className="space-y-2">
              <Label>Dossiers récents</Label>
              <div className="space-y-1">
                {decks.map((d: any) => (
                  <Card key={d.id} className="p-2 flex items-center justify-between text-xs">
                    <span>
                      {new Date(d.created_at).toLocaleDateString('fr-FR')} —{' '}
                      <span className="text-muted-foreground">{d.status}</span>
                    </span>
                    {d.file_url ? (
                      <Button size="sm" variant="ghost" className="h-6" onClick={() => window.open(d.file_url, '_blank')}>
                        <Download className="h-3 w-3 mr-1" /> Télécharger
                      </Button>
                    ) : (
                      <span className="text-muted-foreground italic">en préparation…</span>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => generate.mutate()} disabled={!marcheId || generate.isPending}>
            {generate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Demander la génération
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
