import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Leaf, LogOut, Calendar, MapPin, CheckCircle2, Clock, QrCode, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { useCommunityParticipations, CommunityRoleKey } from '@/hooks/useCommunityProfile';
import ProgressionCard from '@/components/community/ProgressionCard';
import RoleBadge from '@/components/community/RoleBadge';
import Footer from '@/components/Footer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const MarchesDuVivantMonEspace = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, createProfile } = useCommunityAuth();
  const { data: participations = [] } = useCommunityParticipations(user?.id);
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/marches-du-vivant/connexion');
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-emerald-200 animate-pulse flex items-center gap-2">
          <Leaf className="w-5 h-5 animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  if (!profile) {
    const handleCreateProfile = async () => {
      setCreatingProfile(true);
      try {
        const emailPrefix = user.email?.split('@')[0] || '';
        const prenom = emailPrefix.split('.')[0] || 'Marcheur';
        const nom = emailPrefix.split('.')[1] || '';
        await createProfile(user.id, prenom.charAt(0).toUpperCase() + prenom.slice(1), nom.charAt(0).toUpperCase() + nom.slice(1));
        toast.success('Profil communautaire créé ! 🌿');
      } catch (e: any) {
        toast.error(e.message || 'Erreur lors de la création du profil');
      } finally {
        setCreatingProfile(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 mx-auto">
            <UserPlus className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenue parmi les marcheurs 🌿</h1>
          <p className="text-emerald-200/70">
            Votre profil communautaire n'existe pas encore. Créez-le en un clic pour accéder à votre espace.
          </p>
          <Button
            onClick={handleCreateProfile}
            disabled={creatingProfile}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full"
          >
            {creatingProfile ? 'Création en cours...' : 'Créer mon profil'}
          </Button>
        </motion.div>
      </div>
    );
  }

  const role = (profile.role || 'marcheur_en_devenir') as CommunityRoleKey;

  return (
    <>
      <Helmet>
        <title>Mon espace | Les Marches du Vivant</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <Link to="/marches-du-vivant" className="inline-flex items-center gap-2 text-emerald-200/70 hover:text-emerald-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-emerald-200/70 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-16 space-y-6">
          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              Bienvenue, {profile.prenom} 🌿
            </h1>
            <p className="text-emerald-200/60 text-sm text-center mx-auto">
              {profile.kigo_accueil === 'parle_aux_arbres' && 'Les arbres vous saluent en retour.'}
              {profile.kigo_accueil === 'transition_beton' && 'Le béton est derrière vous, la forêt devant.'}
              {profile.kigo_accueil === 'curieux_vivant' && 'La curiosité est le premier pas du marcheur.'}
              {profile.kigo_accueil === 'expert_canape' && 'Le canapé comprendra. Les sentiers vous appellent.'}
              {!profile.kigo_accueil && 'Votre parcours de marcheur continue.'}
            </p>
          </motion.div>

          {/* Progression Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ProgressionCard
              role={role}
              marchesCount={profile.marches_count}
              formationValidee={profile.formation_validee}
              certificationValidee={profile.certification_validee}
            />
          </motion.div>

          {/* QR Scanner CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link to="/marches-du-vivant/explorer">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 flex items-center gap-4 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <p className="text-white font-medium">Valider une participation</p>
                  <p className="text-emerald-200/60 text-sm">Scannez le QR code sur le lieu de la marche</p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Participations history */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-300" />
              Mes marches
            </h2>

            {participations.length === 0 ? (
              <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
                <p className="text-emerald-200/60 text-sm">Aucune participation pour le moment</p>
                <Link to="/marches-du-vivant/explorer" className="text-emerald-300 text-sm mt-2 inline-block hover:underline">
                  Découvrir les prochaines marches →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {participations.map((p) => (
                  <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {p.validated_at ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-400" />
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">
                          {p.marche_events?.title || 'Marche'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-emerald-200/50">
                          {p.marche_events?.date_marche && (
                            <span>{format(new Date(p.marche_events.date_marche), 'dd MMM yyyy', { locale: fr })}</span>
                          )}
                          {p.marche_events?.lieu && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {p.marche_events.lieu}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.validated_at ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {p.validated_at ? 'Validée' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Profile info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
              <h3 className="text-sm font-medium text-emerald-200/80">Mon profil</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-emerald-200/50">Nom</div>
                <div className="text-white">{profile.prenom} {profile.nom}</div>
                {profile.ville && <>
                  <div className="text-emerald-200/50">Ville</div>
                  <div className="text-white">{profile.ville}</div>
                </>}
                <div className="text-emerald-200/50">Email</div>
                <div className="text-white text-xs">{user.email}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MarchesDuVivantMonEspace;
