import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, GraduationCap, Sparkles, FlaskConical, Share2, TrendingUp, Lightbulb, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { InsightCard } from '@/lib/insightLevels';
import { CATEGORY_CONFIG } from '@/lib/insightLevels';

const iconMap: Record<string, React.FC<any>> = {
  GraduationCap, Sparkles, FlaskConical, Share2, TrendingUp, Lightbulb,
};

function getIcon(name: string): React.FC<any> {
  return (LucideIcons as any)[name] || Lightbulb;
}

interface InsightCardBannerProps {
  cards: InsightCard[];
  maxCards?: number;
}

const InsightCardBanner: React.FC<InsightCardBannerProps> = ({ cards, maxCards = 2 }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const visibleCards = cards
    .filter(c => !dismissed.has(c.id))
    .slice(0, maxCards);

  if (visibleCards.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visibleCards.map(card => {
        const catConfig = CATEGORY_CONFIG[card.category];
        const Icon = getIcon(card.icon_name);
        const isExpanded = expanded === card.id;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`relative rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden group`}
          >
            <button
              onClick={() => setExpanded(isExpanded ? null : card.id)}
              className="w-full text-left px-4 py-3 flex items-start gap-3"
            >
              <div className={`w-8 h-8 rounded-lg ${catConfig.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${catConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${catConfig.color}`}>
                    {catConfig.label}
                  </span>
                  {card.isAI && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 font-medium">
                      IA
                    </span>
                  )}
                </div>
                <p className="text-foreground text-sm font-medium mt-0.5 leading-snug">
                  {card.title}
                </p>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground text-xs mt-2 leading-relaxed whitespace-pre-line">
                        {card.content.replace(/\*\*/g, '')}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 mt-1 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(card.id)); }}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InsightCardBanner;
