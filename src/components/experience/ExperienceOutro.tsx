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
      toast.error("Partagez un mot avant d'envoyer.");
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
    <article className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/10 via-primary/5 to-primary/15 p-6 md:p-8">
      {/* Navigation Header */}
      {onBack && (
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            aria-label="Revenir à l'étape précédente"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      )}

      {/* Title */}
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-normal tracking-tight">Un écho après la marche</h1>
        <p className="text-foreground/80">Laissez un ressenti — il guidera l’écriture à venir.</p>
      </header>

      {/* Rating + Comment */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm mb-2 block">Votre ressenti global</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = rating === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} sur 5`}
                  className={`h-11 w-11 rounded-full border flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'bg-accent/20 border-accent/50 ring-accent'
                      : 'bg-background/60 border-border hover:bg-background/70'
                  }`}
                >
                  {/* Simple wave glyph */}
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={active ? 'text-accent' : 'text-foreground/80'}
                  >
                    <path d="M3 12c2-2 4 2 6 0s4-2 6 0 4 2 6 0" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-sm mb-2 block">Un écho, une image, une idée…</label>
          <Textarea
            className="gaspard-glass min-h-[120px]"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez une impression — spectres de sons, couleurs, endroits…"
          />
          <div className="mt-1 text-xs text-muted-foreground text-right">{comment.length}/1000</div>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="hero" size="lg" onClick={handleSubmit} disabled={isPending} className="btn-glow">
          {isPending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </div>

      <p className="mt-4 text-xs text-foreground/70">Les retours sont anonymisés et nourrissent les profils de lecture.</p>
    </article>
  );
};

export default ExperienceOutro;
