import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Copy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PERSONAS, PERSONA_ORDER, getPersona, type PersonaKey } from '@/lib/marcheurPersonas';
import type { UsageDashboardPayload, UsagePersonaMember } from '@/hooks/useCommunityUsageDashboard';

interface Props { data: UsageDashboardPayload }

const toCsv = (rows: UsagePersonaMember[]) => {
  const headers = ['prenom', 'nom', 'ville', 'role', 'events_30d', 'contribs', 'participations', 'days_since_active', 'is_adherent', 'signup_at', 'last_seen_at', 'slug'];
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(';'),
    ...rows.map((r) => headers.map((h) => esc((r as any)[h] ?? (r as any)[h.replace('contribs', 'contrib_count')])).join(';')),
  ].join('\n');
};

const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const PersonaMatrix: React.FC<Props> = ({ data }) => {
  const [openPersona, setOpenPersona] = useState<PersonaKey | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<PersonaKey, typeof data.bubble>();
    PERSONA_ORDER.forEach((k) => map.set(k, []));
    data.bubble?.forEach((p) => {
      const k = (p.persona as PersonaKey) in PERSONAS ? (p.persona as PersonaKey) : 'observateurs';
      map.get(k)?.push(p);
    });
    return map;
  }, [data.bubble]);

  const personaCounts = useMemo(() => {
    const m: Record<string, number> = {};
    data.personas?.forEach((p) => { m[p.key] = p.count; });
    return m;
  }, [data.personas]);

  const members = openPersona ? data.persona_members[openPersona] ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Persona chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {PERSONA_ORDER.map((key, idx) => {
          const meta = PERSONAS[key];
          const count = personaCounts[key] ?? 0;
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setOpenPersona(key)}
              className="text-left group"
            >
              <Card
                className="p-3 border-2 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                style={{ borderColor: `${meta.color}55` }}
              >
                <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity"
                     style={{ background: `radial-gradient(circle at 100% 0%, ${meta.color}, transparent 70%)` }} />
                <div className="relative">
                  <div className="text-lg">{meta.emoji}</div>
                  <div className="text-xs font-semibold text-foreground mt-1 leading-tight">{meta.label}</div>
                  <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: meta.color }}>{count}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{meta.tagline}</div>
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Bubble matrix */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Matrice d'engagement</h3>
            <p className="text-xs text-muted-foreground">
              Axe horizontal : récence (à droite = plus récent). Axe vertical : intensité 30 j. Taille : contributions.
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" name="Récence" domain={[0, 90]}
                   tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                   label={{ value: 'Récence (jours)', position: 'insideBottom', offset: -4, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="number" dataKey="y" name="Événements 30j"
                   tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                   label={{ value: 'Activité 30 j', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <ZAxis type="number" dataKey="z" range={[30, 600]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
              formatter={(_v, _n, p: any) => {
                const d = p?.payload;
                return d ? [`${d.name} — ${getPersona(d.persona).label}`, `Contribs : ${d.contribs} · Marches : ${d.participations}`] : '';
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {PERSONA_ORDER.map((k) => (
              <Scatter
                key={k}
                name={PERSONAS[k].label}
                data={grouped.get(k) ?? []}
                fill={PERSONAS[k].color}
                fillOpacity={0.65}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      {/* Persona drawer */}
      <Sheet open={!!openPersona} onOpenChange={(o) => !o && setOpenPersona(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {openPersona && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-xl">
                  <span className="text-2xl">{PERSONAS[openPersona].emoji}</span>
                  {PERSONAS[openPersona].label}
                  <Badge variant="outline" className="ml-auto">{members.length}</Badge>
                </SheetTitle>
                <p className="text-sm text-muted-foreground">{PERSONAS[openPersona].description}</p>
                <div className="mt-3 rounded-lg p-3 border" style={{ borderColor: `${PERSONAS[openPersona].color}55`, background: `${PERSONAS[openPersona].color}0d` }}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Action recommandée
                  </p>
                  <p className="text-sm text-foreground">{PERSONAS[openPersona].action}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => {
                    downloadCsv(`marcheurs-${openPersona}.csv`, toCsv(members));
                    toast.success('Export CSV téléchargé');
                  }}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const ids = members.map((m) => m.user_id).join(',');
                    navigator.clipboard.writeText(ids);
                    toast.success(`${members.length} user_id copiés`);
                  }}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copier IDs
                  </Button>
                </div>
              </SheetHeader>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/40">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground overflow-hidden">
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                        : `${(m.prenom ?? '?')[0]}${(m.nom ?? '')[0] ?? ''}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.prenom} {m.nom}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.ville ?? '—'} · {m.role ?? 'marcheur'} · {m.participations} marches · {m.contrib_count} contribs
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <div>{m.events_30d} events/30j</div>
                      <div>{m.days_since_active} j silence</div>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun marcheur dans ce segment.</p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PersonaMatrix;
