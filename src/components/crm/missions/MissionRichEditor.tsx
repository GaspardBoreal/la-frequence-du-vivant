import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Bold, Italic, UnderlineIcon, List, Highlighter, Palette, Strikethrough } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: any | null;
  onChange?: (json: any) => void;
  editable?: boolean;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

const COLORS = ['#0F172A', '#0D6B58', '#2563EB', '#7C3AED', '#DB2777', '#F59E0B', '#DC2626'];

export const MissionRichEditor: React.FC<Props> = ({
  value, onChange, editable = true, placeholder, minHeight = 90, className,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value ?? '',
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2 text-[hsl(var(--crm-text))]',
        style: `min-height:${minHeight}px`,
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== undefined) {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(value ?? '');
      if (current !== incoming) editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionIdSafe(value)]);

  if (!editor) return null;

  return (
    <div className={cn('rounded-lg border border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))]', className)}>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-[hsl(var(--crm-border))]">
          <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>
          <span className="mx-1 h-4 w-px bg-[hsl(var(--crm-border))]" />
          <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></ToolBtn>
          <span className="mx-1 h-4 w-px bg-[hsl(var(--crm-border))]" />
          <div className="flex items-center gap-0.5">
            <Palette className="h-3.5 w-3.5 text-[hsl(var(--crm-text-muted))]" />
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => editor.chain().focus().setColor(c).run()}
                className="h-4 w-4 rounded-full border border-black/10 hover:scale-110 transition-transform"
                style={{ background: c }}
                title={c}
              />
            ))}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="h-4 w-4 rounded-full border border-dashed border-[hsl(var(--crm-border))]"
              title="Reset"
            />
          </div>
          <span className="mx-1 h-4 w-px bg-[hsl(var(--crm-border))]" />
          <ToolBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF3C7' }).run()}>
            <Highlighter className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      )}
      <EditorContent editor={editor} />
      {!editor.getText() && placeholder && editable && (
        <div className="pointer-events-none -mt-[1.6em] px-3 text-sm text-[hsl(var(--crm-text-muted))]/60">
          {placeholder}
        </div>
      )}
    </div>
  );
};

const ToolBtn: React.FC<React.PropsWithChildren<{ active?: boolean; onClick: () => void }>> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
      active
        ? 'bg-[hsl(var(--crm-accent-soft))] text-[hsl(var(--crm-accent))]'
        : 'text-[hsl(var(--crm-text-muted))] hover:bg-[hsl(var(--crm-surface-2))] hover:text-[hsl(var(--crm-text))]',
    )}
  >
    {children}
  </button>
);

// crude key derived from value for resetting external content updates
function missionIdSafe(v: any) {
  try { return JSON.stringify(v ?? ''); } catch { return ''; }
}
