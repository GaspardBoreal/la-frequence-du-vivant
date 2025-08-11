import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmitFeedback } from '@/hooks/useExplorations';
import { toast } from 'sonner';

interface Props {
  explorationId: string;
  sessionId: string;
  onBack?: () => void;
}

const ExperienceOutroDordogne: React.FC<Props> = ({ explorationId, sessionId, onBack }) => {
  const [rating, setRating] = useState<string>('');
  const [comment, setComment] = useState('');
  const { mutateAsync: submitFeedback, isPending } = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      toast.error('Votre retour doit contenir au moins 10 caractères');
      return;
    }

    try {
      await submitFeedback({
        exploration_id: explorationId,
        language: 'fr',
        rating: rating ? parseInt(rating) : undefined,
        comment: comment.trim()
      });
      toast.success('Merci pour votre retour !');
      setRating('');
      setComment('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de votre retour');
    }
  };

  return (
    <div className="dordogne-experience min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-400/10 to-transparent animate-soft-pulse"></div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-gentle-float opacity-30"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${10 + Math.random() * 5}s`
            }}
          >
            <div className="w-3 h-3 bg-purple-300 rounded-full blur-sm"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <article className="relative z-20 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="mb-8 text-purple-200 hover:text-white hover:bg-purple-800/30"
            >
              ← Retour à l'expérience
            </Button>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full mb-6">
              <span className="text-purple-200 font-medium">Fin d'expérience</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">
              Merci pour cette exploration
            </h1>
            
            <p className="text-lg text-purple-100/80 leading-relaxed">
              Votre voyage sonore dans les eaux vivantes de la Dordogne touche à sa fin. 
              Partagez avec nous vos impressions pour enrichir cette expérience collective.
            </p>
          </div>

          {/* Feedback form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-purple-200 font-medium mb-3">
                  Comment évaluez-vous cette expérience ?
                </label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choisissez une note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Exceptionnelle</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Très bonne</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Bonne</SelectItem>
                    <SelectItem value="2">⭐⭐ Correcte</SelectItem>
                    <SelectItem value="1">⭐ À améliorer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-purple-200 font-medium mb-3">
                  Partagez vos impressions, émotions ou suggestions
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Qu'avez-vous ressenti pendant cette exploration ? Quels sons vous ont marqué ? Avez-vous des suggestions pour améliorer l'expérience ?"
                  className="min-h-32 bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                />
                <div className="text-right text-sm text-purple-300/60 mt-2">
                  {comment.length} caractères (minimum 10)
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isPending || comment.trim().length < 10}
                className="w-full btn-glow bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 py-4 text-lg disabled:opacity-50"
              >
                {isPending ? '✨ Envoi en cours...' : '🌊 Partager mon expérience'}
              </Button>
            </div>
          </form>

          {/* Poetic closing */}
          <div className="text-center mt-12 p-6 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-2xl border border-purple-400/20">
            <p className="text-purple-200/80 italic text-lg leading-relaxed">
              "Comme les eaux de la Dordogne qui continuent leur voyage vers l'océan,<br/>
              votre expérience se prolonge dans la mémoire des sons découverts..."
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ExperienceOutroDordogne;