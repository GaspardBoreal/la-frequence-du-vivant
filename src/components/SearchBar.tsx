
import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { RegionalTheme } from '../utils/regionalThemes';
import { SearchResult } from '../pages/Index';
import { geocodeAddress } from '../utils/geocoding';

interface SearchBarProps {
  onSearch: (result: SearchResult) => void;
  theme: RegionalTheme;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, theme }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await geocodeAddress(query);
      onSearch(result);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par adresse ou coordonnées GPS..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none text-gray-700 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-md text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {isLoading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
