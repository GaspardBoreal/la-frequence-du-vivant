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
  refreshKey?: number; // Pour forcer le rechargement des suggestions
}

const PhotoTagInput: React.FC<PhotoTagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Ajouter des tags...",
  disabled = false,
  refreshKey = 0
}: PhotoTagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger les tags suggérés (recharge quand refreshKey change)
  useEffect(() => {
    if (disabled) return;

    const loadSuggestions = async () => {
      try {
        console.log('🔄 [PhotoTagInput] Chargement des suggestions...');
        const suggestions = await getSuggestedTags(50);
        setSuggestedTags(suggestions);
        console.log('✅ [PhotoTagInput] Suggestions chargées:', suggestions);
      } catch (error) {
        console.warn('⚠️ [PhotoTagInput] Erreur chargement suggestions:', error);
      }
    };
    
    loadSuggestions();
  }, [disabled, refreshKey]); // Recharge quand refreshKey change

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
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-hidden">
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {/* Option de création si rien ne correspond */}
                {(() => {
                  const normalized = inputValue.trim().toLowerCase();
                  const canCreate = normalized.length > 0 && !tags.includes(normalized) && !suggestedTags.includes(normalized);
                  return canCreate ? (
                    <div className="border-b border-border bg-muted/50">
                      <button
                        key={`create-${normalized}`}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 font-medium text-primary"
                        onClick={() => addTag(normalized)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Créer "<span className="font-semibold">{inputValue.trim()}</span>"</span>
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* Tags suggérés */}
                {filteredSuggestions.length > 0 && (
                  <div className="py-1">
                    {inputValue.trim().length === 0 && (
                      <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/30">
                        Tags populaires
                      </div>
                    )}
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 group"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Tag className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent-foreground" />
                        <span className="flex-1">{suggestion}</span>
                        <Plus className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Message si aucune suggestion */}
                {filteredSuggestions.length === 0 && inputValue.trim().length > 0 && !(() => {
                  const normalized = inputValue.trim().toLowerCase();
                  return normalized.length > 0 && !tags.includes(normalized) && !suggestedTags.includes(normalized);
                })() && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    <Tag className="h-4 w-4 mx-auto mb-1 opacity-50" />
                    Aucun tag correspondant trouvé
                  </div>
                )}
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