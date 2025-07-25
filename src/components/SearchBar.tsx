
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

  // Fonction pour détecter si la query contient des coordonnées GPS
  const isCoordinates = (text: string): boolean => {
    // Regex pour détecter format: latitude,longitude ou latitude longitude
    const coordRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    return coordRegex.test(text.trim());
  };

  // Fonction pour extraire latitude et longitude
  const parseCoordinates = (text: string): [number, number] | null => {
    const coordRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const match = text.trim().match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      return [lat, lon];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Vérifier si l'input contient des coordonnées
      if (isCoordinates(query)) {
        const coords = parseCoordinates(query);
        if (coords) {
          const [latitude, longitude] = coords;
          // Créer directement le résultat de recherche avec les coordonnées
          const result: SearchResult = {
            coordinates: [latitude, longitude],
            address: `Coordonnées: ${latitude}, ${longitude}`,
            region: 'france' // Région par défaut
          };
          onSearch(result);
        }
      } else {
        // Utiliser l'API de géocodage pour les adresses
        const result = await geocodeAddress(query);
        onSearch(result);
      }
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
