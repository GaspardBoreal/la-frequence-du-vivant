import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Bot, Sprout, Send, Copy, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTrustReport } from '@/hooks/iot/useTrustReport';
import {
  TRUST_PASSWORD, TRUST_WINDOWS, buildTrustMarkdown, buildBriefMarkdown, QUESTIONS_OUVERTES,
} from '@/lib/iot/trustReport';

const STORAGE_KEY = 'trust-lfdv-unlocked';
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trust-table-ronde`;

type Turn = { role: 'user' | 'assistant'; content: string };

const AMORCES = [
  'Ouvre la table ronde : résume en trois phrases l’état réel de la chaîne et ce qui bloque encore le registre de sol.',
  'Quelles conséquences agronomiques concrètes a l’absence d’humidité de sol par horizon sur le suivi du jardin ?',
  'Rédige les demandes techniques à transmettre à la passerelle, champ par champ.',
];

const TrustTableRonde: React.FC = () => {
  const [unlocked, setUnlocked] = React.useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [pwd, setPwd] = React.useState('');
  const [pwdError, setPwdError] = React.useState(false);

  const since = React.useMemo(() => TRUST_WINDOWS[0].since(), []);
  const { data: report } = useTrustReport(since);

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, streaming]);

  const submitPwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.trim().toUpperCase() === TRUST_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
    } else setPwdError(true);
  };

  const ask = async (text: string) => {
    if (!report || !text.trim() || streaming) return;
    const next: Turn[] = [...turns, { role: 'user', content: text.trim() }];
    setTurns(next);
    setInput('');
    setStreaming(true);

    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: TRUST_PASSWORD,
          reportMarkdown: buildTrustMarkdown(report),
          messages: next,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? 'Le service IA est indisponible.');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      setTurns([...next, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setTurns([...next, { role: 'assistant', content: acc }]);
            }
          } catch {
            /* trame partielle */
          }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur inattendue');
      setTurns(next);
    } finally {
      setStreaming(false);
    }
  };

  const copyBrief = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(buildBriefMarkdown(report));
    toast.success('Brief copié — collez-le dans Gemini, puis rapportez sa réponse ici.');
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04120d] px-6">
        <Helmet><meta name="robots" content="noindex, nofollow" /><title>Table ronde des IA — accès réservé</title></Helmet>
        <form onSubmit={submitPwd} className="w-full max-w-sm space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/60 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
            <Lock className="h-6 w-6 text-emerald-300" />
          </div>
          <h1 className="text-xl font-semibold text-emerald-50">Table ronde des IA</h1>
          <Input
            autoFocus type="password" value={pwd}
            onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
            placeholder="Mot de passe"
            className="border-emerald-500/25 bg-emerald-950/60 text-center tracking-widest text-emerald-50"
          />
          {pwdError && <p className="text-xs text-red-400">Mot de passe incorrect.</p>}
          <Button type="submit" className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400">Entrer</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04120d] text-emerald-50">
      <Helmet><meta name="robots" content="noindex, nofollow" /><title>Table ronde des IA — BRAD × La Fréquence du Vivant</title></Helmet>

      <header className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-emerald-100/70 hover:bg-emerald-400/10">
            <Link to="/trust-in-frequence-vivant"><ArrowLeft className="mr-1.5 h-4 w-4" /> Retour au rapport</Link>
          </Button>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            La table ronde des <span className="text-emerald-300">intelligences</span>
          </h1>
          <p className="mt-3 max-w-2xl text-emerald-100/70">
            L’IA de Jardin ne dispose que du rapport de télémétrie recalculé ce matin : elle ne peut rien inventer.
            Copiez le brief pour Gemini, rapportez sa réponse ici, et laissez les deux modèles se répondre.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={copyBrief} disabled={!report} className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10">
              <Copy className="mr-1.5 h-4 w-4" /> Copier le brief pour Gemini
            </Button>
            {AMORCES.map((a, i) => (
              <Button key={i} size="sm" variant="ghost" onClick={() => ask(a)} disabled={!report || streaming} className="text-emerald-200/80 hover:bg-emerald-400/10">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {i === 0 ? 'Ouvrir la séance' : i === 1 ? 'Conséquences au jardin' : 'Demandes techniques'}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        {turns.length === 0 && (
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-950/40 p-6 text-sm text-emerald-100/70">
            <p className="mb-3 font-medium text-emerald-100">Questions ouvertes déjà posées au fournisseur :</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              {QUESTIONS_OUVERTES.map((q) => <li key={q}>{q}</li>)}
            </ol>
          </div>
        )}

        {turns.map((t, i) => (
          <motion.div
            key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${t.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${t.role === 'user' ? 'border-sky-400/30 bg-sky-400/10' : 'border-emerald-400/30 bg-emerald-400/10'}`}>
              {t.role === 'user' ? <Bot className="h-4 w-4 text-sky-300" /> : <Sprout className="h-4 w-4 text-emerald-300" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl border p-4 text-sm ${t.role === 'user' ? 'border-sky-400/20 bg-sky-400/[0.06]' : 'border-emerald-500/20 bg-emerald-950/50'}`}>
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-100/40">
                {t.role === 'user' ? 'Côté fournisseur / vous' : 'IA de Jardin — La Fréquence du Vivant'}
              </div>
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-li:my-0.5 prose-headings:text-emerald-200">
                <ReactMarkdown>{t.content || '…'}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {streaming && (
          <p className="flex items-center gap-2 pl-11 text-xs text-emerald-300/70">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> l’IA de Jardin rédige…
          </p>
        )}
        <div ref={bottomRef} />
      </main>

      <div className="sticky bottom-0 border-t border-emerald-500/15 bg-[#04120d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl gap-2 px-6 py-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(input); }
            }}
            placeholder="Collez ici la réponse de Gemini, ou posez votre question…"
            className="min-h-[56px] resize-none border-emerald-500/25 bg-emerald-950/60 text-emerald-50 placeholder:text-emerald-100/30"
          />
          <Button onClick={() => ask(input)} disabled={!report || streaming || !input.trim()} className="h-auto bg-emerald-500 px-4 text-emerald-950 hover:bg-emerald-400">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrustTableRonde;
