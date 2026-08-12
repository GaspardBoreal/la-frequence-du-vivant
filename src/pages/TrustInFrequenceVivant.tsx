import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lock, Radio, ShieldCheck, Waves, AlertTriangle, Printer, Sprout, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TRUST_PASSWORD, TRUST_REPORT, TRUST_SIGNATURE_RATE, TRUST_UTILE_RATE } from '@/lib/iot/trustReport';

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
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
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
    const base = (count / max) * 26;
    const y = 30 - base * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.7 + delay * 3)));
    return `${(i / 47) * 100},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-10 w-full">
      <motion.polyline
        points={pts} fill="none" stroke="url(#pulseGrad)" strokeWidth="1.1" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay }}
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

const TrustInFrequenceVivant: React.FC = () => {
  const [unlocked, setUnlocked] = React.useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toUpperCase() === TRUST_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
      setError(false);
    } else setError(true);
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

  const maxLiv = Math.max(...TRUST_REPORT.sondes.map((s) => s.livraisons72h));

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
            Relevé de conformité effectué directement en base le {TRUST_REPORT.releveLabel}, sur les {TRUST_REPORT.fenetre}.
            Trois sondes déployées au Jardin Monde DEVIAT, une passerelle, un webhook signé.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="mt-6 border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10 print:hidden">
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer / PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-6 py-14">
        {/* Jauges */}
        <section className="grid gap-8 rounded-3xl border border-emerald-500/15 bg-emerald-950/40 p-8 sm:grid-cols-3">
          <Gauge value={TRUST_SIGNATURE_RATE} label="Signature" tone="#34d399" hint={`${TRUST_REPORT.livraisonsValides} livraisons signées valides, ${TRUST_REPORT.livraisonsRefusees} refusée avant réglage de la clé.`} />
          <Gauge value={TRUST_UTILE_RATE} label="Trames utiles" tone="#fbbf24" hint={`${TRUST_REPORT.livraisonsVides} envois arrivent sans aucun relevé.`} />
          <Gauge value={100} label="Disponibilité" tone="#60a5fa" hint="Aucune erreur applicative sur les trois sondes réelles : horodatage, unités et fiches à jour." />
        </section>

        {/* Sondes */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Radio className="h-5 w-5 text-emerald-300" /> Les trois sondes, à l’écoute</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {TRUST_REPORT.sondes.map((s, i) => (
              <motion.div
                key={s.serial}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-emerald-500/15 bg-emerald-950/40 p-4"
              >
                <div className="text-sm font-medium">{s.nom}</div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-emerald-300/60">{s.serial}</div>
                <Pulse count={s.livraisons72h} max={maxLiv} delay={i * 0.2} />
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-emerald-100/70">
                  <div><span className="block text-lg font-semibold tabular-nums text-emerald-50">{s.livraisons72h}</span>livraisons · 72 h</div>
                  <div><span className="block text-lg font-semibold tabular-nums text-emerald-50">{s.mesures24h}</span>mesures · 24 h</div>
                </div>
                <div className="mt-2 text-[11px] text-emerald-300/70">Dernier signal {s.dernier}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-emerald-100/60">
            Cadence observée : une livraison toutes les {TRUST_REPORT.cadenceMinutes} minutes environ par sonde, jour et nuit.
            Cadence souhaitée : {TRUST_REPORT.cadenceSouhaitee}.
          </p>
        </section>

        {/* Grandeurs */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Waves className="h-5 w-5 text-emerald-300" /> Ce qui nous parvient, ce qui manque</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {TRUST_REPORT.grandeursRecues.map((g) => (
              <div key={g.label} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${g.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-400/25 bg-amber-400/5'}`}>
                {g.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="h-4 w-4 shrink-0 text-amber-300" />}
                <span className="flex-1">{g.label}</span>
                <span className="text-xs text-emerald-100/50">{g.unite}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Anomalies */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-amber-300" /> Trois points à corriger côté passerelle</h2>
          <ol className="space-y-3">
            {TRUST_REPORT.anomalies.map((a, i) => (
              <motion.li
                key={a.titre}
                initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-semibold text-amber-300/70 tabular-nums">{i + 1}</span>
                  <div>
                    <h3 className="font-medium text-amber-100">{a.titre}</h3>
                    <p className="mt-1 text-sm text-emerald-100/70">{a.detail}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.15em] text-amber-300/70">{a.impact}</p>
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
            {TRUST_REPORT.demandes.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-emerald-100/85">
                <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {d}
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-emerald-500/15 pt-6 text-xs text-emerald-100/40">
          Relevé automatisé — La Fréquence du Vivant · Jardin Monde DEVIAT · document confidentiel, non indexé.
        </footer>
      </main>
    </div>
  );
};

export default TrustInFrequenceVivant;
