import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Sparkles, Save, Eye, History, ExternalLink, Wand2, Info } from 'lucide-react';
import {
  useAdminEventScenography,
  useSaveScenography,
  useScenographyVersions,
  useEventScenographyData,
} from '@/hooks/useScenography';
import ScenographyRuntime from '@/components/scenography/ScenographyRuntime';
import { DEVIAT_JARDIN_MONDE_TEMPLATE } from '@/lib/scenography/deviatJardinMondeTemplate';
import { toast } from 'sonner';

interface Props { eventId: string; }

const DOC_SNIPPETS: { label: string; code: string }[] = [
  {
    label: 'Squelette minimal',
    code: `function Scenography({ data }) {
  return createElement('div', { className: 'min-h-screen grid place-items-center text-emerald-200' },
    createElement('h1', { className: 'text-4xl font-light' }, data.event?.title || 'Marche du vivant')
  );
}
export default Scenography;`,
  },
  {
    label: 'DEVIAT / Jardin Monde (4 actes)',
    code: DEVIAT_JARDIN_MONDE_TEMPLATE,
  },
];

const ScenographyEditor: React.FC<Props> = ({ eventId }) => {
  const { data: event, isLoading } = useAdminEventScenography(eventId);
  const { data: versions } = useScenographyVersions(eventId);
  const save = useSaveScenography();

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (event) {
      setCode(event.scenography_code ?? '');
      setTitle(event.scenography_title ?? '');
      setEnabled(!!event.scenography_enabled);
    }
  }, [event?.id]);

  // Live preview data (admin can see even when disabled)
  const { data: liveData } = useEventScenographyData(event?.public_slug ?? undefined, previewOpen);

  if (isLoading || !event) {
    return <Card className="p-6 text-sm text-muted-foreground">Chargement…</Card>;
  }

  const publicUrl = event.public_slug ? `/m/${event.public_slug}` : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
      {/* Editor column */}
      <div className="space-y-4 min-w-0">
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold">Scénographie publique</h3>
              {event.scenography_enabled && <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Active</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sceno-enabled" className="text-xs text-muted-foreground">Activer sur /m/{event.public_slug ?? '…'}</Label>
              <Switch
                id="sceno-enabled"
                checked={enabled}
                disabled={!event.is_public || !code}
                onCheckedChange={setEnabled}
              />
            </div>
          </div>

          {!event.is_public && (
            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2 p-2 rounded bg-amber-500/10">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Activez d'abord la publication publique de l'événement dans l'onglet Informations.
            </div>
          )}

          <div>
            <Label className="text-xs" htmlFor="sceno-title">Titre SEO (optionnel)</Label>
            <Input
              id="sceno-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Un Jardin Monde — 120 espèces, 70 regards"
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs" htmlFor="sceno-code">Code TSX</Label>
              <span className="text-[10px] text-muted-foreground font-mono">{code.length} car.</span>
            </div>
            <Textarea
              id="sceno-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="font-mono text-[12px] leading-relaxed min-h-[480px] bg-muted/30"
              placeholder="// Définissez function Scenography({ data }) { … }\n// puis export default Scenography;"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => save.mutate({ eventId, code: code || null, enabled, title: title || null }, {
                onSuccess: () => {/* invalidates */},
              })}
              disabled={save.isPending}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>

            <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" disabled={!code}>
                  <Eye className="h-4 w-4 mr-1.5" />
                  Aperçu
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[92vh] p-0 overflow-hidden">
                <SheetHeader className="px-4 py-2 border-b">
                  <SheetTitle className="text-sm">Aperçu scénographie — {event.title}</SheetTitle>
                </SheetHeader>
                <div className="relative h-[calc(92vh-48px)]">
                  {code && (
                    <ScenographyRuntime
                      code={code}
                      data={liveData ?? {}}
                      title={event.title}
                      className="absolute inset-0"
                      showExit={false}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {publicUrl && event.scenography_enabled && (
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Ouvrir la page publique
                </Button>
              </a>
            )}
          </div>
        </Card>
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Wand2 className="h-4 w-4" /> Modèles</h4>
          <div className="space-y-2">
            {DOC_SNIPPETS.map((s) => (
              <Button
                key={s.label}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => {
                  if (!code || confirm('Remplacer le code actuel ?')) {
                    setCode(s.code);
                    toast.info('Modèle inséré — pensez à enregistrer');
                  }
                }}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-2">Données injectées</h4>
          <ul className="text-xs space-y-1 text-muted-foreground font-mono">
            <li><code className="text-foreground">data.event</code> — titre, dates, GPS</li>
            <li><code className="text-foreground">data.species[]</code> — espèces iNat + marcheurs</li>
            <li><code className="text-foreground">data.photos[]</code> — photos marcheurs</li>
            <li><code className="text-foreground">data.waypoints[]</code> — tracé GPS</li>
            <li><code className="text-foreground">data.testimonies[]</code> — témoignages</li>
          </ul>
          <h4 className="text-sm font-semibold mt-3 mb-1">Helpers</h4>
          <ul className="text-xs space-y-0.5 text-muted-foreground font-mono">
            <li>useScrollProgress() → 0–1</li>
            <li>useMousePos() → &#123;x,y&#125;</li>
            <li>lerp, clamp, hashColor</li>
            <li>motion, AnimatePresence (Framer Motion)</li>
          </ul>
        </Card>

        {!!versions?.length && (
          <Card className="p-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><History className="h-4 w-4" /> Versions</h4>
            <div className="space-y-1 max-h-[260px] overflow-auto">
              {versions.map((v: any) => (
                <button
                  key={v.id}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition"
                  onClick={() => {
                    if (confirm('Restaurer cette version ? Le code actuel sera remplacé.')) {
                      setCode(v.code);
                      toast.info('Version restaurée — pensez à enregistrer');
                    }
                  }}
                >
                  <div className="font-mono">{new Date(v.created_at).toLocaleString('fr-FR')}</div>
                  <div className="text-muted-foreground">{v.code.length} caractères</div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScenographyEditor;
