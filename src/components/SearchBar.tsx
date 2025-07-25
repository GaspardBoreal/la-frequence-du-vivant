import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SearchResult } from '../types/index';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  results: SearchResult[];
  setResults: React.Dispatch<React.SetStateAction<SearchResult[]>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear, results, setResults }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      onSearch(value);
    } else {
      setResults([]);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <Input
          type="text"
          placeholder="Rechercher un lieu..."
          value={query}
          onChange={handleInputChange}
          className="pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {!query && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="absolute left-0 mt-2 w-full bg-card rounded-md shadow-md z-10">
          <ul>
            {results.map((result) => (
              <li key={result.properties.place_id} className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                {result.properties.display_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
