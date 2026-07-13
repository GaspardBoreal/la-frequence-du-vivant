import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Trash2, Upload, Loader2 } from 'lucide-react';
import { useOpportunityDocuments, type OpportunityDocument } from '@/hooks/useOpportunityDocuments';
import { iconFor, formatSize } from '@/lib/crmDocIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  opportunityId: string;
}


export const OpportunityDocumentsSection: React.FC<Props> = ({ opportunityId }) => {
  const { documents, isLoading, uploadDocument, deleteDocument, openDocument } =
    useOpportunityDocuments(opportunityId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await uploadDocument.mutateAsync(file).catch(() => {});
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Documents {documents.length > 0 && `(${documents.length})`}
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDocument.isPending}
          >
            {uploadDocument.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Ajouter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Aucun document. Ajoutez des plaquettes, devis, fiches de préparation…
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = iconFor(doc.mime_type, doc.file_name);
            return (
              <Card key={doc.id} className="p-2 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{doc.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatSize(doc.file_size)}
                    {doc.file_size ? ' • ' : ''}
                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openDocument(doc)}
                  title="Ouvrir"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <DeleteButton doc={doc} onConfirm={() => deleteDocument.mutate(doc)} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DeleteButton: React.FC<{ doc: OpportunityDocument; onConfirm: () => void }> = ({
  doc,
  onConfirm,
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant="ghost" size="sm" title="Supprimer">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
        <AlertDialogDescription>
          « {doc.file_name} » sera définitivement supprimé.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Supprimer</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
