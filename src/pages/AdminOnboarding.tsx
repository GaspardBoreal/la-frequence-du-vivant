import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Images, ListTree, Info, Compass, LayoutGrid, Layers } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import {
  useOnboardingGallery,
  saveGardenType,
  saveGardenExample,
  deleteGardenType,
  deleteGardenExample,
  type GardenType,
  type GardenExample,
} from '@/hooks/onboarding/useOnboardingConfig';
import { PERSONAS, PERSONA_LABELS, type Persona } from '@/config/onboarding/personas';
import { DEFAULT_SEQUENCE } from '@/config/onboarding/defaultSequence';
import { buildSequence } from '@/config/onboarding/schema';
import ImageUploadField from '@/components/onboarding/ImageUploadField';
import LotImportCard from '@/components/onboarding/LotImportCard';
import ExamplesTypeView from '@/components/onboarding/admin/ExamplesTypeView';
import ExamplesVignetteView from '@/components/onboarding/admin/ExamplesVignetteView';
import ExamplesBoussoleView from '@/components/onboarding/admin/ExamplesBoussoleView';


const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Bandeau affiché tant que les tables ne sont pas créées dans la base partagée. */
const NotReady: React.FC = () => (
  <Card className="border-amber-500/30 bg-amber-500/5 p-5">
    <div className="flex gap-3">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
      <div className="text-sm">
        <p className="font-medium text-foreground">Configuration non encore active en base</p>
        <p className="mt-1 text-muted-foreground">
          Les tables <code>onboarding_garden_types</code>, <code>onboarding_garden_examples</code> et{' '}
          <code>onboarding_flow_versions</code> n’existent pas encore dans la base partagée. Le parcours d’accueil
          fonctionne sur le registre livré dans l’application ; la galerie devient éditable dès que le SQL de{' '}
          <code>docs/onboarding/sql-a-appliquer-base-partagee.sql</code> est appliqué côté projet source.
        </p>
      </div>
    </div>
  </Card>
);

const emptyType: Partial<GardenType> = {
  titre: '',
  sous_titre: '',
  image_url: '',
  personas: [],
  position: 0,
  visible: true,
};

/**
 * Zone de saisie JSON tolérante : le texte est libre, l'objet n'est propagé
 * que s'il est valide (vide = null). Le `key` côté parent force la
 * réinitialisation quand on édite une autre ligne.
 */
const JsonTextarea: React.FC<{
  label: string;
  value: Record<string, unknown> | null | undefined;
  onChange: (v: Record<string, unknown> | null) => void;
  rows?: number;
}> = ({ label, value, onChange, rows = 4 }) => {
  const [text, setText] = useState(() => (value ? JSON.stringify(value, null, 2) : ''));
  const [invalid, setInvalid] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        rows={rows}
        value={text}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          if (!t.trim()) {
            setInvalid(false);
            onChange(null);
            return;
          }
          try {
            const parsed = JSON.parse(t);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              setInvalid(false);
              onChange(parsed as Record<string, unknown>);
            } else {
              setInvalid(true);
            }
          } catch {
            setInvalid(true);
          }
        }}
        className={`font-mono text-xs ${invalid ? 'border-destructive' : ''}`}
        placeholder="{ … }"
      />
      {invalid && <p className="mt-1 text-xs text-destructive">JSON objet invalide — non enregistré tel quel.</p>}
    </div>
  );
};

const AdminOnboarding: React.FC = () => {
  const { types, examples, available, loading, reload } = useOnboardingGallery();
  const [typeDraft, setTypeDraft] = useState<Partial<GardenType> | null>(null);
  const [exampleDraft, setExampleDraft] = useState<Partial<GardenExample> | null>(null);
  const [persona, setPersona] = useState<Persona>('PARTICULIER_PETIT');

  // Sous-menu actif de l'onglet Exemples : « Type » (défaut), « Vignette »,
  // « Boussole ». Persisté dans l'URL (?es=) pour rester partageable.
  const [searchParams, setSearchParams] = useSearchParams();
  const subView = searchParams.get('es') ?? 'type';
  const setSubView = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === 'type') next.delete('es');
    else next.set('es', v);
    setSearchParams(next, { replace: true });
  };

  const handleDeleteExample = async (e: GardenExample) => {
    await deleteGardenExample(e.id);
    void reload();
  };
  const handleSetCover = async (t: GardenType, e: GardenExample) => {
    if (!e.image_url) return;
    await saveGardenType({ id: t.id, image_url: e.image_url });
    toast.success('Image de couverture mise à jour');
    void reload();
  };

  // Ouvre le formulaire d'exemple : soit en création rattachée à un type
  // (onAdd), soit en édition d'un exemple existant (onEdit).
  const openExForm = (target: GardenType | GardenExample, nextPosition?: number) => {
    if ('type_id' in target) setExampleDraft({ ...target });
    else setExampleDraft({ type_id: target.id, position: nextPosition ?? 0, publie: true });
  };

  const previewAnswers = useMemo(() => {
    const base: Record<string, string | number> = {};
    if (persona === 'URBAIN_BALCON' || persona === 'ENTREPRISE_URBAINE') base.lieu = 'balcon';
    else base.lieu = 'terrain_nu';
    base.profil =
      persona === 'COLLECTIVITE' ? 'collectivite' : persona.startsWith('ENTREPRISE') ? 'entreprise' : 'particulier';
    base.surface_totale = persona === 'PARTICULIER_GRAND' ? 8000 : 800;
    base.priorite = 'legumes_famille';
    return base;
  }, [persona]);

  const preview = useMemo(
    () => buildSequence(DEFAULT_SEQUENCE.questions, previewAnswers, persona),
    [previewAnswers, persona],
  );

  const persistType = async () => {
    if (!typeDraft?.titre) return;
    const payload = { ...typeDraft, slug: typeDraft.slug || slugify(typeDraft.titre) };
    const { error } = (await saveGardenType(payload)) ?? {};
    if (error) toast.error('Enregistrement impossible');
    else {
      toast.success('Type de jardin enregistré');
      setTypeDraft(null);
      void reload();
    }
  };

  const persistExample = async () => {
    if (!exampleDraft?.titre || !exampleDraft.type_id) return;
    const { error } = (await saveGardenExample(exampleDraft)) ?? {};
    if (error) toast.error('Enregistrement impossible');
    else {
      toast.success('Exemple enregistré');
      setExampleDraft(null);
      void reload();
    }
  };

  const move = async (type: GardenType, delta: number) => {
    const ordered = [...types].sort((a, b) => a.position - b.position);
    const i = ordered.findIndex((t) => t.id === type.id);
    const j = i + delta;
    if (j < 0 || j >= ordered.length) return;
    await saveGardenType({ id: ordered[i].id, position: ordered[j].position });
    await saveGardenType({ id: ordered[j].id, position: ordered[i].position });
    void reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Onboarding — administration Fréquence Jardin</title>
        <meta name="description" content="Gérer les types de jardins, les exemples de galerie et la séquence du parcours d’accueil." />
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/admin" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l’administration
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
          <p className="mt-1 text-muted-foreground">
            Galeries de jardins, exemples et séquence du parcours d’accueil, persona par persona.
          </p>
        </header>

        {available === false && (
          <div className="mb-6">
            <NotReady />
          </div>
        )}

        <Tabs defaultValue="types">
          <TabsList className="mb-6">
            <TabsTrigger value="types">
              <Images className="mr-2 h-4 w-4" />
              Types de jardins
            </TabsTrigger>
            <TabsTrigger value="exemples">Exemples</TabsTrigger>
            <TabsTrigger value="sequence">
              <ListTree className="mr-2 h-4 w-4" />
              Séquence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setTypeDraft({ ...emptyType, position: types.length })} disabled={!available}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau type
              </Button>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {available && types.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">Aucun type pour l’instant.</p>
            )}

            {[...types]
              .sort((a, b) => a.position - b.position)
              .map((t) => (
                <Card key={t.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {t.image_url && <img src={t.image_url} alt={t.titre} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{t.titre}</p>
                      {!t.visible && <Badge variant="outline">masqué</Badge>}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{t.sous_titre}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {examples.filter((e) => e.type_id === t.id).length} exemple(s)
                      {t.personas && t.personas.length > 0 && ` · ${t.personas.length} persona(s)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => void move(t, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void move(t, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setTypeDraft(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        if (!window.confirm(`Supprimer « ${t.titre} » et ses exemples ?`)) return;
                        await deleteGardenType(t.id);
                        void reload();
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="exemples" className="space-y-6">
            <LotImportCard onDone={() => void reload()} />

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'type', label: 'Type', icon: Layers },
                  { id: 'vignette', label: 'Vignette', icon: LayoutGrid },
                  { id: 'boussole', label: 'Boussole', icon: Compass },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  size="sm"
                  variant={subView === id ? 'default' : 'outline'}
                  onClick={() => setSubView(id)}
                  aria-pressed={subView === id}
                >
                  <Icon className="mr-1.5 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            {subView === 'vignette' ? (
              <ExamplesVignetteView
                types={types}
                examples={examples}
                onEdit={openExForm}
                onDelete={(e) => void handleDeleteExample(e)}
              />
            ) : subView === 'boussole' ? (
              <ExamplesBoussoleView
                types={types}
                examples={examples}
                onEdit={openExForm}
                onDelete={(e) => void handleDeleteExample(e)}
              />
            ) : (
              <ExamplesTypeView
                types={types}
                examples={examples}
                onAdd={openExForm}
                onEdit={openExForm}
                onDelete={(e) => void handleDeleteExample(e)}
                onSetCover={(t, e) => void handleSetCover(t, e)}
              />
            )}
          </TabsContent>

          <TabsContent value="sequence" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PERSONAS.map((p) => (
                <Button key={p} size="sm" variant={p === persona ? 'default' : 'outline'} onClick={() => setPersona(p)}>
                  {PERSONA_LABELS[p]}
                </Button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  {preview.length} écran(s) posés pour cette persona — séquence v{DEFAULT_SEQUENCE.version}.
                </p>
                <ol className="space-y-2">
                  {preview.map((q, i) => (
                    <li key={q.id} className="rounded-xl border border-border/60 p-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium">
                          {i + 1}. {q.title}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {q.chapter}
                        </Badge>
                      </div>
                      {q.subtitle && <p className="mt-1 text-xs text-muted-foreground">{q.subtitle}</p>}
                      {q.options && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {q.options.map((o) => o.label).join(' · ')}
                        </p>
                      )}
                      {q.slider && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Curseur {q.slider.min} → {q.slider.max} {q.slider.unit}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </Card>

              <div className="lg:sticky lg:top-6">
                <div className="mx-auto w-[300px] rounded-[2.2rem] border-8 border-foreground/80 bg-background p-4 shadow-xl">
                  <div className="flex h-[560px] flex-col overflow-hidden">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Aperçu mobile</p>
                    <div className="mt-3 space-y-3 overflow-y-auto pr-1">
                      {preview.slice(0, 4).map((q) => (
                        <div key={q.id} className="rounded-2xl border border-border/60 p-3">
                          <p className="text-[15px] font-semibold leading-tight">{q.title}</p>
                          {q.subtitle && <p className="mt-1 text-[11px] text-muted-foreground">{q.subtitle}</p>}
                          <div className="mt-2 space-y-1.5">
                            {(q.options ?? []).slice(0, 4).map((o) => (
                              <div key={o.value} className="rounded-xl bg-muted/50 px-3 py-2 text-[12px]">
                                {o.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Édition des libellés en base : disponible une fois le SQL appliqué.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Formulaire type de jardin */}
      <Dialog open={Boolean(typeDraft)} onOpenChange={(o) => !o && setTypeDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{typeDraft?.id ? 'Modifier le type' : 'Nouveau type de jardin'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={typeDraft?.titre ?? ''} onChange={(e) => setTypeDraft({ ...typeDraft, titre: e.target.value })} />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input
                value={typeDraft?.sous_titre ?? ''}
                onChange={(e) => setTypeDraft({ ...typeDraft, sous_titre: e.target.value })}
              />
            </div>
            <ImageUploadField
              label="Image de couverture"
              value={typeDraft?.image_url ?? ''}
              onChange={(url) => setTypeDraft({ ...typeDraft, image_url: url })}
              buildPath={(ext) =>
                `types/${typeDraft?.slug || slugify(typeDraft?.titre || 'sans-titre')}-${Date.now()}.${ext}`
              }
            />

            <div>
              <Label className="mb-2 block">Personae concernées</Label>
              <div className="flex flex-wrap gap-2">
                {PERSONAS.map((p) => {
                  const on = (typeDraft?.personas ?? []).includes(p);
                  return (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={on ? 'default' : 'outline'}
                      onClick={() =>
                        setTypeDraft({
                          ...typeDraft,
                          personas: on
                            ? (typeDraft?.personas ?? []).filter((x) => x !== p)
                            : [...(typeDraft?.personas ?? []), p],
                        })
                      }
                    >
                      {PERSONA_LABELS[p]}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Métadonnées éditoriales (lots d'exemples)
              </p>
              <div>
                <Label>Identifiant stable</Label>
                <Input
                  value={typeDraft?.stable_id ?? ''}
                  onChange={(e) => setTypeDraft({ ...typeDraft, stable_id: e.target.value || null })}
                  placeholder="jardin_nourricier"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>Promesse (baseline)</Label>
                <Input
                  value={typeDraft?.baseline ?? ''}
                  onChange={(e) => setTypeDraft({ ...typeDraft, baseline: e.target.value || null })}
                  placeholder="Nourrir sa famille en beauté"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Locale</Label>
                  <Input
                    value={typeDraft?.locale ?? ''}
                    onChange={(e) => setTypeDraft({ ...typeDraft, locale: e.target.value || null })}
                    placeholder="fr-FR"
                  />
                </div>
                <div>
                  <Label>Périmètre climat</Label>
                  <Input
                    value={typeDraft?.climate_scope ?? ''}
                    onChange={(e) => setTypeDraft({ ...typeDraft, climate_scope: e.target.value || null })}
                    placeholder="métropole"
                  />
                </div>
              </div>
              <JsonTextarea
                key={`spec-${typeDraft?.id ?? 'new'}`}
                label="Spec images (JSON)"
                rows={3}
                value={typeDraft?.image_spec}
                onChange={(v) => setTypeDraft({ ...typeDraft, image_spec: v })}
              />
              <JsonTextarea
                key={`logic-${typeDraft?.id ?? 'new'}`}
                label="Logique de génération (JSON)"
                rows={5}
                value={typeDraft?.generation_logic}
                onChange={(v) => setTypeDraft({ ...typeDraft, generation_logic: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Visible dans le parcours</Label>
              <Switch
                id="visible"
                checked={typeDraft?.visible ?? true}
                onCheckedChange={(v) => setTypeDraft({ ...typeDraft, visible: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDraft(null)}>
              Annuler
            </Button>
            <Button onClick={() => void persistType()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulaire exemple */}
      <Dialog open={Boolean(exampleDraft)} onOpenChange={(o) => !o && setExampleDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{exampleDraft?.id ? 'Modifier l’exemple' : 'Nouvel exemple'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={exampleDraft?.titre ?? ''}
                onChange={(e) => setExampleDraft({ ...exampleDraft, titre: e.target.value })}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input
                value={exampleDraft?.sous_titre ?? ''}
                onChange={(e) => setExampleDraft({ ...exampleDraft, sous_titre: e.target.value })}
              />
            </div>
            <ImageUploadField
              label="Photo de l’exemple"
              value={exampleDraft?.image_url ?? ''}
              onChange={(url) => setExampleDraft({ ...exampleDraft, image_url: url })}
              buildPath={(ext) =>
                `exemples/${slugify(types.find((t) => t.id === exampleDraft?.type_id)?.slug || types.find((t) => t.id === exampleDraft?.type_id)?.titre || 'sans-titre')}/${Date.now()}.${ext}`
              }
            />
            <ImageUploadField
              label="Vignette (360 × 240)"
              value={exampleDraft?.thumbnail_url ?? ''}
              onChange={(url) => setExampleDraft({ ...exampleDraft, thumbnail_url: url })}
              buildPath={(ext) =>
                `exemples/${slugify(types.find((t) => t.id === exampleDraft?.type_id)?.slug || 'sans-titre')}/vignette-${Date.now()}.${ext}`
              }
            />
            <div>
              <Label>Texte alternatif de l'image</Label>
              <Textarea
                rows={2}
                value={exampleDraft?.image_alt ?? ''}
                onChange={(e) => setExampleDraft({ ...exampleDraft, image_alt: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Intention jardinier</Label>
              <Textarea
                rows={2}
                value={exampleDraft?.user_intent ?? ''}
                onChange={(e) => setExampleDraft({ ...exampleDraft, user_intent: e.target.value || null })}
                placeholder="Je veux nourrir ma famille…"
              />
            </div>
            <div>
              <Label>Mots-clés (séparés par des virgules)</Label>
              <Input
                value={(exampleDraft?.keywords ?? []).join(', ')}
                onChange={(e) =>
                  setExampleDraft({
                    ...exampleDraft,
                    keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="légumes, famille, autonomie"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position</Label>
                <Input
                  type="number"
                  value={exampleDraft?.position ?? 0}
                  onChange={(e) => setExampleDraft({ ...exampleDraft, position: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Identifiant stable</Label>
                <Input
                  value={exampleDraft?.stable_id ?? ''}
                  onChange={(e) => setExampleDraft({ ...exampleDraft, stable_id: e.target.value || null })}
                  placeholder="potager_en_carres"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <JsonTextarea
              key={`ai-${exampleDraft?.id ?? 'new'}`}
              label="Profil IA (JSON)"
              rows={5}
              value={exampleDraft?.ai_profile}
              onChange={(v) => setExampleDraft({ ...exampleDraft, ai_profile: v })}
            />

            <div>
              <Label>URL source</Label>
              <Input
                value={exampleDraft?.source_url ?? ''}
                onChange={(e) => setExampleDraft({ ...exampleDraft, source_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={exampleDraft?.description ?? ''}
                onChange={(e) => setExampleDraft({ ...exampleDraft, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="publie">Publié</Label>
              <Switch
                id="publie"
                checked={exampleDraft?.publie ?? true}
                onCheckedChange={(v) => setExampleDraft({ ...exampleDraft, publie: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExampleDraft(null)}>
              Annuler
            </Button>
            <Button onClick={() => void persistExample()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOnboarding;
