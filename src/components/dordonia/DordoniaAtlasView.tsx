import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Archive, Plus, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DordoniaAtlasViewProps {
  sessionKey: string;
  onExit: () => void;
}

interface AtlasEntry {
  id: string;
  grid_cell: string;
  type_entree: 'toponyme' | 'micro_recit' | 'contradiction' | 'blanc';
  contenu: string | null;
  is_silent_zone: boolean;
}

const GRID_ROWS = ['A', 'B', 'C', 'D', 'E'];
const GRID_COLS = [1, 2, 3, 4, 5, 6, 7];

const TYPE_LABELS = {
  toponyme: 'Toponyme',
  micro_recit: 'Micro-récit',
  contradiction: 'Contradiction',
  blanc: 'Blanc',
};

const DordoniaAtlasView: React.FC<DordoniaAtlasViewProps> = ({ sessionKey, onExit }) => {
  const [entries, setEntries] = useState<AtlasEntry[]>([]);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<AtlasEntry['type_entree']>('toponyme');
  const [formContent, setFormContent] = useState('');
  const [showSilentZones, setShowSilentZones] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing entries
  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('dordonia_atlas')
        .select('*')
        .eq('session_id', sessionKey);

      if (!error && data) {
        setEntries(data as AtlasEntry[]);
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [sessionKey]);

  const handleAddEntry = async () => {
    if (!selectedCell) return;

    try {
      const { data, error } = await supabase
        .from('dordonia_atlas')
        .insert({
          session_id: sessionKey,
          grid_cell: selectedCell,
          type_entree: formType,
          contenu: formType === 'blanc' ? null : formContent,
          is_silent_zone: false,
        })
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [...prev, data as AtlasEntry]);
      setFormContent('');
      setShowAddForm(false);
      setSelectedCell(null);
      toast.success('Entrée ajoutée à l\'ATLAS');
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const getCellEntries = (cell: string) => {
    return entries.filter(e => e.grid_cell === cell);
  };

  const getCellColor = (cell: string) => {
    const cellEntries = getCellEntries(cell);
    if (cellEntries.some(e => e.is_silent_zone)) return 'bg-slate-800/80 border-slate-600';
    if (cellEntries.length === 0) return 'bg-slate-900/50 border-slate-700/30 hover:border-emerald-500/30';
    return 'bg-emerald-900/30 border-emerald-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Map className="h-5 w-5" />
            <span className="text-sm font-medium">ATLAS</span>
          </div>
          <div className="flex items-center gap-2 text-teal-400">
            <Archive className="h-4 w-4" />
            <span className="text-xs">ARCH</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSilentZones(!showSilentZones)}
            className={showSilentZones ? 'text-amber-400' : 'text-slate-500'}
          >
            {showSilentZones ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-slate-500"
          >
            Quitter
          </Button>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-4 py-3 bg-emerald-950/20 border-b border-emerald-500/10">
        <p className="text-xs text-emerald-400/70 text-center">
          Carte floue — Sans coordonnées fines — {entries.length} entrées
        </p>
      </div>

      {/* Grid map */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Column headers */}
          <div className="flex gap-1 mb-1 pl-8">
            {GRID_COLS.map(col => (
              <div key={col} className="flex-1 text-center text-xs text-slate-500">
                {col}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {GRID_ROWS.map(row => (
            <div key={row} className="flex gap-1 mb-1">
              {/* Row header */}
              <div className="w-7 flex items-center justify-center text-xs text-slate-500">
                {row}
              </div>
              
              {/* Grid cells */}
              {GRID_COLS.map(col => {
                const cell = `${row}${col}`;
                const cellEntries = getCellEntries(cell);
                const isSilent = cellEntries.some(e => e.is_silent_zone);
                
                return (
                  <motion.button
                    key={cell}
                    whileHover={{ scale: isSilent ? 1 : 1.05 }}
                    onClick={() => {
                      if (!isSilent) {
                        setSelectedCell(cell);
                        setShowAddForm(true);
                      }
                    }}
                    disabled={isSilent && !showSilentZones}
                    className={`flex-1 aspect-square rounded border transition-all relative ${getCellColor(cell)} ${
                      isSilent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    {cellEntries.length > 0 && !isSilent && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-emerald-400">
                        {cellEntries.length}
                      </span>
                    )}
                    {isSilent && showSilentZones && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                        ∅
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-900/50 border border-slate-700/30" />
            <span>Vide</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-900/30 border border-emerald-500/30" />
            <span>Inscrit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-800/80 border border-slate-600" />
            <span>Silence</span>
          </div>
        </div>
      </div>

      {/* Add entry modal */}
      <AnimatePresence>
        {showAddForm && selectedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-700/50 p-6"
            >
              <h3 className="font-crimson text-xl text-foreground mb-4">
                Cellule {selectedCell} — Nouvelle entrée
              </h3>

              {/* Type selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map(type => (
                  <button
                    key={type}
                    onClick={() => setFormType(type)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formType === type
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                    }`}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {/* Content input */}
              {formType !== 'blanc' && (
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={
                    formType === 'toponyme' ? 'Nom du lieu...' :
                    formType === 'micro_recit' ? 'Un court récit...' :
                    'Une contradiction observée...'
                  }
                  className="mb-4 bg-slate-800/50 border-slate-700/50"
                  rows={3}
                />
              )}

              {formType === 'blanc' && (
                <p className="text-sm text-slate-500 italic mb-4">
                  Un blanc est un espace de silence, sans contenu.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-500"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddEntry}
                  disabled={formType !== 'blanc' && !formContent.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DordoniaAtlasView;
