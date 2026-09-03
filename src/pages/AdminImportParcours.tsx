import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Route as RouteIcon, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { RichMap } from '@/components/maps';
import TrackDropzone from '@/components/admin/import-parcours/TrackDropzone';
import StepsEditorTable, { type EditableStep } from '@/components/admin/import-parcours/StepsEditorTable';
import { parseTrackFile, centroidOf, type ParsedTrack } from '@/lib/geo/parseTrackFile';

interface ImportResult {
  exploration: { id: string; slug: string; name: string };
  event: { id: string; public_slug: string | null };
  counts: { marches: number; waypoints: number };
}

/** Géocodage inverse best-effort (API Adresse) — jamais bloquant. */
async function reverseCity(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lng}`,
    );
    if (!res.ok) return '';
    const json = await res.json();
    return json?.features?.[0]?.properties?.city || '';
  } catch {
    return '';
  }
}

const AdminImportParcours: React.FC = () => {
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTrack | null>(null);
  const [steps, setSteps] = useState<EditableStep[]>([]);

  // Exploration
  const [expName, setExpName] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expType, setExpType] = useState('eco_poetique');
  const [expRadius, setExpRadius] = useState('500');
  const [expLoop, setExpLoop] = useState(false);
  const [expPublished, setExpPublished] = useState(true);

  // Événement
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState(new Date().toISOString().slice(0, 10));
  const [evtLieu, setEvtLieu] = useState('');
  const [evtType, setEvtType] = useState('eco_poetique');
  const [evtPublic, setEvtPublic] = useState(true);

  const [importWaypoints, setImportWaypoints] = useState(false);
  const [collectBio, setCollectBio] = useState(true);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const selected = useMemo(() => steps.filter((s) => s.selected), [steps]);

  const mapSteps = useMemo(
    () =>
      selected.map((s, i) => ({
        id: s.id,
        latitude: s.lat,
        longitude: s.lng,
        label: s.name,
        ordre: i + 1,
      })),
    [selected],
  );

  const polyline = useMemo<Array<[number, number]>>(
    () => (parsed?.track || []).map((p) => [p.lat, p.lng] as [number, number]),
    [parsed],
  );

  const bounds = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = selected.map((s) => [s.lat, s.lng]);
    return pts.length > 0 ? pts : polyline;
  }, [selected, polyline]);

  const handleFile = async (file: File) => {
    setParseError(null);
    setResult(null);
    setParsing(true);
    setFileName(file.name);
    try {
      const track = await parseTrackFile(file);
      setParsed(track);

      const baseSteps: EditableStep[] = track.steps.map((s) => ({
        id: s.id,
        name: s.name,
        ville: '',
        description: s.description,
        lat: s.lat,
        lng: s.lng,
        selected: true,
      }));
      setSteps(baseSteps);

      setExpName((v) => v || track.documentName);
      setEvtTitle((v) => v || track.documentName);

      // Géocodage inverse best-effort, séquentiel et non bloquant
      (async () => {
        for (const s of baseSteps) {
          const city = await reverseCity(s.lat, s.lng);
          if (city) {
            setSteps((prev) => prev.map((p) => (p.id === s.id ? { ...p, ville: p.ville || city } : p)));
            setEvtLieu((v) => v || city);
          }
        }
      })();
    } catch (e: any) {
      setParsed(null);
      setSteps([]);
      setParseError(e?.message || 'Fichier illisible.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins une étape.');
      return;
    }
    setImporting(true);
    try {
      const waypoints =
        importWaypoints && parsed?.track?.length
          ? parsed.track.map((p) => ({ lat: p.lat, lng: p.lng, afterIndex: 0 }))
          : [];

      const { data, error } = await supabase.functions.invoke('import-parcours', {
        body: {
          exploration: {
            name: expName.trim(),
            description: expDescription.trim() || null,
            exploration_type: expType,
            default_radius_m: parseInt(expRadius, 10) || null,
            is_loop: expLoop,
            published: expPublished,
          },
          event: {
            title: evtTitle.trim(),
            date_marche: new Date(`${evtDate}T09:00:00`).toISOString(),
            lieu: evtLieu.trim() || null,
            event_type: evtType,
            is_public: evtPublic,
          },
          steps: selected.map((s) => ({
            name: s.name.trim(),
            ville: s.ville.trim(),
            description: s.description || null,
            lat: s.lat,
            lng: s.lng,
          })),
          waypoints,
        },
      });

      if (error) throw new Error((error as any)?.message || "L'import a échoué.");
      if ((data as any)?.error) throw new Error((data as any).error);

      const res = data as ImportResult;
      setResult(res);
      toast.success('Parcours importé ✨', {
        description: `${res.counts.marches} marches créées et reliées à l'exploration.`,
      });

      if (collectBio) {
        for (const marcheId of ((data as any).marcheIds || []) as string[]) {
          supabase.functions
            .invoke('collect-biodiversity-step', { body: { marcheId } })
            .catch((e) => console.warn('[import-parcours] collecte différée:', e));
        }
        toast.message('Collecte biodiversité lancée', {
          description: 'Elle se poursuit en arrière-plan, étape par étape.',
        });
      }
    } catch (e: any) {
      console.error('[AdminImportParcours] échec:', e);
      toast.error("Import interrompu", { description: e?.message || 'Erreur inconnue. Rien n\'a été conservé.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/outils">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Outils
            </Link>
          </Button>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-primary" />
            Importer un parcours
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Un fichier KML, KMZ ou GPX devient un parcours complet : une marche par point, une
            exploration qui les regroupe, et l'événement public associé.
          </p>
        </header>

        <TrackDropzone onFile={handleFile} isParsing={parsing} error={parseError} fileName={fileName} />

        {parsed && steps.length > 0 && (
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden h-[420px]">
                <RichMap
                  bounds={bounds}
                  height="100%"
                  controls={{ zoom: true, style: true, geolocate: false }}
                  marcheRoute={{
                    steps: mapSteps,
                    polylinePositions: polyline.length > 1 ? polyline : undefined,
                    isLoop: expLoop,
                  }}
                />
              </Card>

              <StepsEditorTable steps={steps} onChange={setSteps} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-5 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  L'exploration
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="exp-name">Nom</Label>
                  <Input id="exp-name" value={expName} onChange={(e) => setExpName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-desc">Description</Label>
                  <Textarea
                    id="exp-desc"
                    rows={3}
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={expType} onValueChange={setExpType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agroecologique">Agroécologique</SelectItem>
                        <SelectItem value="eco_poetique">Éco-poétique</SelectItem>
                        <SelectItem value="eco_tourisme">Éco-tourisme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-radius">Rayon de collecte (m)</Label>
                    <Input
                      id="exp-radius"
                      type="number"
                      value={expRadius}
                      onChange={(e) => setExpRadius(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="exp-loop" className="text-sm font-normal">Parcours en boucle</Label>
                  <Switch id="exp-loop" checked={expLoop} onCheckedChange={setExpLoop} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="exp-pub" className="text-sm font-normal">Exploration publiée</Label>
                  <Switch id="exp-pub" checked={expPublished} onCheckedChange={setExpPublished} />
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  L'événement
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="evt-title">Titre</Label>
                  <Input id="evt-title" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="evt-date">Date</Label>
                    <Input
                      id="evt-date"
                      type="date"
                      value={evtDate}
                      onChange={(e) => setEvtDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-lieu">Lieu</Label>
                    <Input id="evt-lieu" value={evtLieu} onChange={(e) => setEvtLieu(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type d'événement</Label>
                  <Select value={evtType} onValueChange={setEvtType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agroecologique">Agroécologique</SelectItem>
                      <SelectItem value="eco_poetique">Éco-poétique</SelectItem>
                      <SelectItem value="eco_tourisme">Éco-tourisme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="evt-public" className="text-sm font-normal">
                    Publier la page publique (/m/…)
                  </Label>
                  <Switch id="evt-public" checked={evtPublic} onCheckedChange={setEvtPublic} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="evt-wp" className="text-sm font-normal">
                    Verser le tracé en waypoints
                  </Label>
                  <Switch id="evt-wp" checked={importWaypoints} onCheckedChange={setImportWaypoints} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="evt-bio" className="text-sm font-normal">
                    Lancer la collecte biodiversité
                  </Label>
                  <Switch id="evt-bio" checked={collectBio} onCheckedChange={setCollectBio} />
                </div>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button size="lg" onClick={handleImport} disabled={importing || selected.length === 0}>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours…
                  </>
                ) : (
                  `Importer ${selected.length} étape${selected.length > 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </>
        )}

        {result && (
          <Card className="p-6 space-y-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Parcours importé
            </div>
            <p className="text-sm text-muted-foreground">
              {result.counts.marches} marche{result.counts.marches > 1 ? 's' : ''} créée
              {result.counts.marches > 1 ? 's' : ''}, exploration « {result.exploration.name} » liée
              {result.counts.waypoints > 0 && `, ${result.counts.waypoints} waypoints`}
              {result.event.public_slug ? `, événement publié.` : `, événement créé (non publié).`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/explorations/${result.exploration.id}/marches`}>
                  Ouvrir l'exploration
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/marche-events/${result.event.id}`}>Ouvrir l'événement</Link>
              </Button>
              {result.event.public_slug && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/m/${result.event.public_slug}`} target="_blank" rel="noreferrer">
                    Voir la page publique
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminImportParcours;
