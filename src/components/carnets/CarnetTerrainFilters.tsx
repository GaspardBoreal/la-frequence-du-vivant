import React from 'react';
import { Search, Flower2, Sun, TreeDeciduous, Snowflake } from 'lucide-react';

export type Season = 'all' | 'printemps' | 'ete' | 'automne' | 'hiver';
export type SortMode = 'richesse' | 'date';

interface CarnetTerrainFiltersProps {
  regions: string[];
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  selectedSeason: Season;
  onSeasonChange: (season: Season) => void;
  sortMode: SortMode;
  onSortChange: (sort: SortMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SEASONS: { key: Season; icon: React.ElementType; label: string }[] = [
  { key: 'printemps', icon: Flower2, label: 'Printemps' },
  { key: 'ete', icon: Sun, label: 'Été' },
  { key: 'automne', icon: TreeDeciduous, label: 'Automne' },
  { key: 'hiver', icon: Snowflake, label: 'Hiver' },
];

const CarnetTerrainFilters: React.FC<CarnetTerrainFiltersProps> = ({
  regions, selectedRegion, onRegionChange,
  selectedSeason, onSeasonChange,
  sortMode, onSortChange,
  searchQuery, onSearchChange,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 py-4 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un lieu, un titre…"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1 border border-border/30">
            <button
              onClick={() => onSortChange('richesse')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${sortMode === 'richesse' ? 'bg-emerald-500/20 text-emerald-300' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Plus riches
            </button>
            <button
              onClick={() => onSortChange('date')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${sortMode === 'date' ? 'bg-emerald-500/20 text-emerald-300' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Plus récentes
            </button>
          </div>
        </div>

        {/* Seasons row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            <button
              onClick={() => onSeasonChange('all')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedSeason === 'all' ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'border-border/30 text-muted-foreground hover:text-foreground'}`}
            >
              Toutes
            </button>
            {SEASONS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => onSeasonChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${selectedSeason === key ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'border-border/30 text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="hidden md:block w-px h-5 bg-border/40" />

          {/* Regions */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onRegionChange(null)}
              className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${!selectedRegion ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'border-border/30 text-muted-foreground hover:text-foreground'}`}
            >
              Toutes régions
            </button>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => onRegionChange(region)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${selectedRegion === region ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'border-border/30 text-muted-foreground hover:text-foreground'}`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarnetTerrainFilters;
