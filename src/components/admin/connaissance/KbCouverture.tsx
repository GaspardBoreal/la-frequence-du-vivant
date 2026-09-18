import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useKbCoverage } from '@/hooks/admin/useKnowledge';
import { AUDIENCE_LABEL, type KbAudience } from '@/lib/knowledge/seed';

const Kpi: React.FC<{ label: string; value: number; hint?: string; alert?: boolean }> = ({ label, value, hint, alert }) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-3xl font-semibold tabular-nums ${alert && value > 0 ? 'text-destructive' : ''}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </Card>
);

const KbCouverture: React.FC = () => {
  const { data, isLoading } = useKbCoverage();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Calcul de la couverture…</p>;

  const { fiches, questions } = data;
  const taux = questions.total > 0 ? Math.round((questions.couvertes / questions.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium">Questions couvertes par une fiche</p>
            <p className="text-xs text-muted-foreground">
              {questions.couvertes} sur {questions.total} questions du registre
            </p>
          </div>
          <span className="text-3xl font-semibold tabular-nums">{taux} %</span>
        </div>
        <Progress value={taux} className="mt-3" />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Fiches publiées" value={fiches.publiees} />
        <Kpi label="À relire" value={fiches.relecture} />
        <Kpi label="Brouillons" value={fiches.brouillons} />
        <Kpi label="Sans source" value={fiches.sans_source} hint="Ne peuvent pas être publiées" alert />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Kpi label="Fiches à relire (plus de 6 mois)" value={fiches.a_relire} hint="Relecture recommandée" alert />
        <Kpi label="Questions encore ouvertes" value={questions.ouvertes} hint="Aucune fiche ne leur répond" alert />
      </div>

      <Card className="p-5">
        <p className="mb-3 text-sm font-medium">Questions par public</p>
        <div className="space-y-2">
          {Object.entries(questions.par_public ?? {}).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span>{AUDIENCE_LABEL[k as KbAudience] ?? k}</span>
              <span className="font-semibold tabular-nums">{v as number}</span>
            </div>
          ))}
          {Object.keys(questions.par_public ?? {}).length === 0 && (
            <p className="text-xs text-muted-foreground">Le registre de questions est encore vide.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default KbCouverture;
