
import React, { useRef, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Saisissez votre texte...",
  className
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
      }
    }
  }, [executeCommand]);

  // Convertir le HTML en texte brut pour l'affichage initial si nécessaire
  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className={cn("border border-gray-300 rounded-lg bg-white shadow-sm", className)}>
      <style>
        {`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}
      </style>
      {/* Barre d'outils bien visible */}
      <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50/80 rounded-t-lg">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('bold')}
          className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
        >
          <Bold className="h-4 w-4 text-gray-700" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('italic')}
          className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
        >
          <Italic className="h-4 w-4 text-gray-700" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('underline')}
          className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
        >
          <Underline className="h-4 w-4 text-gray-700" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('insertUnorderedList')}
          className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
        >
          <List className="h-4 w-4 text-gray-700" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand('insertOrderedList')}
          className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
        >
          <ListOrdered className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
      
      {/* Zone d'édition */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[150px] p-4 focus:outline-none prose prose-sm max-w-none text-gray-900 bg-white rounded-b-lg"
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
        }}
      />
    </div>
  );
};
