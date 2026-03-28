import React from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

interface SortToggleProps {
  sort: 'desc' | 'asc';
  onToggle: () => void;
}

const SortToggle: React.FC<SortToggleProps> = ({ sort, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-emerald-200/50 text-[10px] transition-colors"
    title={sort === 'desc' ? 'Plus récent en premier' : 'Plus ancien en premier'}
  >
    {sort === 'desc' ? <ArrowDownWideNarrow className="w-3 h-3" /> : <ArrowUpNarrowWide className="w-3 h-3" />}
    {sort === 'desc' ? 'Récent' : 'Ancien'}
  </button>
);

export default SortToggle;
