import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Radio, ShieldCheck, Waves, AlertTriangle, Printer, Sprout, CheckCircle2, XCircle,
  RefreshCw, Copy, Download, MessagesSquare, Bot, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrustReport } from '@/hooks/iot/useTrustReport';
import {
  TRUST_PASSWORD, TRUST_WINDOWS, type TrustWindowKey, type TrustReport,
  tauxSignature, tauxUtile, cadenceMinutes, grandeursEtat, anomalies, DEMANDES,
  buildTrustMarkdown, buildBriefMarkdown, downloadMarkdown, fmtFR, fmtFRLong, depuisMinutes,
} from '@/lib/iot/trustReport';
import { useIotFournisseurs } from '@/hooks/iot/useIot';
import { useCanOpenIotConsole } from '@/hooks/iot/useIotPartner';
import { IotConsoleProvider } from '@/components/iot/console/IotConsoleContext';
import { IotConsolePanel, IotConsoleAi } from '@/components/iot/console/IotConsole';


const STORAGE_KEY = 'trust-lfdv-unlocked';

/* ── Anneau de conformité ──────────────────────────────────────────────── */
const Gauge: React.FC<{ value: number; label: string; hint: string; tone: string }> = ({ value, label, hint, tone }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 130 130" className="h-32 w-32">
        <circle cx="65" cy="65" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-white/10" />
        <motion.circle
          cx="65" cy="65" r={r} fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round"
          transform="rotate(-90 65 65)" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.max(0, Math.min(100, value))) / 100 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <text x="65" y="62" textAnchor="middle" className="fill-white text-[22px] font-semibold">{value}%</text>
        <text x="65" y="80" textAnchor="middle" className="fill-white/50 text-[9px] uppercase tracking-[0.2em]">{label}</text>
      </svg>
      <p className="max-w-[13rem] text-center text-xs text-emerald-100/60">{hint}</p>
    </div>
  );
};

/* ── Sismographe des livraisons par sonde ──────────────────────────────── */
const Pulse: React.FC<{ count: number; max: number; delay: number }> = ({ count, max, delay }) => {
  const pts = Array.from({ length: 48 }, (_, i) => {
    const base = (count / Math.max(1, max)) * 26;
    const y = 30 - base * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.7 + delay * 3)));
    return `${(i / 47) * 100},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-10 w-full">
      <motion.polyline
        points={pts} fill="none" stroke="url(#pulseGrad)" strokeWidth="1.1" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay }}
      />
      <defs>
        <linearGradient id="pulseGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Corps du rapport ──────────────────────────────────────────────────── */
const ReportBody: React.FC<{ r: TrustReport }> = ({ r }) => {
  const maxLiv = Math.max(1, ...r.sondes.map((s) => s.livraisons));
  const cad = cadenceMinutes(r);
  const grandeurs = grandeursEtat(r);
  const anos = anomalies(r);
  const ouvertes = anos.filter((a) => !a.resolu);

  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-14">
      {/* Jauges */}
      <section className="grid gap-8 rounded-3xl border border-emerald-500/15 bg-emerald-950/40 p-8 sm:grid-cols-3">
        <Gauge
          value={tauxSignature(r)} label="Signature" tone="#34d399"
          hint={`${r.livraisons_valides} livraisons signées valides${r.livraisons_refusees ? `, ${r.livraisons_refusees} refusée(s)` : ', aucune refusée'}.`}
        />
        <Gauge
          value={tauxUtile(r)} label="Trames utiles" tone={r.livraisons_vides > 0 ? '#fbbf24' : '#34d399'}
          hint={r.livraisons_vides > 0 ? `${r.livraisons_vides} envois arrivent sans aucun relevé.` : 'Chaque envoi porte au moins un relevé.'}
        />
        <Gauge
          value={r.livraisons_valides > 0 && r.erreurs_applicatives === 0 ? 100 : Math.max(0, 100 - r.erreurs_applicatives)}
          label="Disponibilité" tone="#60a5fa"
          hint={`${r.mesures_total} mesures enregistrées, ${r.erreurs_applicatives} erreur(s) applicative(s).`}
        />
      </section>

      {/* Sondes */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Radio className="h-5 w-5 text-emerald-300" /> Les trois sondes, à l’écoute</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {r.sondes.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-emerald-500/15 bg-emerald-950/40 p-4"
            >
              <div className="text-sm font-medium">{s.nom}</div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-emerald-300/60">{s.serial_number}</div>
              <Pulse count={s.livraisons} max={maxLiv} delay={i * 0.2} />
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-emerald-100/70">
                <div><span className="block text-lg font-semibold tabular-nums text-emerald-50">{s.livraisons}</span>livraisons</div>
                <div><span className="block text-lg font-semibold tabular-nums text-emerald-50">{s.mesures}</span>mesures</div>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300/70">Dernier signal {fmtFR(s.last_seen_at)}</div>
            </motion.div>
          ))}
          {r.sondes.length === 0 && (
            <p className="text-sm text-emerald-100/60">Aucune sonde n’a émis sur cette fenêtre.</p>
          )}
        </div>
        <p className="text-sm text-emerald-100/60">
          {cad ? <>Cadence observée : une livraison toutes les {cad} minutes environ par sonde. </> : null}
          Cadence souhaitée : 15 à 30 min.
          {r.livraisons_essais > 0 && <> · {r.livraisons_essais} envoi(s) d’une sonde d’essai, hors périmètre.</>}
        </p>
      </section>

      {/* Grandeurs */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Waves className="h-5 w-5 text-emerald-300" /> Ce qui nous parvient, ce qui manque</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {grandeurs.map((g) => (
            <div key={g.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${g.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-400/25 bg-amber-400/5'}`}>
              {g.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="h-4 w-4 shrink-0 text-amber-300" />}
              <span className="flex-1">{g.label}</span>
              <span className="text-xs text-emerald-100/50">{g.ok ? `${g.n} · ${g.unite}` : g.unite}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Anomalies */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          {ouvertes.length === 0 ? 'Tous les points sont levés' : `${ouvertes.length} point(s) à corriger côté passerelle`}
        </h2>
        <ol className="space-y-3">
          {anos.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border p-5 ${a.resolu ? 'border-emerald-400/25 bg-emerald-400/[0.05]' : 'border-amber-400/20 bg-amber-400/[0.04]'}`}
            >
              <div className="flex items-baseline gap-3">
                <span className={`text-2xl font-semibold tabular-nums ${a.resolu ? 'text-emerald-300/70' : 'text-amber-300/70'}`}>{i + 1}</span>
                <div>
                  <h3 className={`flex flex-wrap items-center gap-2 font-medium ${a.resolu ? 'text-emerald-100' : 'text-amber-100'}`}>
                    {a.titre}
                    {a.resolu && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                        Corrigé
                      </span>
                    )}
                  </h3>
                  {a.resolu && a.resolution && <p className="mt-1 text-sm text-emerald-200/80">{a.resolution}</p>}
                  <p className="mt-1 text-sm text-emerald-100/70">{a.detail}</p>
                  {!a.resolu && <p className="mt-2 text-xs uppercase tracking-[0.15em] text-amber-300/70">{a.impact}</p>}
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Demandes */}
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-300" /> Ce que nous demandons pour passer en production</h2>
        <ul className="mt-4 space-y-2">
          {DEMANDES.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-emerald-100/85">
              <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {d}
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-emerald-500/15 pt-6 text-xs text-emerald-100/40">
        Relevé automatisé, recalculé en base à l’ouverture — La Fréquence du Vivant · Jardin Monde DEVIAT · document confidentiel, non indexé.
      </footer>
    </main>
  );
};

/* ── Page ──────────────────────────────────────────────────────────────── */

/** Trois lectures d'une même chaîne : le récit, la salle des machines, le terrain. */
const TRUST_TABS = [
  { key: 'accueil', label: 'Accueil' },
  { key: 'controle', label: 'Poste de contrôle' },
  { key: 'carte', label: 'Carte des sondes' },
] as const;
type TrustTab = (typeof TRUST_TABS)[number]['key'];

/** Nom du fournisseur tel qu'il apparaît dans le journal des livraisons. */
const BRAD_DELIVERY_KEYS = ['brad'];

const TrustInFrequenceVivant: React.FC = () => {
  const [unlocked, setUnlocked] = React.useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState(false);
  const [windowKey, setWindowKey] = React.useState<TrustWindowKey>('ce_matin');
  const [tab, setTab] = React.useState<TrustTab>('accueil');

  // Retour sur l'onglet demandé après connexion (aucune route /auth n'existe).
  const partnerNext = `/trust-in-frequence-vivant?tab=${tab}`;
  const partnerLoginHref = `/marches-du-vivant/connexion?next=${encodeURIComponent(partnerNext)}`;
  const partnerSignupHref = `${partnerLoginHref}&mode=register`;


  const { data: fournisseurs = [] } = useIotFournisseurs();
  const bradId = React.useMemo(
    () => fournisseurs.find((f: any) => (f.nom ?? '').toLowerCase().startsWith('brad'))?.id ?? null,
    [fournisseurs],
  );
  const { allowed: consoleAllowed, isLoading: consoleLoading } = useCanOpenIotConsole(bradId);


  const since = React.useMemo(
    () => (TRUST_WINDOWS.find((w) => w.key === windowKey) ?? TRUST_WINDOWS[0]).since(),
    [windowKey],
  );
  const { data: report, isLoading, isFetching, error: qError, refetch } = useTrustReport(since);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toUpperCase() === TRUST_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
      setError(false);
    } else setError(true);
  };

  const copyMd = async (kind: 'rapport' | 'brief') => {
    if (!report) return;
    const md = kind === 'rapport' ? buildTrustMarkdown(report) : buildBriefMarkdown(report);
    try {
      await navigator.clipboard.writeText(md);
      toast.success(kind === 'rapport' ? 'Rapport Markdown copié' : 'Brief copié — collez-le dans Gemini');
    } catch {
      downloadMarkdown(md, `rapport-brad-lfdv.md`);
      toast.message('Presse-papier indisponible : le fichier a été téléchargé.');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04120d] px-6">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Trust in Fréquence Vivant — accès réservé</title>
        </Helmet>
        <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/60 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
            <Lock className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">Rapport de confiance</p>
            <h1 className="text-xl font-semibold text-emerald-50">Trust in Fréquence Vivant</h1>
            <p className="text-sm text-emerald-100/60">Document protégé. Saisissez le mot de passe transmis.</p>
          </div>
          <Input
            autoFocus type="password" value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Mot de passe"
            className="border-emerald-500/25 bg-emerald-950/60 text-center tracking-widest text-emerald-50 placeholder:text-emerald-100/30"
          />
          {error && <p className="text-xs text-red-400">Mot de passe incorrect.</p>}
          <Button type="submit" className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400">Ouvrir le rapport</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04120d] text-emerald-50">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Trust in Fréquence Vivant — chaîne télémétrie BRAD</title>
      </Helmet>

      {/* Héros */}
      <header className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <svg viewBox="0 0 800 300" preserveAspectRatio="none" className="h-full w-full">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.path
                key={i}
                d={`M0,${90 + i * 34} C160,${50 + i * 34} 320,${140 + i * 30} 480,${90 + i * 32} S760,${60 + i * 30} 800,${100 + i * 30}`}
                fill="none" stroke="#34d399" strokeOpacity={0.18 + i * 0.05} strokeWidth="1"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, delay: i * 0.15 }}
              />
            ))}
          </svg>
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Chaîne vivante · en réception
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            La donnée du sol arrive.<br />
            <span className="text-emerald-300">BRAD × La Fréquence du Vivant.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-emerald-100/70">
            Relevé recalculé en base à chaque ouverture, depuis le {fmtFRLong(since.toISOString())} (heure de Paris).
            Trois sondes déployées au Jardin Monde DEVIAT, une passerelle, un webhook signé.
          </p>

          {/* Barre vivante */}
          <div className={`mt-6 flex-wrap items-center gap-2 print:hidden ${tab === 'accueil' ? 'flex' : 'hidden'}`}>

            <div className="flex flex-wrap gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/50 p-1">
              {TRUST_WINDOWS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => setWindowKey(w.key)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${windowKey === w.key ? 'bg-emerald-400 text-emerald-950' : 'text-emerald-100/70 hover:bg-emerald-400/10'}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10">
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Rafraîchir
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyMd('rapport')} disabled={!report} className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10">
              <Copy className="mr-1.5 h-4 w-4" /> Copier en Markdown
            </Button>
            <Button
              variant="outline" size="sm" disabled={!report}
              onClick={() => report && downloadMarkdown(buildTrustMarkdown(report), `rapport-brad-lfdv-${new Date().toISOString().slice(0, 10)}.md`)}
              className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10"
            >
              <Download className="mr-1.5 h-4 w-4" /> Télécharger .md
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyMd('brief')} disabled={!report} className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10">
              <Bot className="mr-1.5 h-4 w-4" /> Brief pour une autre IA
            </Button>
            <Button asChild size="sm" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
              <Link to="/trust-in-frequence-vivant/table-ronde"><MessagesSquare className="mr-1.5 h-4 w-4" /> Table ronde des IA</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-emerald-100/70 hover:bg-emerald-400/10">
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer
            </Button>
          </div>

          {report && tab === 'accueil' && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300/70">
              <Clock className="h-3.5 w-3.5" />
              Mis à jour il y a {depuisMinutes(report.generated_at)} min · {report.livraisons_total} livraisons lues sur la fenêtre
            </p>
          )}

          {/* Trois lectures d'une même chaîne */}
          <div className="mt-8 flex flex-wrap gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/50 p-1 print:hidden">
            {TRUST_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-1.5 text-xs transition ${
                  tab === t.key ? 'bg-emerald-400 text-emerald-950' : 'text-emerald-100/70 hover:bg-emerald-400/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab !== 'accueil' ? (
        <div className="mx-auto max-w-7xl px-6 py-10">
          {consoleLoading ? (
            <p className="py-20 text-center text-emerald-100/60">Vérification de vos droits…</p>
          ) : consoleAllowed ? (
            <IotConsoleProvider
              scope={{ fournisseurIds: bradId ? [bradId] : [], fournisseurKeys: BRAD_DELIVERY_KEYS }}
              capabilities={{ testDelivery: false, rawPayload: false, catalogue: false, proprieteLinks: false }}
              chrome="partenaire"
              label="Parc BRAD TECHNOLOGY"
            >
              <div className="rounded-3xl bg-background p-4 text-foreground sm:p-6">
                <IotConsolePanel view={tab === 'carte' ? 'carte' : 'controle'} />
              </div>
              <IotConsoleAi />
            </IotConsoleProvider>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/20 bg-emerald-950/40 p-8 text-center">
              <Lock className="mx-auto mb-3 h-6 w-6 text-emerald-300" />
              <h2 className="text-lg font-semibold">Espace partenaire BRAD</h2>
              <p className="mt-2 text-sm text-emerald-100/70">
                Le poste de contrôle et la carte des sondes s’ouvrent avec un compte partenaire BRAD.
                Connectez-vous avec votre compte, ou demandez-nous l’ouverture de votre accès :
                créer un compte ne suffit pas, il doit être rattaché à BRAD Technology par
                La Fréquence du Vivant.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button asChild size="sm" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                  <Link to={partnerLoginHref}>Se connecter</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10">
                  <Link to={partnerSignupHref}>Créer un compte</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-5xl px-6 py-24 text-center text-emerald-100/60">
              <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-emerald-300" />
              Lecture de la chaîne télémétrie…
            </motion.div>
          ) : qError ? (
            <div className="mx-auto max-w-5xl px-6 py-24 text-center text-amber-200">
              Impossible de lire le journal des livraisons pour le moment.
              <div className="mt-4"><Button variant="outline" onClick={() => refetch()} className="border-amber-400/30 bg-transparent text-amber-100">Réessayer</Button></div>
            </div>
          ) : report && report.livraisons_total === 0 ? (
            <div className="mx-auto max-w-5xl px-6 py-24 text-center text-emerald-100/70">
              Aucune livraison reçue depuis le {fmtFRLong(since.toISOString())}. Élargissez la fenêtre de lecture pour retrouver l’historique.
            </div>
          ) : report ? (
            <motion.div key="body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ReportBody r={report} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </div>
  );
};


export default TrustInFrequenceVivant;
