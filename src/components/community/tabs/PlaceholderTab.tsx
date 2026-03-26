import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Volume2, Flower2, Globe, Lock } from 'lucide-react';

type PlaceholderType = 'carnet' | 'sons' | 'kigo' | 'territoire';

const META: Record<PlaceholderType, { title: string; desc: string; icon: React.ElementType; iconBg: string; iconColor: string }> = {
  carnet: {
    title: 'Carnet de terrain',
    desc: 'Bientôt, consignez vos observations de biodiversité et partagez vos découvertes avec la communauté.',
    icon: BookOpen,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  sons: {
    title: 'Bibliothèque sonore',
    desc: 'Enregistrez les sons du vivant lors de vos marches et contribuez à la bioacoustique participative.',
    icon: Volume2,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
  kigo: {
    title: 'Kigo & Haïkus',
    desc: 'Capturez l\'essence des saisons en haïkus. L\'IA du vivant vous accompagne dans la géopoétique japonaise.',
    icon: Flower2,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  territoire: {
    title: 'Mon territoire',
    desc: 'Visualisez vos explorations sur la carte et découvrez les zones encore inexplorées près de chez vous.',
    icon: Globe,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
};

interface PlaceholderTabProps {
  type: PlaceholderType;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ type }) => {
  const { title, desc, icon: Icon, iconBg, iconColor } = META[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4"
    >
      <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mx-auto`}>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">{desc}</p>
      <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-xs text-gray-400">
        <Lock className="w-3 h-3" />
        Bientôt disponible
      </div>
    </motion.div>
  );
};

export default PlaceholderTab;
