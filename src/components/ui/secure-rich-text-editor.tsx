import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Separator } from './separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Quote,
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

interface SecureRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SecureRichTextEditor: React.FC<SecureRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Tapez votre texte ici...",
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Range | null>(null);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSelection(sel.getRangeAt(0));
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (selection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(selection);
    }
  }, [selection]);

  const executeCommand = useCallback((command: string, value?: string) => {
    restoreSelection();
    
    // Use modern approaches instead of deprecated execCommand
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    switch (command) {
      case 'bold':
        toggleWrap('strong');
        break;
      case 'italic':
        toggleWrap('em');
        break;
      case 'underline':
        toggleWrap('u');
        break;
      case 'insertUnorderedList':
        toggleList('ul');
        break;
      case 'insertOrderedList':
        toggleList('ol');
        break;
      case 'formatBlock':
        if (value === 'blockquote') {
          toggleWrap('blockquote');
        }
        break;
      case 'justifyLeft':
        setAlignment('left');
        break;
      case 'justifyCenter':
        setAlignment('center');
        break;
      case 'justifyRight':
        setAlignment('right');
        break;
      default:
        // Fallback for simple commands if needed
        try {
          document.execCommand(command, false, value);
        } catch (e) {
          console.warn('Command not supported:', command);
        }
    }

    // Update content after command
    updateContent();
  }, [restoreSelection]);

  const toggleWrap = (tagName: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const element = document.createElement(tagName);
      element.textContent = selectedText;
      range.deleteContents();
      range.insertNode(element);
    }
  };

  const toggleList = (listType: 'ul' | 'ol') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const list = document.createElement(listType);
      const li = document.createElement('li');
      li.textContent = selectedText;
      list.appendChild(li);
      
      range.deleteContents();
      range.insertNode(list);
    }
  };

  const setAlignment = (align: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    let element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
    
    while (element && element !== editor && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
      element = element.parentElement;
    }
    
    if (element && element !== editor) {
      (element as HTMLElement).style.textAlign = align;
    }
  };

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const sanitizedContent = sanitizeHtml(editorRef.current.innerHTML);
      onChange(sanitizedContent);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    updateContent();
  }, [updateContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
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

  return (
    <div className={`border border-input rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('underline')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertUnorderedList')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertOrderedList')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('formatBlock', 'blockquote')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('justifyLeft')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('justifyCenter')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('justifyRight')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 focus:outline-none"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
        data-placeholder={placeholder}
        style={{
          // Show placeholder when empty
          position: 'relative'
        }}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};