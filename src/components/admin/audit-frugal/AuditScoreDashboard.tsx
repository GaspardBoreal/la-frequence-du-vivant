import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, AlertTriangle, CheckCircle2, TrendingUp, Database, Cpu, Server, ShieldCheck } from 'lucide-react';

interface Props {
  report: any;
  scopeLabel: string;
  launchedAt: string;
  modelUsed?: string | null;
  templateName?: string | null;
  templateVersion?: number | null;
}

const MATURITY_COLORS: Record<string, string> = {
  non_conforme: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  insuffisant: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  en_progression: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-200 border-yellow-500/30',
  conforme: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  exemplaire: 'bg-green-600/15 text-green-800 dark:text-green-200 border-green-600/40',
};

const DOMAIN_ICONS: Record<string, any> = {
  domain1: ShieldCheck,
  domain2: Cpu,
  domain3: Database,
  domain4: Server,
};

const DOMAIN_NAMES: Record<string, string> = {
  domain1: 'Pertinence & Gouvernance',
  domain2: 'Modèle & Algorithme',
  domain3: 'Données',
  domain4: 'Infrastructure & Ressources',
};

export const AuditScoreDashboard: React.FC<Props> = ({ report, scopeLabel, launchedAt, modelUsed, templateName, templateVersion }) => {
  if (!report) return null;
  const ml = report.maturity_level as string;
  const colorClass = MATURITY_COLORS[ml] ?? MATURITY_COLORS.en_progression;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Leaf className="h-4 w-4 text-emerald-500" />
          <span>Audit IA Frugale — Référentiel AFNOR SPEC 2314</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{scopeLabel}</h1>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>📅 {new Date(launchedAt).toLocaleString('fr-FR')}</span>
          {modelUsed && <span>🤖 {modelUsed}</span>}
          {templateName && <span>📜 {templateName} v{templateVersion}</span>}
        </div>
      </div>

      {/* Score global + maturité */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20">
        <div className="grid md:grid-cols-[auto,1fr] gap-6 items-center">
          <div className="text-center">
            <div className="text-6xl md:text-7xl font-bold text-emerald-600 dark:text-emerald-400">
              {report.global_score}
            </div>
            <div className="text-sm text-muted-foreground mt-1">/ 100</div>
          </div>
          <div className="space-y-3">
            <Badge variant="outline" className={`text-base px-4 py-2 ${colorClass}`}>
              {report.maturity_label ?? ml}
            </Badge>
            <p className="text-sm md:text-base leading-relaxed">{report.executive_summary}</p>
          </div>
        </div>
      </Card>

      {/* 4 domaines */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['domain1', 'domain2', 'domain3', 'domain4'] as const).map((key) => {
          const d = report.domain_scores?.[key];
          if (!d) return null;
          const Icon = DOMAIN_ICONS[key];
          const pct = (d.score / d.max) * 100;
          return (
            <Card key={key} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">{DOMAIN_NAMES[key]}</span>
              </div>
              <div className="text-3xl font-bold">{d.score}<span className="text-base text-muted-foreground">/{d.max}</span></div>
              <Progress value={pct} className="h-1.5" />
            </Card>
          );
        })}
      </div>

      {/* Top points forts + critiques */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Points forts</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {(report.strong_points ?? []).slice(0, 3).map((sp: any, i: number) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-600 shrink-0">✓</span>
                <div>
                  <span className="font-medium">{sp.title}</span>{' '}
                  <Badge variant="secondary" className="text-[10px]">{sp.afnor_reference}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5 border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold">Améliorations critiques</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {(report.improvements?.critical ?? []).slice(0, 3).map((imp: any, i: number) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-600 shrink-0">!</span>
                <div>
                  <span className="font-medium">{imp.problem}</span>{' '}
                  <Badge variant="secondary" className="text-[10px]">{imp.afnor_reference}</Badge>
                </div>
              </li>
            ))}
            {(report.improvements?.critical ?? []).length === 0 && (
              <li className="text-muted-foreground italic flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Aucune amélioration critique identifiée.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
};
