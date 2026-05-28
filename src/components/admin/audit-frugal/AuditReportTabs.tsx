import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Props {
  report: any;
  promptSnapshot: string;
}

const IMPACT_COLORS: Record<string, string> = {
  'Élevé': 'bg-red-500/10 text-red-700 dark:text-red-300',
  'Modéré': 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  'Faible': 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-200',
};

const DOMAIN_NAMES: Record<string, string> = {
  domain1: '1 — Pertinence & Gouvernance',
  domain2: '2 — Modèle & Algorithme',
  domain3: '3 — Données',
  domain4: '4 — Infrastructure & Ressources',
};

const DomainSection: React.FC<{ report: any; domainKey: string }> = ({ report, domainKey }) => {
  const idx = parseInt(domainKey.replace('domain', ''), 10);
  const strongs = (report.strong_points ?? []).filter((s: any) => s.domain === idx);
  
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-3">✅ Points forts</h3>
        {strongs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun point fort spécifique identifié dans ce domaine.</p>
        ) : (
          <div className="space-y-3">
            {strongs.map((sp: any, i: number) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h4 className="font-medium">{sp.title}</h4>
                  <Badge variant="secondary" className="shrink-0">{sp.afnor_reference}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{sp.justification}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">🔧 Améliorations recommandées (ce domaine)</h3>
        <Accordion type="multiple" className="space-y-2">
          {(['critical', 'important', 'desirable', 'long_term'] as const).map((bucket) => {
            const imps = (report.improvements?.[bucket] ?? []).filter((i: any) => i.domain === idx);
            if (imps.length === 0) return null;
            const label = { critical: '🔴 Critiques', important: '🟠 Importantes', desirable: '🟡 Souhaitables', long_term: '🔵 Long terme' }[bucket];
            return (
              <AccordionItem key={bucket} value={bucket} className="border rounded-md px-3">
                <AccordionTrigger className="text-sm">{label} ({imps.length})</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {imps.map((imp: any, i: number) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="font-medium">{imp.problem}</h4>
                        <div className="flex gap-1 shrink-0">
                          <Badge variant="secondary">{imp.afnor_reference}</Badge>
                          <Badge className={IMPACT_COLORS[imp.estimated_impact] ?? ''}>{imp.estimated_impact}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{imp.recommended_action}</p>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>
    </div>
  );
};

export const AuditReportTabs: React.FC<Props> = ({ report, promptSnapshot }) => {
  return (
    <Tabs defaultValue="domain1" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="domain1">Pertinence</TabsTrigger>
        <TabsTrigger value="domain2">Modèle</TabsTrigger>
        <TabsTrigger value="domain3">Données</TabsTrigger>
        <TabsTrigger value="domain4">Infrastructure</TabsTrigger>
        <TabsTrigger value="indicators">Indicateurs env.</TabsTrigger>
        <TabsTrigger value="action">Plan d'action</TabsTrigger>
        <TabsTrigger value="prompt">Prompt utilisé</TabsTrigger>
      </TabsList>

      {(['domain1', 'domain2', 'domain3', 'domain4'] as const).map((k) => (
        <TabsContent key={k} value={k} className="mt-4">
          <h2 className="text-xl font-bold mb-4">{DOMAIN_NAMES[k]}</h2>
          <DomainSection report={report} domainKey={k} />
        </TabsContent>
      ))}

      <TabsContent value="indicators" className="mt-4">
        <h2 className="text-xl font-bold mb-4">📐 Indicateurs environnementaux</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(report.env_indicators ?? []).map((ind: any, i: number) => (
            <Card key={i} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{ind.name}</div>
                {ind.unit && <div className="text-xs text-muted-foreground">{ind.unit}</div>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={ind.priority === 'haute' ? 'destructive' : 'secondary'} className="text-[10px]">
                  Priorité {ind.priority}
                </Badge>
                <span className={`text-xs ${ind.currently_measured ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {ind.currently_measured ? '✓ Mesuré' : '✗ Non mesuré'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="action" className="mt-4 space-y-6">
        <h2 className="text-xl font-bold">🗺️ Plan d'action</h2>
        {(['phase1_quick', 'phase2_short', 'phase3_medium'] as const).map((ph, idx) => {
          const actions = report.action_plan?.[ph] ?? [];
          const labels = ['Phase 1 — Rapide (0–4 semaines)', 'Phase 2 — Court terme (1–3 mois)', 'Phase 3 — Moyen terme (3–6 mois)'];
          return (
            <section key={ph}>
              <h3 className="font-semibold mb-2">{labels[idx]}</h3>
              <div className="space-y-2">
                {actions.map((a: any, i: number) => (
                  <Card key={i} className="p-3 flex items-start justify-between gap-3">
                    <div className="text-sm">{a.action}</div>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="secondary">{a.afnor_reference}</Badge>
                      <Badge variant="outline">{a.impact}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </TabsContent>

      <TabsContent value="prompt" className="mt-4">
        <h2 className="text-xl font-bold mb-4">📜 Prompt utilisé (snapshot figé)</h2>
        <Card className="p-4">
          <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-auto">
            {promptSnapshot}
          </pre>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
