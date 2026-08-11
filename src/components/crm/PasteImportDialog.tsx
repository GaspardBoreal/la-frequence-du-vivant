import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardPaste, Loader2, Building2, CheckCircle2, AlertTriangle, Sparkles,
  Megaphone, Search, Wand2, ArrowRight, Ban,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useImportCompanies } from '@/hooks/useCrmCompanies';
import { useCrmCampaigns } from '@/hooks/useCrmCampaigns';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { KANBAN_COLUMNS } from '@/types/crm';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Extraction des identifiants                                         */
/* ------------------------------------------------------------------ */

export interface ParsedIdentifier {
  siren: string;
  siret?: string;
  /** Extrait de la ligne d'origine, pour aider l'utilisateur à se repérer. */
  contexte?: string;
}

/** Repère les SIREN (9) / SIRET (14) dans un texte libre, espaces et points ignorés. */
export function extractIdentifiers(raw: string): ParsedIdentifier[] {
  const out = new Map<string, ParsedIdentifier>();
  const lines = raw.split(/\n/);
  for (const line of lines) {
    // On tolère les séparateurs internes : 433 584 117 00025 / 433.584.117
    const compact = line.replace(/[ .\u00a0-]/g, (m, i, s) => {
      const prev = s[i - 1];
      const next = s[i + 1];
      return /\d/.test(prev ?? '') && /\d/.test(next ?? '') ? '' : ' ';
    });
    const matches = compact.match(/\d{9,14}/g) ?? [];
    for (const m of matches) {
      let siren: string | null = null;
      let siret: string | undefined;
      if (m.length === 14) { siret = m; siren = m.slice(0, 9); }
      else if (m.length === 9) { siren = m; }
      else continue;
      if (!siren) continue;
      const existing = out.get(siren);
      if (existing) {
        if (!existing.siret && siret) existing.siret = siret;
        continue;
      }
      out.set(siren, {
        siren,
        siret,
        contexte: line.replace(/\s+/g, ' ').trim().slice(0, 120) || undefined,
      });
    }
  }
  return Array.from(out.values());
}

/* ------------------------------------------------------------------ */
/* Résolution annuaire officiel                                        */
/* ------------------------------------------------------------------ */

interface ResolvedRow extends ParsedIdentifier {
  state: 'loading' | 'new' | 'existing' | 'notfound';
  nom?: string | null;
  ville?: string | null;
  naf?: string | null;
  effectif?: string | null;
  cessee?: boolean;
  companyId?: string | null;
}

async function resolveSiren(siren: string) {
  const { data, error } = await supabase.functions.invoke('search-french-companies', {
    body: { q: siren, per_page: 1, page: 1 },
  });
  if (error) return null;
  const r = (data as any)?.results?.[0];
  if (!r) return null;
  if (String(r.siren) !== siren) return null;
  return r;
}

/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Campagne imposée (ouverture depuis l'onglet Recruter). */
  lockedCampaignId?: string | null;
  onDone?: () => void;
}

export const PasteImportDialog: React.FC<Props> = ({ open, onOpenChange, lockedCampaignId, onDone }) => {
  const [text, setText] = React.useState('');
  const [rows, setRows] = React.useState<ResolvedRow[]>([]);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [campaignId, setCampaignId] = React.useState<string | null>(lockedCampaignId ?? null);
  const [campaignQuery, setCampaignQuery] = React.useState('');
  const [createOpportunities, setCreateOpportunities] = React.useState(false);
  const [oppStatut, setOppStatut] = React.useState('a_contacter');
  const [assigneeId, setAssigneeId] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = React.useState<{ imported: number; enrolled: number; opportunities: number; failed: number; assignee: string | null } | null>(null);

  const { data: campaigns = [] } = useCrmCampaigns();
  const { activeMembers } = useTeamMembers();
  const [myMemberId, setMyMemberId] = React.useState<string | null>(null);
  const importMutation = useImportCompanies();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Repère le membre d'équipe correspondant au compte connecté
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (cancelled || !uid) return;
      const me = activeMembers.find((m) => m.user_id === uid);
      setMyMemberId(me?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, [activeMembers]);

  React.useEffect(() => {
    if (open) {
      setText(''); setRows([]); setPicked(new Set()); setReport(null); setProgress(null);
      setCampaignId(lockedCampaignId ?? null);
      setAssigneeId(myMemberId);
    }
  }, [open, lockedCampaignId, myMemberId]);


  const assigneeName = React.useMemo(() => {
    const m = activeMembers.find((x) => x.id === assigneeId);
    return m ? `${m.prenom} ${m.nom}` : null;
  }, [activeMembers, assigneeId]);

  const detected = React.useMemo(() => extractIdentifiers(text), [text]);

  // Résolution auto (débouncée) dès qu'on a des identifiants
  React.useEffect(() => {
    if (!open || detected.length === 0) { setRows([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const base: ResolvedRow[] = detected.map(d => ({ ...d, state: 'loading' }));
      setRows(base);
      setPicked(new Set(detected.map(d => d.siren)));

      // Sociétés déjà présentes dans le CRM
      const { data: existing } = await supabase
        .from('crm_companies')
        .select('id, siren')
        .in('siren', detected.map(d => d.siren));
      const existingMap = new Map((existing ?? []).map((c: any) => [c.siren, c.id]));

      for (const d of detected) {
        if (cancelled) return;
        const raw = await resolveSiren(d.siren);
        if (cancelled) return;
        setRows(prev => prev.map(r => r.siren !== d.siren ? r : {
          ...r,
          state: raw ? (existingMap.has(d.siren) ? 'existing' : 'new') : 'notfound',
          companyId: existingMap.get(d.siren) ?? null,
          nom: raw?.nom_complet ?? raw?.nom_raison_sociale ?? null,
          ville: raw?.siege?.libelle_commune ?? null,
          naf: raw?.libelle_activite_principale ?? null,
          effectif: raw?.tranche_effectif_salarie ?? null,
          cessee: (raw?.siege?.etat_administratif ?? raw?.etat_administratif) === 'C',
        }));
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [detected, open]);

  const selectable = rows.filter(r => r.state !== 'notfound' && r.state !== 'loading');
  const selectedRows = selectable.filter(r => picked.has(r.siren));

  const filteredCampaigns = campaigns.filter((c: any) =>
    !campaignQuery || c.nom.toLowerCase().includes(campaignQuery.toLowerCase()));
  const currentCampaign = campaigns.find((c: any) => c.id === campaignId);

  const toggle = (siren: string) => setPicked(p => {
    const n = new Set(p); n.has(siren) ? n.delete(siren) : n.add(siren); return n;
  });

  const run = async () => {
    if (selectedRows.length === 0) return;
    setRunning(true);
    setProgress({ done: 0, total: selectedRows.length });
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      const tags = selectedRows.some(r => r.siret) ? [] : [];
      const importRes = await importMutation.mutateAsync({
        sirens: selectedRows.map(r => r.siren),
        assigned_to: assigneeId,
        tags,
      });
      const results = importRes?.results ?? [];
      const idBySiren = new Map(results.map((r: any) => [r.siren, r.id]));
      setProgress({ done: selectedRows.length, total: selectedRows.length });

      // Traçabilité de la source + SIRET d'établissement cité
      const stamp = new Date().toLocaleDateString('fr-FR');
      const activities = selectedRows
        .map(r => {
          const id = idBySiren.get(r.siren);
          if (!id) return null;
          return {
            company_id: id,
            performed_by: uid,
            type: 'note',
            summary: `Issue d'une recherche IA du ${stamp}${r.siret ? ` — établissement cité : SIRET ${r.siret}` : ''}`,
            metadata: { source: 'paste_ia', siret: r.siret ?? null, contexte: r.contexte ?? null },
          };
        })
        .filter(Boolean);
      if (activities.length > 0) {
        await supabase.from('crm_company_activities').insert(activities as any);
      }

      let enrolled = 0;
      let opportunities = 0;

      if (campaignId) {
        const rowsToEnroll = selectedRows
          .map(r => idBySiren.get(r.siren))
          .filter(Boolean)
          .map(company_id => ({ campaign_id: campaignId, company_id, added_by: uid }));
        if (rowsToEnroll.length > 0) {
          const { data: members, error } = await supabase
            .from('crm_campaign_members')
            .upsert(rowsToEnroll as any, { onConflict: 'campaign_id,company_id', ignoreDuplicates: true })
            .select('id, company_id');
          if (error) throw error;
          enrolled = members?.length ?? 0;

          if (createOpportunities && members && members.length > 0) {
            for (const m of members as any[]) {
              const row = selectedRows.find(r => idBySiren.get(r.siren) === m.company_id);
              const label = row?.nom ?? 'Prospect';
              const { data: opp, error: oppErr } = await supabase
                .from('crm_opportunities')
                .insert({
                  titre: `${label} — ${currentCampaign?.nom ?? 'Campagne'}`,
                  prenom: '',
                  nom: label,
                  entreprise: label,
                  email: '',
                  statut: oppStatut,
                  source: 'campagne',
                  campaign_id: campaignId,
                  assigned_to: assigneeId,
                  created_by: uid,
                } as any)
                .select('id')
                .single();
              if (oppErr || !opp) continue;
              await supabase.from('crm_opportunity_companies')
                .insert({ opportunity_id: (opp as any).id, company_id: m.company_id, role: 'prospect' } as any);
              await supabase.from('crm_campaign_members')
                .update({ opportunity_id: (opp as any).id } as any)
                .eq('id', m.id);
              opportunities++;
            }
          }
        }
      }

      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      qc.invalidateQueries({ queryKey: ['crm-campaign-members'] });
      qc.invalidateQueries({ queryKey: ['crm-campaign-memberships'] });
      qc.invalidateQueries({ queryKey: ['crm-campaigns-overview'] });
      qc.invalidateQueries({ queryKey: ['campaign-stats'] });
      qc.invalidateQueries({ queryKey: ['crm-opportunities'] });

      setReport({
        imported: results.length,
        enrolled,
        opportunities,
        failed: selectedRows.length - results.length,
        assignee: assigneeName,
      });
      onDone?.();
    } catch (e: any) {
      toast.error("L'import a échoué", { description: e?.message });
    } finally {
      setRunning(false);
    }
  };

  const stateBadge = (r: ResolvedRow) => {
    if (r.state === 'loading') return <Badge variant="outline" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />Lecture…</Badge>;
    if (r.state === 'notfound') return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Introuvable</Badge>;
    if (r.state === 'existing') return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Déjà dans l'annuaire</Badge>;
    return <Badge className="gap-1"><Sparkles className="h-3 w-3" />Nouveau</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5 text-primary" />
            Import éclair — coller une recherche
          </DialogTitle>
          <DialogDescription>
            Collez le texte brut (réponse IA, mail, tableau…). Les SIREN et SIRET sont reconnus automatiquement.
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <CheckCircle2 className="h-14 w-14 text-primary" />
            </motion.div>
            <p className="text-lg font-semibold">
              {report.imported} importée{report.imported > 1 ? 's' : ''} · {report.enrolled} enrôlée{report.enrolled > 1 ? 's' : ''}
              {report.opportunities > 0 ? ` · ${report.opportunities} opportunité${report.opportunities > 1 ? 's' : ''}` : ''}
              {report.failed > 0 ? ` · ${report.failed} échec${report.failed > 1 ? 's' : ''}` : ' · 0 échec'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {campaignId && (
                <>
                  <Button variant="outline" onClick={() => { onOpenChange(false); navigate(`/admin/crm/campagnes/${campaignId}`); }}>
                    <Megaphone className="mr-1.5 h-4 w-4" /> Ouvrir la campagne
                  </Button>
                  <Button variant="outline" onClick={() => { onOpenChange(false); navigate(`/admin/crm/campagnes/${campaignId}?tab=appels`); }}>
                    <ArrowRight className="mr-1.5 h-4 w-4" /> Salle d'appels
                  </Button>
                </>
              )}
              <Button onClick={() => { setReport(null); setText(''); setRows([]); }}>
                <Wand2 className="mr-1.5 h-4 w-4" /> Coller une autre liste
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Texte collé</Label>
                <Button
                  size="sm" variant="outline"
                  onClick={async () => {
                    try { setText(await navigator.clipboard.readText()); }
                    catch { toast.error('Presse-papiers inaccessible — collez avec Ctrl/Cmd + V'); }
                  }}
                >
                  <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" /> Coller depuis le presse-papiers
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Ex. :\nTerritoires Charente (SAEML) — SIRET : 433 584 117 00025\nJas Hennessy & Co — SIRET : 905 620 035 00014`}
                className="min-h-[130px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                {detected.length === 0
                  ? 'Aucun numéro reconnu pour l’instant.'
                  : `${detected.length} établissement${detected.length > 1 ? 's' : ''} reconnu${detected.length > 1 ? 's' : ''}.`}
              </p>
            </div>

            <AnimatePresence>
              {rows.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <ScrollArea className="max-h-64 rounded-md border">
                    <div className="divide-y">
                      {rows.map(r => (
                        <div key={r.siren} className="flex items-start gap-3 p-3">
                          <Checkbox
                            className="mt-1"
                            checked={picked.has(r.siren)}
                            disabled={r.state === 'notfound' || r.state === 'loading'}
                            onCheckedChange={() => toggle(r.siren)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-medium text-sm ${r.cessee ? 'line-through text-muted-foreground' : ''}`}>
                                {r.nom ?? r.contexte ?? `SIREN ${r.siren}`}
                              </span>
                              {stateBadge(r)}
                              {r.cessee && (
                                <Badge variant="destructive" className="gap-1 text-[10px]"><Ban className="h-3 w-3" />Cessée</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              SIREN {r.siren}{r.siret ? ` · SIRET cité ${r.siret}` : ''}
                              {r.ville ? ` · ${r.ville}` : ''}
                              {r.effectif ? ` · ${r.effectif}` : ''}
                            </p>
                            {r.naf && <p className="text-xs text-muted-foreground truncate">{r.naf}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-lg border p-3 space-y-3">
              <Label className="flex items-center gap-2 text-sm">
                <Megaphone className="h-4 w-4 text-primary" /> Destination
              </Label>
              {lockedCampaignId ? (
                <p className="text-sm text-muted-foreground">
                  Campagne : <span className="font-medium text-foreground">{currentCampaign?.nom ?? '—'}</span>
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={campaignQuery}
                      onChange={(e) => setCampaignQuery(e.target.value)}
                      placeholder="Chercher une campagne…"
                      className="pl-8"
                    />
                  </div>
                  <Select value={campaignId ?? 'none'} onValueChange={(v) => setCampaignId(v === 'none' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Choisir une campagne" /></SelectTrigger>
                    <SelectContent className="z-[1300]">
                      <SelectItem value="none">Aucune campagne (annuaire seulement)</SelectItem>
                      {filteredCampaigns.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="paste-opp" className="text-sm font-normal">
                  Créer aussi une opportunité pour chaque prospect
                </Label>
                <Switch id="paste-opp" checked={createOpportunities} disabled={!campaignId} onCheckedChange={setCreateOpportunities} />
              </div>
              {createOpportunities && campaignId && (
                <Select value={oppStatut} onValueChange={setOppStatut}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1300]">
                    {KANBAN_COLUMNS.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="paste-assign" className="text-sm font-normal">Attribuer à</Label>
                <Select
                  value={assigneeId ?? '__none__'}
                  onValueChange={(v) => setAssigneeId(v === '__none__' ? null : v)}
                >
                  <SelectTrigger id="paste-assign" className="w-[260px]">
                    <SelectValue placeholder="Personne (non attribué)" />
                  </SelectTrigger>
                  <SelectContent className="z-[1300]">
                    <SelectItem value="__none__">Personne (non attribué)</SelectItem>
                    {myMemberId && (
                      <SelectItem value={myMemberId}>
                        Moi — {activeMembers.find((m) => m.id === myMemberId)?.prenom}{' '}
                        {activeMembers.find((m) => m.id === myMemberId)?.nom}
                      </SelectItem>
                    )}
                    {activeMembers
                      .filter((m) => m.id !== myMemberId)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.prenom} {m.nom}
                          {m.fonction ? ` · ${m.fonction}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>
        )}

        {!report && (
          <DialogFooter className="gap-2 sm:justify-between">
            <span className="text-xs text-muted-foreground self-center">
              {progress ? `${progress.done}/${progress.total} traitées` : `${selectedRows.length} sélectionnée${selectedRows.length > 1 ? 's' : ''}`}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={running}>Annuler</Button>
              <Button onClick={run} disabled={running || selectedRows.length === 0}>
                {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Building2 className="mr-1.5 h-4 w-4" />}
                {campaignId ? `Importer et enrôler (${selectedRows.length})` : `Importer (${selectedRows.length})`}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
