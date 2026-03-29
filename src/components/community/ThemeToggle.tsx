import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <button
      onClick={toggle}
      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        isDark
          ? 'text-amber-300/70 hover:text-amber-200 hover:bg-white/10'
          : 'text-emerald-700/70 hover:text-emerald-800 hover:bg-emerald-100/60'
      } ${className}`}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Sun className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Moon className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
