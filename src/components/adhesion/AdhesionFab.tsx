import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AdhesionDialog from './AdhesionDialog';

/**
 * Bouton flottant universel "Rejoindre la Fréquence".
 * Présent sur toutes les pages publiques.
 * Masqué sur l'espace marcheur connecté et l'admin.
 */
export const AdhesionFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Détection paramètres ?adhesion=1 pour ouverture automatique
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('adhesion') === '1') {
      setOpen(true);
    }
  }, [location.search]);

  // Masquer sur certaines routes
  const hideOn = [
    '/marches-du-vivant/mon-espace',
    '/access-admin',
    '/admin',
    '/crm',
    '/adhesion', // page dédiée déjà avec le formulaire
    '/marches-du-vivant/carte-marches-du-vivant',
  ];
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Rejoindre la Fréquence du Vivant"
        className="fixed bottom-5 right-5 z-40 group inline-flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 print:hidden"
      >
        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        <span className="text-sm font-medium hidden sm:inline">Rejoindre la Fréquence</span>
        <span className="text-sm font-medium sm:hidden">Rejoindre</span>
      </button>
      <AdhesionDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default AdhesionFab;
