import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sprout, KeyRound, MapPin, Star, ArrowRight, Loader2, Crosshair, Copy, Check, Share2, Sparkles,
} from 'lucide-react';

import { useAuthContext } from '@/contexts/AuthContext';
import { useUserAppsAccess } from '@/hooks/useUserAppsAccess';
import { supabase } from '@/integrations/supabase/client';
import {
  useCreatePropriete, useJoinPropriete, useCreateInvitation, type InvitationRole,
} from '@/hooks/propriete/useOnboardPropriete';
import GardenExampleGallery, {
  type GardenStyleSelection,
} from '@/components/onboarding/GardenExampleGallery';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const ROLE_LABELS: Record<InvitationRole, string> = {
  prestataire: 'Prestataire — jardinier, paysagiste, intervenant',
  marcheur_historique: 'Marcheur — regard complice sur le jardin',
};

/**
 * Écran d'entrée de Fréquence Jardin : ouvrir un jardin existant,
 * en créer un nouveau, ou en rejoindre un avec un code d'invitation.
 */
export default function JardinDemarrer() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { data: access, isLoading: accessLoading } = useUserAppsAccess(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/marches-du-vivant/connexion', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const proprietes = access?.proprietesAccessibles ?? [];
  const mesJardins = useMemo(
    () => proprietes.filter((p) => p.role === 'proprietaire'),
    [proprietes],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white">
      <Helmet>
        <title>Démarrer un jardin — Fréquence Jardin</title>
        <meta
          name="description"
          content="Ouvrez votre jardin, créez-en un nouveau ou rejoignez celui d'un proche avec un code d'invitation."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Sprout className="h-7 w-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Où commence votre jardin ?</h1>
          <p className="mt-2 text-sm text-emerald-100/70">
            Un jardin est un lieu vivant que l'on observe dans la durée. Ouvrez-en un,
            créez le vôtre, ou rejoignez celui qu'on vous a confié.
          </p>
        </header>

        {accessLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-emerald-100/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Nous cherchons vos jardins…
          </div>
        ) : (
          <div className="space-y-8">
            {proprietes.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] uppercase tracking-wide text-emerald-200/50">
                  Vos jardins
                </h2>
                <div className="grid gap-3">
                  {proprietes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/propriete/${p.slug}`)}
                      className="group flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-4 text-left transition-all hover:bg-white/10"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500/20">
                        {p.photo_hero_url ? (
                          <img src={p.photo_hero_url} alt={`Jardin ${p.nom}`} className="h-full w-full object-cover" />
                        ) : (
                          <Sprout className="h-5 w-5 text-emerald-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 font-semibold">
                          <span className="truncate">{p.nom}</span>
                          {p.is_main && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                              <Star className="h-3 w-3" /> Principal
                            </span>
                          )}
                          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">
                            {p.role}
                          </span>
                        </div>
                        {p.ville && (
                          <div className="mt-0.5 flex items-center gap-1 text-sm text-emerald-100/70">
                            <MapPin className="h-3.5 w-3.5" /> {p.ville}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-emerald-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <CreateGardenCard />
              <JoinGardenCard />
            </div>

            {mesJardins.length > 0 && <InvitePanel jardins={mesJardins} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Créer */

function CreateGardenCard() {
  const navigate = useNavigate();
  const create = useCreatePropriete();
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [style, setStyle] = useState<GardenStyleSelection | null>(null);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Votre navigateur ne partage pas la position.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
        toast.success('Position du jardin enregistrée.');
      },
      () => {
        setLocating(false);
        toast.error("Position indisponible — vous pourrez la préciser plus tard.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nom.trim().length < 2) {
      toast.error('Donnez un nom à votre jardin (2 caractères minimum).');
      return;
    }
    create.mutate(
      {
        nom: nom.trim(),
        ville: ville.trim() || null,
        codePostal: codePostal.trim() || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
      },
      {
        onSuccess: async (res) => {
          if (style && res.id) {
            const { error } = await (
              supabase as unknown as {
                rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
              }
            ).rpc('onboard_set_garden_style', {
              _propriete_id: res.id,
              _style: {
                type_stable_id: style.typeStableId,
                type_slug: style.typeSlug,
                example_stable_id: style.exampleStableId,
                example_title: style.exampleTitle,
                thumbnail: style.thumbnail,
                selected_at: new Date().toISOString(),
              },
            });
            if (error) console.warn('[onboarding] style non mémorisé :', error.message);
          }
          toast.success(`« ${res.nom} » est né. Bienvenue.`);
          navigate(`/propriete/${res.slug}`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-emerald-400/20 bg-white/5 p-5 backdrop-blur"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
          <Sprout className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <h2 className="font-semibold">Créer mon jardin</h2>
          <p className="text-xs text-emerald-100/60">Vous en devenez le propriétaire.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="jardin-nom" className="text-xs text-emerald-100/70">Nom du jardin</Label>
          <Input
            id="jardin-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={120}
            placeholder="Le Clos des Tilleuls"
            className="mt-1 border-white/15 bg-white/5 text-white placeholder:text-emerald-100/30"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label htmlFor="jardin-ville" className="text-xs text-emerald-100/70">Commune</Label>
            <Input
              id="jardin-ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Poitiers"
              className="mt-1 border-white/15 bg-white/5 text-white placeholder:text-emerald-100/30"
            />
          </div>
          <div>
            <Label htmlFor="jardin-cp" className="text-xs text-emerald-100/70">Code postal</Label>
            <Input
              id="jardin-cp"
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              placeholder="86000"
              className="mt-1 border-white/15 bg-white/5 text-white placeholder:text-emerald-100/30"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-400/30 px-3 py-2 text-xs text-emerald-200/80 transition-colors hover:bg-emerald-400/10 disabled:opacity-50"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          {coords
            ? `Position enregistrée (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
            : 'Situer le jardin depuis ma position'}
        </button>

        <details className="rounded-xl border border-emerald-400/15 bg-white/[0.03]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs text-emerald-100/80 transition-colors hover:text-emerald-50 [&::-webkit-details-marker]:hidden">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
            {style ? (
              <span className="flex min-w-0 items-center gap-2">
                {style.thumbnail && (
                  <img src={style.thumbnail} alt="" className="h-6 w-9 rounded object-cover" />
                )}
                <span className="truncate">
                  Modèle choisi : <strong className="text-emerald-50">{style.exampleTitle}</strong>
                </span>
              </span>
            ) : (
              'Choisir un modèle de jardin qui vous inspire (optionnel)'
            )}
          </summary>
          <div className="border-t border-white/10 p-3">
            <GardenExampleGallery
              defaultTypeStableId="jardin_nourricier"
              selected={style}
              onSelect={setStyle}
            />
          </div>
        </details>

        <Button
          type="submit"
          disabled={create.isPending}
          className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
        >
          {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le jardin
        </Button>
        <p className="text-[11px] text-emerald-100/40">
          Trois jardins maximum par 24 heures.
        </p>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- Rejoindre */

function JoinGardenCard() {
  const navigate = useNavigate();
  const join = useJoinPropriete();
  const [code, setCode] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 8) {
      toast.error('Un code d’invitation compte 8 caractères.');
      return;
    }
    join.mutate(code, {
      onSuccess: (res) => {
        toast.success(`Vous rejoignez « ${res.nom} ».`);
        navigate(`/propriete/${res.slug}`);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-amber-400/20 bg-white/5 p-5 backdrop-blur"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
          <KeyRound className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h2 className="font-semibold">Rejoindre un jardin</h2>
          <p className="text-xs text-emerald-100/60">Avec le code reçu de son propriétaire.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="jardin-code" className="text-xs text-emerald-100/70">Code d'invitation</Label>
          <Input
            id="jardin-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="XXXXXXXX"
            className="mt-1 border-white/15 bg-white/5 text-center font-mono text-lg tracking-[0.35em] text-white placeholder:tracking-[0.35em] placeholder:text-emerald-100/25"
          />
        </div>
        <Button
          type="submit"
          disabled={join.isPending}
          className="w-full bg-amber-400 text-amber-950 hover:bg-amber-300"
        >
          {join.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Rejoindre
        </Button>
        <p className="text-[11px] text-emerald-100/40">
          Un code est à usage unique et expire au bout de 7 jours.
        </p>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- Inviter */

function InvitePanel({ jardins }: { jardins: { id: string; nom: string }[] }) {
  const invite = useCreateInvitation();
  const [proprieteId, setProprieteId] = useState(jardins[0]?.id ?? '');
  const [role, setRole] = useState<InvitationRole>('prestataire');
  const [issued, setIssued] = useState<{ code: string; expires: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!proprieteId) return;
    setIssued(null);
    invite.mutate(
      { proprieteId, role },
      {
        onSuccess: (res) => setIssued({ code: res.code, expires: res.expires_at }),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible — notez le code manuellement.');
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
          <Share2 className="h-5 w-5 text-sky-300" />
        </div>
        <div>
          <h2 className="font-semibold">Inviter quelqu'un dans un de vos jardins</h2>
          <p className="text-xs text-emerald-100/60">
            Le code se transmet de vive voix, par message ou par courriel.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-emerald-100/70">Jardin</Label>
          <Select value={proprieteId} onValueChange={setProprieteId}>
            <SelectTrigger className="mt-1 border-white/15 bg-white/5 text-white">
              <SelectValue placeholder="Choisir un jardin" />
            </SelectTrigger>
            <SelectContent>
              {jardins.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-emerald-100/70">Rôle accordé</Label>
          <Select value={role} onValueChange={(v) => setRole(v as InvitationRole)}>
            <SelectTrigger className="mt-1 border-white/15 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as InvitationRole[]).map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={generate}
        disabled={invite.isPending || !proprieteId}
        variant="outline"
        className="mt-4 w-full border-sky-400/30 bg-transparent text-sky-200 hover:bg-sky-400/10 hover:text-sky-100"
      >
        {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Générer un code d'invitation
      </Button>

      {issued && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
          <div className="font-mono text-2xl tracking-[0.35em] text-sky-100">{issued.code}</div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs text-sky-300/80 transition-colors hover:text-sky-200"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Code copié' : 'Copier le code'}
          </button>
          <p className="text-[11px] text-emerald-100/40">
            Valable jusqu'au {new Date(issued.expires).toLocaleDateString('fr-FR')} · usage unique
          </p>
        </div>
      )}
    </section>
  );
}
