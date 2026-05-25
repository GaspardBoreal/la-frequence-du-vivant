import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, EyeOff, Leaf, Bug, Image as ImageIcon, Map as MapIcon, List } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AiCurationMapView from './ai-recognition/AiCurationMapView';

interface Props { eventId: string }

interface MediaWithSuggestions {
  id: string;
  url_fichier: string | null;
  external_url: string | null;
  ai_status: string;
  ai_kingdom_hint: string | null;
  metadata: any;
  suggestions: Array<{
    rank: number;
    taxon_scientific_name: string;
    taxon_common_name_fr: string | null;
    kingdom: string | null;
    confidence: number;
    ai_provider: string;
  }>;
}

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-muted text-muted-foreground', icon: ImageIcon },
  processing: { label: 'En cours', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', icon: Loader2 },
  auto_validated: { label: 'Auto-validée', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
  pending_curation: { label: 'À curer', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', icon: AlertCircle },
  low_confidence: { label: 'Faible confiance', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300', icon: AlertCircle },
  unidentifiable: { label: 'Non identifiable', color: 'bg-muted text-muted-foreground', icon: EyeOff },
  validated_by_human: { label: 'Validée humain', color: 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
};

export default function AiRecognitionPanel({ eventId }: Props) {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [curationOpen, setCurationOpen] = useState(false);

  // Config event
  const { data: event } = useQuery({
    queryKey: ['event-ai-config', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('ai_recognition_config')
        .eq('id', eventId)
        .maybeSingle();
      return data;
    },
  });
  const cfg = (event?.ai_recognition_config as any) || {
    auto_threshold: 0.85,
    curation_threshold: 0.6,
    plantnet_project: 'weurope',
  };

  const [autoThr, setAutoThr] = useState(cfg.auto_threshold);
  const [curThr, setCurThr] = useState(cfg.curation_threshold);
  React.useEffect(() => {
    setAutoThr(cfg.auto_threshold);
    setCurThr(cfg.curation_threshold);
  }, [cfg.auto_threshold, cfg.curation_threshold]);

  // Liste medias + counters
  const { data: medias = [], refetch } = useQuery<MediaWithSuggestions[]>({
    queryKey: ['ai-medias', eventId],
    queryFn: async () => {
      const { data: ms } = await supabase
        .from('marcheur_medias')
        .select('id, url_fichier, external_url, ai_status, ai_kingdom_hint, metadata')
        .eq('marche_event_id', eventId)
        .eq('type_media', 'photo')
        .order('created_at', { ascending: false });
      if (!ms || ms.length === 0) return [];
      const ids = ms.map((m) => m.id);
      const { data: sugg } = await supabase
        .from('marcheur_photo_ai_suggestions')
        .select('media_id, rank, taxon_scientific_name, taxon_common_name_fr, kingdom, confidence, ai_provider')
        .in('media_id', ids)
        .order('rank');
      const byMedia: Record<string, any[]> = {};
      (sugg || []).forEach((s: any) => {
        (byMedia[s.media_id] ||= []).push(s);
      });
      return ms.map((m) => ({ ...m, suggestions: byMedia[m.id] || [] } as MediaWithSuggestions));
    },
  });

  const counters = React.useMemo(() => {
    const c = { total: medias.length, auto: 0, curation: 0, low: 0, pending: 0, unidentifiable: 0, validated: 0 };
    for (const m of medias) {
      if (m.ai_status === 'auto_validated') c.auto++;
      else if (m.ai_status === 'pending_curation') c.curation++;
      else if (m.ai_status === 'low_confidence') c.low++;
      else if (m.ai_status === 'unidentifiable') c.unidentifiable++;
      else if (m.ai_status === 'validated_by_human') c.validated++;
      else c.pending++;
    }
    return c;
  }, [medias]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const newCfg = { ...cfg, auto_threshold: autoThr, curation_threshold: curThr };
      const { error } = await supabase
        .from('marche_events')
        .update({ ai_recognition_config: newCfg })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Seuils enregistrés');
      qc.invalidateQueries({ queryKey: ['event-ai-config', eventId] });
    },
  });

  const launch = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('recognize-marcheur-photos', {
        body: { eventId, limit: 200 },
      });
      if (error) throw error;
      toast.success(
        `Reconnaissance terminée : ${data?.results?.auto ?? 0} auto · ${data?.results?.curation ?? 0} à curer`
      );
      await refetch();
    } catch (e: any) {
      toast.error(`Erreur : ${e?.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  const curationList = medias.filter((m) => m.ai_status === 'pending_curation' || m.ai_status === 'low_confidence');

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Reconnaissance IA des photos
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pré-tri Gemini, puis Pl@ntNet (plantes) ou Gemini Vision (faune & champignons).
            </p>
          </div>
          <Button onClick={launch} disabled={running || counters.total === 0} size="lg">
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Lancer la reconnaissance ({counters.pending + counters.low} photo{counters.pending + counters.low > 1 ? 's' : ''})
          </Button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-6">
          {[
            { key: 'total', label: 'Total', value: counters.total, color: 'bg-muted' },
            { key: 'auto', label: 'Auto-validées', value: counters.auto, color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
            { key: 'curation', label: 'À curer', value: counters.curation, color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
            { key: 'low', label: 'Faible confiance', value: counters.low, color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
            { key: 'validated', label: 'Validées humain', value: counters.validated, color: 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300' },
            { key: 'unidentifiable', label: 'Non identifiables', value: counters.unidentifiable, color: 'bg-muted text-muted-foreground' },
          ].map((c) => (
            <div key={c.key} className={`rounded-lg p-3 ${c.color}`}>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs">{c.label}</div>
            </div>
          ))}
        </div>

        {counters.total > 0 && (
          <Progress
            value={((counters.auto + counters.validated + counters.unidentifiable) / counters.total) * 100}
            className="mt-4"
          />
        )}

        {counters.curation + counters.low > 0 && (
          <Button variant="outline" className="mt-4" onClick={() => setCurationOpen(true)}>
            <List className="h-4 w-4 mr-2" />
            Curation rapide (liste) — {counters.curation + counters.low}
          </Button>
        )}
      </Card>

      {/* Vue Carte de curation + réglages dans des onglets */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList>
          <TabsTrigger value="map"><MapIcon className="h-4 w-4 mr-1.5" /> Carte de curation</TabsTrigger>
          <TabsTrigger value="settings">Seuils & config</TabsTrigger>
        </TabsList>
        <TabsContent value="map" className="mt-3">
          <AiCurationMapView eventId={eventId} />
        </TabsContent>
        <TabsContent value="settings" className="mt-3">
          <Card className="p-6">
            <h4 className="font-medium mb-4">Seuils de confiance</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Auto-validation</span>
                  <Badge variant="secondary">{(autoThr * 100).toFixed(0)} %</Badge>
                </div>
                <Slider min={0.5} max={0.99} step={0.01} value={[autoThr]} onValueChange={(v) => setAutoThr(v[0])} />
                <p className="text-xs text-muted-foreground mt-1">≥ ce score, l'espèce est ajoutée automatiquement.</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Curation</span>
                  <Badge variant="secondary">{(curThr * 100).toFixed(0)} %</Badge>
                </div>
                <Slider min={0.3} max={0.85} step={0.01} value={[curThr]} onValueChange={(v) => setCurThr(v[0])} />
                <p className="text-xs text-muted-foreground mt-1">Entre ce seuil et l'auto, la photo passe en curation.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button size="sm" onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>Enregistrer</Button>
              <span className="text-xs text-muted-foreground">Pl@ntNet projet : <code>{cfg.plantnet_project}</code></span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Curation Drawer */}
      <Sheet open={curationOpen} onOpenChange={setCurationOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Curation des photos ({curationList.length})</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {curationList.map((m) => (
              <CurationCard key={m.id} media={m} onDone={() => { refetch(); }} />
            ))}
            {curationList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune photo à curer.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CurationCard({ media, onDone }: { media: MediaWithSuggestions; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const url = media.url_fichier || media.external_url || '';
  const kingdomIcon = media.ai_kingdom_hint === 'plante' ? Leaf : Bug;
  const Icon = kingdomIcon;

  const act = async (action: string, sci?: string, fr?: string | null) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('curate-marcheur-photo', {
        body: { mediaId: media.id, action, scientificName: sci, commonNameFr: fr },
      });
      if (error) throw error;
      toast.success(action === 'unidentifiable' ? 'Marquée non identifiable' : 'Espèce validée');
      onDone();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <img src={url} alt="" className="w-32 h-32 object-cover rounded-md flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span>{media.ai_kingdom_hint || 'inconnu'}</span>
            <Badge variant="outline" className="text-[10px]">{media.ai_status}</Badge>
          </div>
          {media.suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucune suggestion.</p>
          ) : (
            <div className="space-y-1.5">
              {media.suggestions.slice(0, 5).map((s) => (
                <button
                  key={s.rank}
                  onClick={() => act('validate', s.taxon_scientific_name, s.taxon_common_name_fr)}
                  disabled={busy}
                  className="w-full text-left rounded-md border border-border hover:border-primary hover:bg-primary/5 px-3 py-2 transition"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.taxon_common_name_fr || s.taxon_scientific_name}
                      </div>
                      {s.taxon_common_name_fr && (
                        <div className="text-xs text-muted-foreground italic truncate">{s.taxon_scientific_name}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{(s.confidence * 100).toFixed(0)} %</Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.ai_provider}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => act('unidentifiable')} disabled={busy}>
              <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Non identifiable
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
