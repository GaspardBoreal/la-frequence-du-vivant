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
  const [selection, setSelection] = useState<Range | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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
    
    // Check if we're inside an existing tag of this type
    let currentElement = range.commonAncestorContainer;
    if (currentElement.nodeType === Node.TEXT_NODE) {
      currentElement = currentElement.parentNode;
    }
    
    // Look for existing tag
    let existingTag: Element | null = null;
    let temp = currentElement;
    while (temp && temp !== editorRef.current) {
      if (temp.nodeType === Node.ELEMENT_NODE && (temp as Element).tagName?.toLowerCase() === tagName.toLowerCase()) {
        existingTag = temp as Element;
        break;
      }
      temp = temp.parentNode;
    }
    
    if (existingTag) {
      // Remove existing formatting
      const parent = existingTag.parentNode;
      const textContent = existingTag.textContent;
      const textNode = document.createTextNode(textContent || '');
      parent?.replaceChild(textNode, existingTag);
      
      // Set selection after the text
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Apply new formatting
      const selectedText = range.toString();
      if (selectedText) {
        const element = document.createElement(tagName);
        element.textContent = selectedText;
        range.deleteContents();
        range.insertNode(element);
        
        // Set selection after the new element
        const newRange = document.createRange();
        newRange.setStartAfter(element);
        newRange.setEndAfter(element);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // No text selected, insert an empty tag and place cursor inside
        const element = document.createElement(tagName);
        range.insertNode(element);
        
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
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
      setIsTyping(true);
      const sanitizedContent = sanitizeHtml(editorRef.current.innerHTML);
      onChange(sanitizedContent);
      setTimeout(() => setIsTyping(false), 50);
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
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
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