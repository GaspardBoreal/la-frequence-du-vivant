import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Sparkles, MapPin, Feather, Users, Compass, Sun, Sunrise, Sunset, Moon, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { pickPhotos, fetchEvents, fetchEventById, type EventSnapshot, type PickedPhoto } from './renderer/photoPicker';
import { renderWallpaper, type Theme } from './renderer/wallpaperCanvas';
import WallpaperPreviewModal from './WallpaperPreviewModal';
import CommunityGallery from './CommunityGallery';

type Scope = 'all' | 'event';
type Category = 'species' | 'landscape' | 'walkers' | 'territory';
type Ambiance = 'dawn' | 'day' | 'dusk' | 'night';

interface Proposal {
  seed: number;
  previewUrl: string;
  photos: PickedPhoto[];
  event: EventSnapshot | null;
  theme: Theme;
  category: Category;
  ambiance: Ambiance;
}

const THEMES: { id: Theme; title: string; subtitle: string; accent: string }[] = [
  { id: 'frequence', title: 'La Fréquence du Vivant', subtitle: 'L\'écoute large du territoire', accent: 'from-emerald-700/40 to-amber-300/30' },
  { id: 'marches', title: 'Les Marches du Vivant', subtitle: 'Marcher, écouter, habiter', accent: 'from-amber-700/40 to-emerald-400/30' },
];

const CATEGORIES: { id: Category; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'species', label: 'Espèce vedette', icon: Feather, hint: 'La constellation des vivants observés' },
  { id: 'landscape', label: 'Paysage', icon: MapPin, hint: 'Le territoire dans son souffle' },
  { id: 'walkers', label: 'Mosaïque marcheurs', icon: Users, hint: 'Les regards de la communauté' },
  { id: 'territory', label: 'Empreinte territoire', icon: Compass, hint: 'La signature d\'un lieu' },
];

const AMBIANCES: { id: Ambiance; label: string; icon: React.ElementType }[] = [
  { id: 'dawn', label: 'Aube', icon: Sunrise },
  { id: 'day', label: 'Jour', icon: Sun },
  { id: 'dusk', label: 'Crépuscule', icon: Sunset },
  { id: 'night', label: 'Nuit', icon: Moon },
];

const PREVIEW_W = 800;
const PREVIEW_H = 450;

const WallpaperStudio: React.FC = () => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [scope, setScope] = useState<Scope | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventSnapshot[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [ambiance, setAmbiance] = useState<Ambiance | null>(null);
  const [generating, setGenerating] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [comboOpen, setComboOpen] = useState(false);

  useEffect(() => {
    fetchEvents().then(setEvents);
  }, []);

  const canGenerate = theme && scope && (scope === 'all' || eventId) && category && ambiance;
  const selectedEvent = useMemo(() => events.find((e) => e.id === eventId) || null, [events, eventId]);

  async function handleGenerate() {
    if (!theme || !category || !ambiance) return;
    setGenerating(true);
    setProposals([]);
    try {
      const evt = eventId ? await fetchEventById(eventId) : null;
      const seeds = [Date.now(), Date.now() + 97, Date.now() + 313, Date.now() + 719];
      const results: Proposal[] = [];
      for (const seed of seeds) {
        const photos = await pickPhotos({ category, ambiance, eventId: eventId ?? undefined, count: 5 });
        if (photos.length === 0) continue;
        const qrTarget = evt?.slug
          ? `https://la-frequence-du-vivant.com/m/${evt.slug}`
          : theme === 'frequence'
          ? 'https://la-frequence-du-vivant.com'
          : 'https://la-frequence-du-vivant.com/marches-du-vivant';
        const canvas = await renderWallpaper({
          width: PREVIEW_W,
          height: PREVIEW_H,
          theme,
          photos,
          event: evt,
          category,
          ambiance,
          qrTarget,
          seed,
        });
        results.push({
          seed,
          previewUrl: canvas.toDataURL('image/jpeg', 0.85),
          photos,
          event: evt,
          theme,
          category,
          ambiance,
        });
        setProposals([...results]);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section id="studio-fonds-ecran" className="relative z-10 py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-4 border-amber-500/40 text-amber-600 dark:text-amber-300">
            <Sparkles className="w-4 h-4 mr-2" />
            Studio · Nouveauté
          </Badge>
          <h2 className="font-crimson text-3xl md:text-4xl text-foreground mb-3">
            Studio de fonds d'écran vivants
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-crimson italic">
            Compose ton fond d'écran à partir des vraies photos des marches et des espèces observées.
            Chaque écran devient un fragment de territoire qui respire.
          </p>
        </motion.div>

        {/* Wizard */}
        <div className="space-y-8">
          {/* Step 1: Theme */}
          <WizardStep number={1} title="Choisis ton univers" active={!theme}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border p-6 text-left transition-all',
                    'bg-gradient-to-br backdrop-blur-sm hover:scale-[1.01]',
                    t.accent,
                    theme === t.id ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-border/40',
                  )}
                >
                  <div className="relative z-10">
                    <div className="font-crimson italic text-2xl text-foreground mb-2">{t.title}</div>
                    <div className="text-sm text-muted-foreground">{t.subtitle}</div>
                  </div>
                  {theme === t.id && (
                    <Check className="absolute top-4 right-4 w-5 h-5 text-amber-500" />
                  )}
                </button>
              ))}
            </div>
          </WizardStep>

          {/* Step 2: Scope */}
          {theme && (
            <WizardStep number={2} title="Une marche ou toute la Fréquence ?" active={!scope || (scope === 'event' && !eventId)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => { setScope('all'); setEventId(null); }}
                  className={cn(
                    'rounded-2xl border p-5 text-left transition-all bg-card/40 backdrop-blur-sm hover:bg-card/60',
                    scope === 'all' ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-border/40',
                  )}
                >
                  <div className="font-crimson text-lg mb-1">Toutes les marches</div>
                  <div className="text-sm text-muted-foreground">Une mosaïque à l'échelle de la Fréquence</div>
                </button>
                <div className={cn(
                  'rounded-2xl border p-5 bg-card/40 backdrop-blur-sm transition-all',
                  scope === 'event' ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-border/40',
                )}>
                  <button
                    onClick={() => setScope('event')}
                    className="w-full text-left mb-3"
                  >
                    <div className="font-crimson text-lg mb-1">Un événement spécifique</div>
                    <div className="text-sm text-muted-foreground">Choisis une marche précise</div>
                  </button>
                  {scope === 'event' && (
                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {selectedEvent ? (
                            <span className="truncate">{selectedEvent.title}</span>
                          ) : (
                            <span className="text-muted-foreground">Sélectionner une marche…</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Chercher une marche…" />
                          <CommandList>
                            <CommandEmpty>Aucune marche trouvée</CommandEmpty>
                            <CommandGroup>
                              {events.map((e) => (
                                <CommandItem
                                  key={e.id}
                                  value={`${e.title} ${e.commune ?? ''}`}
                                  onSelect={() => { setEventId(e.id); setComboOpen(false); }}
                                >
                                  <div className="flex flex-col">
                                    <span>{e.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {e.commune} {e.date ? `· ${new Date(e.date).toLocaleDateString('fr-FR')}` : ''}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </WizardStep>
          )}

          {/* Step 3: Category + Ambiance */}
          {theme && scope && (scope === 'all' || eventId) && (
            <WizardStep number={3} title="Angle & ambiance" active={!category || !ambiance}>
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Catégorie</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCategory(c.id)}
                          className={cn(
                            'rounded-xl border p-4 text-left transition-all bg-card/40 backdrop-blur-sm',
                            'hover:bg-card/60',
                            category === c.id ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-border/40',
                          )}
                        >
                          <Icon className="w-5 h-5 mb-2 text-emerald-600 dark:text-emerald-400" />
                          <div className="font-medium text-sm">{c.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{c.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Ambiance</div>
                  <div className="grid grid-cols-4 gap-3">
                    {AMBIANCES.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setAmbiance(a.id)}
                          className={cn(
                            'rounded-xl border p-3 flex flex-col items-center gap-1 transition-all bg-card/40 backdrop-blur-sm',
                            'hover:bg-card/60',
                            ambiance === a.id ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-border/40',
                          )}
                        >
                          <Icon className="w-5 h-5 text-amber-500" />
                          <span className="text-sm">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </WizardStep>
          )}

          {/* CTA */}
          {canGenerate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-emerald-700 to-amber-500 hover:from-emerald-800 hover:to-amber-600 text-white font-crimson text-lg px-8 py-6 rounded-2xl shadow-lg"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Composition en cours…</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" /> Générer 4 propositions</>
                )}
              </Button>
            </motion.div>
          )}

          {/* Proposals */}
          <AnimatePresence>
            {proposals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {proposals.map((p, i) => (
                  <motion.button
                    key={p.seed}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelected(p)}
                    className="group relative overflow-hidden rounded-2xl border border-border/40 bg-black/20 aspect-video shadow-lg hover:scale-[1.01] transition-transform"
                  >
                    <img src={p.previewUrl} alt={`Proposition ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <Badge className="bg-amber-500 text-black">Ouvrir & installer</Badge>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {generating && proposals.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="aspect-video animate-pulse bg-muted/30 border-border/30" />
              ))}
            </div>
          )}
        </div>

        {/* Community gallery */}
        <div className="mt-20">
          <CommunityGallery onOpen={(item) => {
            // Adapter DB row to Proposal-like preview using stored preview_url
            if (!item.preview_url) return;
            setSelected({
              seed: 0,
              previewUrl: item.preview_url,
              photos: [],
              event: null,
              theme: item.theme as Theme,
              category: item.category as Category,
              ambiance: item.ambiance as Ambiance,
            });
          }} />
        </div>
      </div>

      {/* Preview modal */}
      {selected && (
        <WallpaperPreviewModal
          open={!!selected}
          onClose={() => setSelected(null)}
          proposal={selected}
        />
      )}
    </section>
  );
};

const WizardStep: React.FC<{ number: number; title: string; active: boolean; children: React.ReactNode }> = ({
  number, title, active, children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm p-6"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
        active ? 'bg-amber-500 text-black' : 'bg-emerald-700 text-white',
      )}>
        {number}
      </div>
      <h3 className="font-crimson text-xl text-foreground">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export default WallpaperStudio;
