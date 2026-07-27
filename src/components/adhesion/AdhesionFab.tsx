import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Bouton flottant universel "Rejoindre la Fréquence".
 * Renvoie vers la page de connexion en préselectionnant l'onglet Inscription
 * pour éviter la confusion avec le formulaire d'adhésion à l'association
 * (qui reste accessible depuis la page /marches-du-vivant/association).
 *
 * N'est jamais affiché à un utilisateur déjà connecté.
 */
export const AdhesionFab: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  // Ne rien afficher tant que la session n'est pas résolue (évite un flash du CTA).
  if (isLoading || user) return null;

  // Masquer sur certaines routes
  const hideOn = [
    '/marches-du-vivant/mon-espace',
    '/marches-du-vivant/connexion',
    '/marches-du-vivant/association',
    '/access-admin',
    '/admin',
    '/crm',
    '/adhesion',
    '/marches-du-vivant/carte-marches-du-vivant',
    '/jardin/',
  ];
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null;


  return (
    <Link
      to="/marches-du-vivant/connexion?tab=register"
      aria-label="Rejoindre la Fréquence du Vivant"
      className="fixed bottom-5 right-5 z-40 group inline-flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 print:hidden"
    >
      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
      <span className="text-sm font-medium hidden sm:inline">Rejoindre la Fréquence</span>
      <span className="text-sm font-medium sm:hidden">Rejoindre</span>
    </Link>
  );
};

export default AdhesionFab;
