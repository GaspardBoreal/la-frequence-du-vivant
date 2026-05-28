import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuditRunBySlug } from '@/hooks/useAuditRuns';
import { AuditScoreDashboard } from '@/components/admin/audit-frugal/AuditScoreDashboard';
import { AuditReportTabs } from '@/components/admin/audit-frugal/AuditReportTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, ArrowLeft, Link2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const PublicAuditFrugal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: run, isLoading, error } = useAuditRunBySlug(slug);
  const { isAdmin } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Lien public copié');
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    if (run) {
      document.title = `Audit IA Frugale — ${run.scope_label}`;
    }
  }, [run]);

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-10 space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Audit introuvable</h1>
        <p className="text-muted-foreground">Ce rapport d'audit n'existe pas ou n'est pas public.</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Retour à l'accueil</Link>
      </div>
    );
  }

  if (run.status !== 'completed' || !run.report_json) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Audit non disponible</h1>
        <p className="text-muted-foreground">
          Statut : {run.status}
          {run.error_message && <span className="block mt-2 text-sm">{run.error_message}</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-10 space-y-8">
        <AuditScoreDashboard
          report={run.report_json}
          scopeLabel={run.scope_label}
          launchedAt={run.launched_at}
          modelUsed={run.model_used}
          templateName={run.template_name}
          templateVersion={run.template_version}
        />

        <AuditReportTabs report={run.report_json} promptSnapshot={run.prompt_snapshot} />

        <Card className="p-4 bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Leaf className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <strong>⚠️ Avertissement.</strong> Cet audit est basé sur une analyse statique de l'architecture et du contexte fourni au modèle.
              Une évaluation quantitative complète (ACV, mesure réelle de consommation) nécessiterait des outils dédiés
              (CodeCarbon, EcoLogits, Green Algorithms) et une campagne de mesure en conditions réelles,
              conformément à la section 2.1.4 de l'AFNOR SPEC 2314.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PublicAuditFrugal;
