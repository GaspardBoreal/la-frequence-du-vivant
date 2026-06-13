import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CrmIa: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-[hsl(var(--crm-accent))] to-purple-500 flex items-center justify-center shadow-2xl shadow-[hsl(var(--crm-accent-glow))] mb-6"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        <h1 className="text-2xl font-semibold text-[hsl(var(--crm-text))] mb-2">
          Assistant CRM
        </h1>
        <p className="text-sm crm-muted mb-6">
          Un module d'intelligence dédié au CRM est en cours de spécification. Il pourra
          qualifier vos suspects, prioriser vos relances et générer des synthèses de comptes
          directement depuis cette interface.
        </p>
        <span className="inline-block text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full crm-surface-elevated crm-muted">
          Bientôt disponible
        </span>
      </div>
    </div>
  );
};

export default CrmIa;
