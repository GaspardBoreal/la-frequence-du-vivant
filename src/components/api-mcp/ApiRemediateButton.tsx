import React from 'react';
import { Loader2, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiMcpRemediate, canRemediate } from '@/hooks/useApiMcpRemediate';

interface Props {
  slug: string;
  /** Libellé complémentaire (nom de l'API), pour l'accessibilité. */
  name?: string;
  className?: string;
}

const ApiRemediateButton: React.FC<Props> = ({ slug, name, className }) => {
  const remediate = useApiMcpRemediate();
  const running = remediate.isPending && remediate.variables === slug;

  if (!canRemediate(slug)) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] text-emerald-200/50 ${className ?? ''}`}>
        <Info className="w-3 h-3" />
        Pas de relance automatique pour cette API
      </span>
    );
  }

  return (
    <Button
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        remediate.mutate(slug);
      }}
      disabled={running}
      aria-label={name ? `Relancer la collecte — ${name}` : 'Relancer la collecte'}
      className={`bg-emerald-400/15 hover:bg-emerald-400/25 border border-emerald-400/30 text-emerald-100 ${className ?? ''}`}
    >
      {running ? (
        <>
          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          Relance en cours…
        </>
      ) : (
        <>
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Relancer la collecte
        </>
      )}
    </Button>
  );
};

export default ApiRemediateButton;
