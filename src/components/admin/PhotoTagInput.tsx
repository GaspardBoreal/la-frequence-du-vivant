import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, Plus, Tag } from 'lucide-react';
import { getSuggestedTags } from '../../utils/supabasePhotoOperations';
import { toast } from 'sonner';

interface PhotoTagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PhotoTagInput: React.FC<PhotoTagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Ajouter des tags...",
  disabled = false
}: PhotoTagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger les tags suggérés (uniquement en mode édition pour éviter les appels multiples)
  useEffect(() => {
    if (disabled || suggestedTags.length > 0) return;

    const loadSuggestions = async () => {
      try {
        const suggestions = await getSuggestedTags(50);
        setSuggestedTags(suggestions);
      } catch (error) {
        console.warn('Erreur chargement suggestions tags:', error);
      }
    };
    
    loadSuggestions();
  }, [disabled, suggestedTags.length]);

  // Filtrer les suggestions basé sur l'input
  useEffect(() => {
    if (!inputValue.trim()) {
      // Montrer les suggestions les plus populaires qui ne sont pas déjà utilisées
      setFilteredSuggestions(
        suggestedTags
          .filter(tag => !tags.includes(tag))
          .slice(0, 10)
      );
    } else {
      // Filtrer par l'input et exclure les tags existants
      const filtered = suggestedTags
        .filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) && 
          !tags.includes(tag)
        )
        .slice(0, 8);
      
      setFilteredSuggestions(filtered);
    }
  }, [inputValue, suggestedTags, tags]);

  // Fermer les suggestions si on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tagText: string) => {
    const newTag = tagText.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      onTagsChange([...tags, newTag]);
      setInputValue('');
      setIsOpen(false);
      
      // Refocus l'input après l'ajout
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Supprimer le dernier tag si l'input est vide
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Tags existants */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs px-2 py-1 flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              {tag}
              {!disabled && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-3 w-3 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input pour nouveau tag */}
      {!disabled && (
        <>
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="text-sm h-8 pr-10"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                if (inputValue.trim()) {
                  addTag(inputValue);
                } else {
                  setIsOpen(!isOpen);
                  inputRef.current?.focus();
                }
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {isOpen && (filteredSuggestions.length > 0 || inputValue.trim().length > 0) && (
            <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
              <div className="p-1">
                {/* Option de création si rien ne correspond */}
                {(() => {
                  const normalized = inputValue.trim().toLowerCase();
                  const canCreate = normalized.length > 0 && !tags.includes(normalized) && !suggestedTags.includes(normalized);
                  return canCreate ? (
                    <button
                      key={`create-${normalized}`}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded flex items-center gap-2"
                      onClick={() => addTag(normalized)}
                    >
                      <Plus className="h-3 w-3 text-primary" />
                      Créer "{inputValue.trim()}"
                    </button>
                  ) : null;
                })()}

                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded flex items-center gap-2"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Message d'aide */}
      {!disabled && tags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Tapez un tag et appuyez sur Entrée, ou sélectionnez une suggestion
        </p>
      )}
    </div>
  );
};

export default PhotoTagInput;