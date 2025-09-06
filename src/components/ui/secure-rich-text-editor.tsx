import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const [isTyping, setIsTyping] = useState(false);

  const executeCommand = useCallback((command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Ensure editor has focus
    editor.focus();
    
    try {
      switch (command) {
        case 'bold':
        case 'italic':
        case 'underline':
          // Use native execCommand for reliable formatting
          document.execCommand(command, false, undefined);
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
        case 'justifyCenter':
        case 'justifyRight':
          // Use native execCommand for alignment
          document.execCommand(command, false, undefined);
          break;
        default:
          document.execCommand(command, false, value);
      }
      
      // Non-blocking content update
      requestAnimationFrame(() => {
        updateContent();
      });
    } catch (e) {
      console.warn('Command execution failed:', command, e);
    }
  }, []);

  const toggleWrap = (tagName: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const element = document.createElement(tagName);
      element.textContent = selectedText;
      range.deleteContents();
      range.insertNode(element);
      
      // Move cursor after the inserted element
      const newRange = document.createRange();
      newRange.setStartAfter(element);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
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

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      // Use requestAnimationFrame for non-blocking updates
      requestAnimationFrame(() => {
        setIsTyping(true);
        const sanitizedContent = sanitizeHtml(editorRef.current!.innerHTML);
        onChange(sanitizedContent);
        // Use shorter timeout for better responsiveness
        setTimeout(() => setIsTyping(false), 100);
      });
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

  // Update editor content when value changes from outside (but not when typing)
  useEffect(() => {
    if (!isTyping && editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      const sanitizedValue = sanitizeHtml(value);
      
      // Only update if the content is actually different
      if (currentContent !== sanitizedValue) {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const startOffset = range?.startOffset || 0;
        const endOffset = range?.endOffset || 0;
        
        editorRef.current.innerHTML = sanitizedValue;
        
        // Restore cursor position if possible
        if (range && selection) {
          try {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let currentOffset = 0;
            let startNode = null;
            let endNode = null;
            
            while (walker.nextNode()) {
              const node = walker.currentNode;
              const nodeLength = node.textContent?.length || 0;
              
              if (!startNode && currentOffset + nodeLength >= startOffset) {
                startNode = node;
              }
              if (!endNode && currentOffset + nodeLength >= endOffset) {
                endNode = node;
                break;
              }
              
              currentOffset += nodeLength;
            }
            
            if (startNode && endNode) {
              newRange.setStart(startNode, Math.min(startOffset - (currentOffset - (startNode.textContent?.length || 0)), startNode.textContent?.length || 0));
              newRange.setEnd(endNode, Math.min(endOffset - (currentOffset - (endNode.textContent?.length || 0)), endNode.textContent?.length || 0));
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (e) {
            // If cursor restoration fails, just continue
          }
        }
      }
    }
  }, [value, isTyping]);

  return (
    <div className={`border border-input rounded-md flex flex-col ${className}`}>
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 border-b border-border bg-background/95 backdrop-blur-sm">
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
      
      {/* Editor - scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[200px] p-3 focus:outline-none"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          style={{
            // Show placeholder when empty
            position: 'relative'
          }}
          suppressContentEditableWarning={true}
        />
      </div>
      
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