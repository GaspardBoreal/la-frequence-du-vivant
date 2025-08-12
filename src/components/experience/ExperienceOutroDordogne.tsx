import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSubmitFeedback } from '@/hooks/useExplorations';
import { toast } from 'sonner';
import ExperienceFooter from './ExperienceFooter';

interface Props {
  explorationId: string;
  sessionId: string;
  onBack?: () => void;
}

const ExperienceOutroDordogne: React.FC<Props> = ({ explorationId, sessionId, onBack }) => {
  console.log('🌊 ExperienceOutroDordogne - Rendering with explorationId:', explorationId);
  const [rating, setRating] = useState<string>('');
  const [comment, setComment] = useState('');
  const { mutateAsync: submitFeedback, isPending: isSubmitting } = useSubmitFeedback();

  const handleSubmit = async () => {
    if (comment.trim().length < 10) {
      toast.error('Votre commentaire doit contenir au moins 10 caractères');
      return;
    }

    try {
      await submitFeedback({
        exploration_id: explorationId,
        language: 'fr',
        rating: rating ? parseInt(rating) : undefined,
        comment: comment.trim()
      });
      toast.success('Merci pour votre partage !');
      setRating('');
      setComment('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de votre retour');
    }
  };

  return (
    <div className="dordogne-experience min-h-screen relative overflow-hidden">
      {/* Living Waters Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-green-800"></div>
        <div className="absolute inset-0">
          <div className="river-wave river-wave-1 absolute bottom-0 left-0 w-full h-80"></div>
          <div className="river-wave river-wave-2 absolute bottom-0 left-0 w-full h-60" style={{ animationDelay: '1.5s' }}></div>
          <div className="river-wave river-wave-3 absolute bottom-0 left-0 w-full h-40" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>

      {/* Living Water Particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {/* Water Bubbles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`bubble-${i}`}
            className="water-bubble absolute"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${12 + Math.random() * 8}s`
            }}
          />
        ))}
        
        {/* Sediment Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`sediment-${i}`}
            className="sediment-particle absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${6 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="mb-8 bg-emerald-900/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-800/30"
            >
              ← Retour aux eaux vives
            </Button>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="dordogne-title text-6xl md:text-7xl mb-8 bg-gradient-to-r from-emerald-200 via-yellow-200 to-green-300 bg-clip-text text-transparent">
              L'écoute se prolonge...
            </h1>
            <div className="poetic-container p-8 rounded-2xl max-w-3xl mx-auto">
              <p className="dordogne-body text-xl text-emerald-100/90 leading-relaxed">
                Les eaux de la Dordogne continuent leur course, portant en elles les voix du vivant que vous venez d'entendre. 
                Votre regard attentif enrichit cette cartographie sensible de notre territoire.
              </p>
            </div>
          </div>

          {/* Feedback form */}
          <div className="poetic-container p-10 rounded-3xl mb-16">
            <h2 className="dordogne-title text-3xl text-emerald-200 mb-8 text-center">
              Votre regard sur cette traversée
            </h2>
            
            <div className="space-y-8">
              {/* Rating */}
              <div>
                <Label htmlFor="rating" className="dordogne-body text-emerald-200 mb-4 block text-lg">
                  Comment cette immersion résonne-t-elle en vous ?
                </Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger className="bg-emerald-900/20 border-emerald-400/40 text-emerald-200 h-12 rounded-xl">
                    <SelectValue placeholder="Choisir une résonance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">🌊 Profondément transformatrice</SelectItem>
                    <SelectItem value="4">🍃 Très inspirante</SelectItem>
                    <SelectItem value="3">🌿 Agréablement découvrante</SelectItem>
                    <SelectItem value="2">🌱 Modérément intéressante</SelectItem>
                    <SelectItem value="1">🥀 Peu engageante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment" className="dordogne-body text-emerald-200 mb-4 block text-lg">
                  Vos impressions, les échos que laisse cette écoute... (minimum 10 caractères)
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Les murmures de l'eau, les chants d'oiseaux, les silences... Qu'est-ce qui vous a marqué dans cette exploration ?"
                  className="dordogne-body bg-emerald-900/20 border-emerald-400/40 text-emerald-100 placeholder:text-emerald-300/60 min-h-[150px] rounded-xl text-lg leading-relaxed"
                />
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={comment.length < 10 || isSubmitting}
                className="btn-nature w-full py-4 text-lg rounded-xl"
              >
                {isSubmitting ? 'Transmission en cours...' : '🌊 Partager ces échos'}
              </Button>
            </div>
          </div>

          {/* Poetic Closing */}
          <div className="text-center mb-16">
            <div className="poetic-container p-8 rounded-2xl max-w-3xl mx-auto">
              <p className="dordogne-body text-xl text-emerald-100/80 italic leading-relaxed mb-6">
                "Dans le bruissement des roseaux et le clapotis des eaux courantes,
                <br />
                chaque espèce tisse sa partition dans la symphonie du vivant.
                <br />
                L'écoute attentive révèle l'invisible présence de nos compagnons terrestres."
              </p>
            </div>
          </div>

          <ExperienceFooter />
        </div>
      </div>
    </div>
  );
};

export default ExperienceOutroDordogne;