import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Loader2, Printer, Sparkles, MessageSquarePlus, Pencil } from 'lucide-react';
import { RegularNightFiche } from './RegularNightFiche';
import { SoilSpongeFiche } from './SoilSpongeFiche';
import { PollinatorWindowFiche } from './PollinatorWindowFiche';

export interface PlanInput {
  nom: string;
  projet: string;
  objectifs: string[];
  livrables: string[];
  sites: number;
  difficulte: string;
  typeStructure: string;
  territoire: string;
  productions: string[];
  demarrage: string;
}

interface Hypothese { champ: string; valeur: string; texte: string }
interface Action { action: string; fenetreBiologique: string; sites: string; responsable: string }
interface Plan {
  synthese: string;
  chiffresCles: { valeur: string; libelle: string }[];
  compris: { reformulation: string; hypotheses: Hypothese[]; ecartsDetectes: string[] };
  partiPris: { titre: string; texte: string };
  calendrier: { periode: string; titre: string; actions: Action[] }[];
  dispositif: {
    sentinelles: { nombre: number; critereChoix: string; mesures: string[] };
    reseau: { nombre: number; protocoles: string[] };
    indicateurs: { nom: string; methode: string; etatZero: string; cible: string }[];
  };
  reponseDifficulte: { difficulte: string; ajustements: string[] };
  gesteSignature: { nom: string; quand: string; ou: string; pourquoi: string };
  moyens: { materiel: { element: string; quantite: number }[]; joursAccompagnement: number; formations: number; marches: number };
  financements: { piste: string; aVerifier: boolean }[];
  demonstrateurs: string[];
  questionsPourAffiner: string[];
}
interface Mois { index: number; annee: number; label: string }

const STEPS = [
  { id: 'lecture', label: 'Lecture de votre projet' },
  { id: 'dimensionnement', label: 'Dimensionnement du dispositif' },
  { id: 'calendrier', label: 'Calage sur le calendrier biologique' },
  { id: 'redaction', label: 'Rédaction du plan' },
];

/** Fenêtres biologiques (index de mois 0-11) affichées en bandes de fond sur la frise. */
const BANDES = [
  { id: 'plantation', label: 'Plantation haies / arbres', mois: [10, 11, 0, 1, 2], cls: 'bg-accent/60' },
  { id: 'pollin', label: 'Pollinisateurs & invertébrés', mois: [2, 3, 4, 5, 6, 7, 8, 9], cls: 'bg-primary/25' },
  { id: 'chiro', label: 'Chauves-souris', mois: [3, 4, 5, 6, 7, 8, 9], cls: 'bg-secondary' },
  { id: 'invasives', label: 'Invasives', mois: [5, 6, 7, 8, 9], cls: 'bg-destructive/20' },
];

const DEMOS: Record<string, string> = { haie: 'La haie qui chasse la nuit', sol: 'Le sol éponge', butinage: 'La fenêtre de butinage' };

const Bloc: React.FC<{ i: number; titre?: string; children: React.ReactNode; className?: string }> = ({ i, titre, children, className = '' }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.12, duration: 0.4 }}
    className={`break-inside-avoid ${className}`}
  >
    {titre && <h3 className="font-serif text-lg mb-2">{titre}</h3>}
    {children}
  </motion.section>
);

const badgeSites = (s: string) =>
  /sentinel/i.test(s) ? 'bg-primary text-primary-foreground' : /réseau|reseau/i.test(s) ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground';

export const PlanActionLfdv: React.FC<{
  input: PlanInput;
  onHypothese: (champ: string, valeur: string) => void;
  fallback: React.ReactNode;
}> = ({ input, onHypothese, fallback }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'fallback'>('idle');
  const [steps, setSteps] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [mois, setMois] = useState<Mois[]>([]);
  const [precisions, setPrecisions] = useState<{ question: string; reponse: string }[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [reponse, setReponse] = useState('');
  const [fiche, setFiche] = useState<string | null>(null);

  const generer = async (extra = precisions) => {
    setStatus('loading');
    setSteps([]);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-partner-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...input, precisions: extra }),
      });
      if (!resp.ok || !resp.body) throw new Error(String(resp.status));
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let fini = false;
      while (!fini) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const l of lines) {
          if (!l.trim()) continue;
          const msg = JSON.parse(l);
          if (msg.type === 'step') setSteps((s) => [...s, msg.step]);
          else if (msg.type === 'result') { setPlan(msg.plan); setMois(msg.calc.mois); setStatus('done'); fini = true; }
          else if (msg.type === 'fallback') { setStatus('fallback'); fini = true; }
        }
      }
      if (!fini) setStatus('fallback');
    } catch (e) {
      console.error('[PlanActionLfdv]', e);
      setStatus('fallback');
    }
  };

  const affiner = () => {
    if (!question || !reponse.trim()) return;
    const next = [...precisions, { question, reponse: reponse.trim() }];
    setPrecisions(next);
    setQuestion(null);
    setReponse('');
    generer(next);
  };

  return (
    <div className="space-y-6 text-left [&_p]:text-left">
      <Button onClick={() => generer()} disabled={status === 'loading'} className="print:hidden">
        {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        {status === 'done' ? 'Régénérer le plan d’action LFDV' : 'Générer le plan d’action LFDV'}
      </Button>

      {status === 'loading' && (
        <ol className="space-y-2 text-sm" aria-live="polite">
          {STEPS.map((s) => {
            const fait = steps.includes(s.id);
            const idx = STEPS.findIndex((x) => x.id === s.id);
            const encours = fait && (idx === STEPS.length - 1 || !steps.includes(STEPS[idx + 1].id));
            if (!fait) return null;
            return (
              <motion.li key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                {encours ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Check className="w-4 h-4 text-primary" />}
                <span className={encours ? '' : 'text-muted-foreground'}>{s.label}</span>
              </motion.li>
            );
          })}
        </ol>
      )}

      {status === 'fallback' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground italic">Génération indisponible pour le moment, voici une première lecture de votre projet.</p>
          {fallback}
        </div>
      )}

      {status === 'done' && plan && (
        <div className="space-y-8 text-sm">
          {/* 1. Synthèse + chiffres */}
          <Bloc i={0}>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
              <p className="leading-relaxed">{plan.synthese}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {plan.chiffresCles.map((c) => (
                  <div key={c.libelle}>
                    <div className="font-serif text-3xl text-primary">{c.valeur}</div>
                    <div className="text-xs text-muted-foreground leading-snug">{c.libelle}</div>
                  </div>
                ))}
              </div>
            </div>
          </Bloc>

          {/* 2. Compris */}
          <Bloc i={1} titre="Ce que nous avons compris">
            <p className="leading-relaxed">{plan.compris.reformulation}</p>
            {plan.compris.hypotheses.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {plan.compris.hypotheses.map((h) => (
                  <li key={h.texte}>
                    <button
                      type="button"
                      onClick={() => onHypothese(h.champ, h.valeur)}
                      className="group flex w-full items-start gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-left hover:border-primary hover:bg-primary/5"
                      title="Cliquez pour préremplir le champ correspondant et le modifier"
                    >
                      <Pencil className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span><span className="text-muted-foreground">Hypothèse · </span>{h.texte}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {plan.compris.ecartsDetectes.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {plan.compris.ecartsDetectes.map((e) => (
                  <li key={e} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-accent-foreground" />{e}</li>
                ))}
              </ul>
            )}
          </Bloc>

          {/* 3. Parti pris */}
          <Bloc i={2}>
            <div className="border-l-4 border-primary pl-4 py-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Notre parti pris</p>
              <p className="font-serif text-xl mt-1">{plan.partiPris.titre}</p>
              <p className="mt-2 leading-relaxed text-foreground/90">{plan.partiPris.texte}</p>
            </div>
          </Bloc>

          {/* 4. Frise */}
          <Bloc i={3} titre="Calendrier sur 12 mois">
            <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-muted-foreground">
              {BANDES.map((b) => (
                <span key={b.id} className="flex items-center gap-1.5"><span className={`inline-block h-2.5 w-4 rounded-sm ${b.cls}`} />{b.label}</span>
              ))}
            </div>
            {/* Horizontal (desktop / impression) */}
            <div className="hidden md:block print:block">
              <div className="grid grid-cols-12 gap-px text-[10px] text-center text-muted-foreground">
                {mois.map((m) => <div key={`${m.index}-${m.annee}`}>{m.label}</div>)}
              </div>
              <div className="mt-1 space-y-0.5">
                {BANDES.map((b) => (
                  <div key={b.id} className="grid grid-cols-12 gap-px h-2">
                    {mois.map((m) => <div key={m.index} className={b.mois.includes(m.index) ? b.cls : 'bg-muted/40'} />)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {plan.calendrier.map((t) => (
                  <div key={t.periode} className="rounded-md border border-border bg-background p-2.5">
                    <p className="text-[11px] uppercase tracking-wide text-primary">{t.periode}</p>
                    <p className="font-medium leading-snug mt-0.5">{t.titre}</p>
                    <ul className="mt-2 space-y-2">
                      {t.actions.map((a) => <ActionItem key={a.action} a={a} />)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            {/* Vertical (mobile) */}
            <ol className="md:hidden print:hidden relative border-l-2 border-primary/30 ml-2 space-y-5">
              {plan.calendrier.map((t, q) => (
                <li key={t.periode} className="pl-4 relative">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-[11px] uppercase tracking-wide text-primary">{t.periode}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {BANDES.filter((b) => mois.slice(q * 3, q * 3 + 3).some((m) => b.mois.includes(m.index))).map((b) => (
                      <span key={b.id} className={`text-[10px] rounded px-1.5 py-0.5 ${b.cls}`}>{b.label}</span>
                    ))}
                  </div>
                  <p className="font-medium mt-1">{t.titre}</p>
                  <ul className="mt-2 space-y-2">{t.actions.map((a) => <ActionItem key={a.action} a={a} />)}</ul>
                </li>
              ))}
            </ol>
          </Bloc>

          {/* 5. Dispositif */}
          <Bloc i={4} titre="Le dispositif">
            <div className="flex flex-wrap gap-1 max-w-md" aria-label={`${plan.dispositif.sentinelles.nombre} sites sentinelles, ${plan.dispositif.reseau.nombre} sites réseau`}>
              {Array.from({ length: plan.dispositif.sentinelles.nombre }).map((_, i) => <span key={`s${i}`} className="h-3 w-3 rounded-full bg-primary" />)}
              {Array.from({ length: plan.dispositif.reseau.nombre }).map((_, i) => <span key={`r${i}`} className="h-3 w-3 rounded-full bg-primary/25" />)}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="font-medium">{plan.dispositif.sentinelles.nombre} sites sentinelles</p>
                <p className="text-muted-foreground mt-1">{plan.dispositif.sentinelles.critereChoix}</p>
                <ul className="mt-1.5 list-disc pl-4 space-y-0.5">{plan.dispositif.sentinelles.mesures.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium">{plan.dispositif.reseau.nombre} sites réseau</p>
                <ul className="mt-1.5 list-disc pl-4 space-y-0.5">{plan.dispositif.reseau.protocoles.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-4">
              {plan.dispositif.indicateurs.map((ind) => (
                <div key={ind.nom} className="rounded-md border border-border p-3">
                  <p className="font-medium">{ind.nom}</p>
                  <p className="text-muted-foreground text-xs mt-1">{ind.methode}</p>
                  <p className="text-xs mt-1.5"><span className="text-muted-foreground">État zéro :</span> {ind.etatZero}</p>
                  <p className="text-xs"><span className="text-muted-foreground">Cible :</span> {ind.cible}</p>
                </div>
              ))}
            </div>
          </Bloc>

          {/* 6. Contrainte */}
          <Bloc i={5} titre="Votre contrainte">
            <p className="italic text-muted-foreground">« {plan.reponseDifficulte.difficulte} »</p>
            <ul className="mt-2 space-y-1.5">
              {plan.reponseDifficulte.ajustements.map((a) => <li key={a} className="flex gap-2"><Check className="w-4 h-4 shrink-0 mt-0.5 text-primary" />{a}</li>)}
            </ul>
          </Bloc>

          {/* 7. Geste signature */}
          <Bloc i={6}>
            <div className="rounded-lg border-2 border-primary/50 bg-card p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Le geste signature</p>
              <p className="font-serif text-xl mt-1">{plan.gesteSignature.nom}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.gesteSignature.quand} · {plan.gesteSignature.ou}</p>
              <p className="mt-2 leading-relaxed">{plan.gesteSignature.pourquoi}</p>
            </div>
          </Bloc>

          {/* 8. Moyens / financements */}
          <Bloc i={7}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-serif text-lg mb-2">Moyens</h3>
                <ul className="space-y-1">
                  {plan.moyens.materiel.map((m) => <li key={m.element}><span className="font-medium">{m.quantite}</span> × {m.element}</li>)}
                  <li><span className="font-medium">{String(plan.moyens.joursAccompagnement).replace('.', ',')}</span> jours d’accompagnement indicatifs</li>
                  <li><span className="font-medium">{plan.moyens.formations}</span> sessions de formation · <span className="font-medium">{plan.moyens.marches}</span> Marches du Vivant</li>
                </ul>
              </div>
              <div>
                <h3 className="font-serif text-lg mb-2">Pistes de financement</h3>
                <ul className="space-y-1.5">
                  {plan.financements.map((f) => (
                    <li key={f.piste} className="flex items-start gap-2">
                      <span className="shrink-0 text-[10px] uppercase tracking-wide rounded border border-border px-1.5 py-0.5 text-muted-foreground">à vérifier</span>
                      {f.piste}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Bloc>

          {/* 9. Démonstrateurs */}
          {plan.demonstrateurs.length > 0 && (
            <Bloc i={8} titre="Démonstrateurs mobilisés">
              <div className="flex flex-wrap gap-2">
                {plan.demonstrateurs.map((d) => (
                  <button key={d} type="button" onClick={() => setFiche(d)} className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-left hover:bg-primary/10">
                    <span className="block font-medium">{DEMOS[d]}</span>
                    <span className="block text-xs text-muted-foreground print:hidden">Voir la fiche</span>
                  </button>
                ))}
              </div>
            </Bloc>
          )}

          {/* 10. Pour affiner */}
          <Bloc i={9} titre="Pour affiner" className="print:hidden">
            <div className="space-y-2">
              {plan.questionsPourAffiner.map((q) => (
                <div key={q}>
                  <button type="button" onClick={() => { setQuestion(q); setReponse(''); }} className="flex w-full items-start gap-2 rounded-md border border-border px-3 py-2 text-left hover:border-primary">
                    <MessageSquarePlus className="w-4 h-4 shrink-0 mt-0.5 text-primary" />{q}
                  </button>
                  {question === q && (
                    <div className="mt-2 space-y-2">
                      <textarea autoFocus rows={2} value={reponse} onChange={(e) => setReponse(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Votre réponse" />
                      <Button size="sm" onClick={affiner} disabled={!reponse.trim()}>Régénérer avec cette réponse</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Bloc>

          <p className="text-xs italic text-muted-foreground border-t border-border pt-3">
            Plan indicatif généré par IA à partir de vos réponses. Les quantités et le calendrier sont à valider lors d’un échange de cadrage.
          </p>
          <Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Exporter cette réponse</Button>
        </div>
      )}

      <RegularNightFiche open={fiche === 'haie'} onOpenChange={(o) => !o && setFiche(null)} />
      <SoilSpongeFiche open={fiche === 'sol'} onOpenChange={(o) => !o && setFiche(null)} />
      <PollinatorWindowFiche open={fiche === 'butinage'} onOpenChange={(o) => !o && setFiche(null)} />
    </div>
  );
};

const ActionItem: React.FC<{ a: Action }> = ({ a }) => (
  <li className="text-xs leading-snug">
    <p>{a.action}</p>
    <p className="text-muted-foreground mt-0.5">{a.fenetreBiologique}</p>
    <div className="flex flex-wrap gap-1 mt-1">
      <span className={`rounded px-1.5 py-0.5 text-[10px] ${badgeSites(a.sites)}`}>{a.sites}</span>
      <span className="rounded px-1.5 py-0.5 text-[10px] border border-border">{a.responsable}</span>
    </div>
  </li>
);
