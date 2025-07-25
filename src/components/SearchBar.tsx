
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RegionalTheme } from '../utils/regionalThemes';
import { geocodeAddress, parseCoordinates } from '../utils/geocoding';

interface SearchBarProps {
  onSearch: (result: { coordinates: [number, number], address: string, region: string }) => void;
  theme: RegionalTheme;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, theme }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (value: string) => {
    setQuery(value);
    
    if (value.length > 2) {
      setLoading(true);
      try {
        // Check if it's coordinates
        const coords = parseCoordinates(value);
        if (coords) {
          setSuggestions([{
            display_name: `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`,
            lat: coords[0],
            lon: coords[1],
            type: 'coordinates'
          }]);
        } else {
          // Geocode city names
          const results = await geocodeAddress(value);
          setSuggestions(results.slice(0, 5));
        }
        setShowSuggestions(true);
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      }
      setLoading(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    const coordinates: [number, number] = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    const address = suggestion.display_name;
    const region = suggestion.display_name.includes('Nouvelle-Aquitaine') ? 'Nouvelle-Aquitaine' : 'France';
    
    setQuery(address);
    setShowSuggestions(false);
    onSearch({ coordinates, address, region });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const coords = parseCoordinates(query);
      if (coords) {
        onSearch({ 
          coordinates: coords, 
          address: `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`, 
          region: 'Nouvelle-Aquitaine' 
        });
      } else {
        const results = await geocodeAddress(query);
        if (results.length > 0) {
          const result = results[0];
          handleSuggestionClick(result);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Rechercher par coordonnées GPS (43.3, -0.29) ou nom de ville..."
              className="pl-10 pr-4 py-2 h-12 text-lg border-2 border-gray-200 focus:border-green-500 transition-colors"
              style={{ borderColor: showSuggestions ? theme.colors.primary : undefined }}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 px-6 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto border-2"
          style={{ borderColor: theme.colors.primary }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{suggestion.display_name}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
