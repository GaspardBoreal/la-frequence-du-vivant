import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Leaf, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { toast } from 'sonner';

const MarchesDuVivantValiderPresence = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useCommunityAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error' | 'not_found'>('loading');
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login with return URL
      sessionStorage.setItem('returnAfterLogin', `/marches-du-vivant/valider-presence/${qrCode}`);
      navigate('/marches-du-vivant/connexion');
      return;
    }

    validatePresence();
  }, [user, authLoading, qrCode]);

  const validatePresence = async () => {
    if (!user || !qrCode) return;

    try {
      // Find the event by QR code
      const { data: event, error: eventError } = await supabase
        .from('marche_events')
        .select('id, title')
        .eq('qr_code', qrCode)
        .maybeSingle();

      if (eventError || !event) {
        setStatus('not_found');
        return;
      }

      setEventTitle(event.title);

      // Check if already participated
      const { data: existing } = await supabase
        .from('marche_participations')
        .select('id, validated_at')
        .eq('user_id', user.id)
        .eq('marche_event_id', event.id)
        .maybeSingle();

      if (existing?.validated_at) {
        setStatus('already');
        return;
      }

      if (existing) {
        // Update existing participation
        const { error } = await supabase
          .from('marche_participations')
          .update({ validated_at: new Date().toISOString(), validation_method: 'qr_code' })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new participation
        const { error } = await supabase
          .from('marche_participations')
          .insert({
            user_id: user.id,
            marche_event_id: event.id,
            validated_at: new Date().toISOString(),
            validation_method: 'qr_code',
          });

        if (error) throw error;
      }

      setStatus('success');
      toast.success('Participation validée ! 🎉');
    } catch (error) {
      console.error('Validation error:', error);
      setStatus('error');
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-300 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Validation de présence | Les Marches du Vivant</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full text-center space-y-4"
        >
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Présence validée ! 🌿</h1>
              <p className="text-emerald-200/70">
                Votre participation à <strong className="text-white">{eventTitle}</strong> a été enregistrée.
              </p>
              <p className="text-sm text-emerald-200/50">
                Votre progression de rôle a été mise à jour automatiquement.
              </p>
            </>
          )}

          {status === 'already' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-amber-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Déjà validée !</h1>
              <p className="text-emerald-200/70">
                Votre participation à <strong className="text-white">{eventTitle}</strong> était déjà enregistrée.
              </p>
            </>
          )}

          {status === 'not_found' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">QR code invalide</h1>
              <p className="text-emerald-200/70">Ce QR code ne correspond à aucune marche enregistrée.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Erreur</h1>
              <p className="text-emerald-200/70">Une erreur est survenue lors de la validation.</p>
            </>
          )}

          <div className="pt-4 space-y-2">
            <Link to="/marches-du-vivant/mon-espace">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white">
                Mon espace marcheur
              </Button>
            </Link>
            <Link to="/marches-du-vivant/explorer">
              <Button variant="ghost" className="w-full text-emerald-200/70 hover:text-white hover:bg-white/10">
                Explorer les marches
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default MarchesDuVivantValiderPresence;
