import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft } from 'lucide-react';
import { useSubmitFeedback } from '@/hooks/useExplorations';
import { toast } from 'sonner';

interface Props {
  explorationId: string;
  sessionId: string;
  onBack?: () => void;
}

const ExperienceOutro: React.FC<Props> = ({ explorationId, sessionId, onBack }) => {
  const [rating, setRating] = useState<number | undefined>();
  const [comment, setComment] = useState('');
  const { mutateAsync, isPending } = useSubmitFeedback();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Partagez un mot avant d\'envoyer.');
      return;
    }
    try {
      await mutateAsync({ exploration_id: explorationId, language: 'fr', rating, comment });
      toast.success('Merci pour votre retour !');
      setComment('');
      setRating(undefined);
    } catch (e) {
      toast.error('Envoi du feedback impossible');
    }
  };

  return (
    <article className="rounded-xl border p-6">
      {/* Navigation Header */}
      {onBack && (
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à la marche précédente
          </Button>
        </div>
      )}
      
      <h2 className="text-xl font-semibold">Merci d\'avoir voyagé avec nous</h2>
      <p className="mt-2 text-foreground/80">Quelques questions pour nourrir l\'écriture à venir :</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm">Votre ressenti global</label>
          <select
            className="mt-1 w-full rounded-md border bg-background p-2"
            value={rating ?? ''}
            onChange={(e) => setRating(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">— Sélectionnez —</option>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{n} / 5</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Un écho, une image, une idée…</label>
          <Textarea
            className="mt-1"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez une impression — elle guidera la prochaine écriture."
          />
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={handleSubmit} disabled={isPending}>Envoyer</Button>
      </div>
      <p className="mt-3 text-xs text-foreground/60">Vos retours sont anonymisés et permettront de caractériser des profils de lecture.</p>
    </article>
  );
};

export default ExperienceOutro;
