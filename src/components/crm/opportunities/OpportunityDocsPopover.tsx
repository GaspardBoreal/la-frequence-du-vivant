import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { iconFor, formatSize } from '@/lib/crmDocIcon';
import {
  useOpportunityDocsFromIndex,
  type OpportunityDocSummary,
} from '@/hooks/useOpportunitiesDocumentsIndex';

const BUCKET = 'crm-opportunity-docs';

interface Props {
  opportunityId: string;
  onOpenFull?: () => void;
}

export const OpportunityDocsPopover: React.FC<Props> = ({ opportunityId, onOpenFull }) => {
  const docs = useOpportunityDocsFromIndex(opportunityId);
  const count = docs.length;

  if (count === 0) return null;

  const openDoc = async (doc: OpportunityDocSummary, download = false) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60, download ? { download: doc.file_name } : undefined);
    if (error || !data) {
      toast.error('Impossible de générer le lien');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const stop = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={stop}
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] font-medium"
          title={`${count} document${count > 1 ? 's' : ''}`}
        >
          <FileText className="h-3 w-3" />
          <span>{count}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0"
        onClick={stop}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Documents ({count})
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {docs.map((doc) => {
            const Icon = iconFor(doc.mime_type, doc.file_name);
            return (
              <div key={doc.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{doc.file_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatSize(doc.file_size)}
                    {doc.file_size ? ' • ' : ''}
                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    stop(e);
                    openDoc(doc, false);
                  }}
                  title="Ouvrir"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    stop(e);
                    openDoc(doc, true);
                  }}
                  title="Télécharger"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
        {onOpenFull && (
          <div className="px-3 py-2 border-t">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onOpenFull();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Gérer les documents
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
