import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Heading1,
  Image as ImageIcon,
  Minus,
  MousePointerClick,
  Plus,
  Quote,
  SquareStack,
  Text as TextIcon,
  Trash2,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  BLOCK_LABELS,
  newBlock,
  type BlockType,
  type NewsletterBlock,
} from '@/lib/newsletter/blocks';

const ICONS: Record<BlockType, React.ComponentType<{ className?: string }>> = {
  heading: Heading1,
  text: TextIcon,
  image: ImageIcon,
  button: MousePointerClick,
  divider: Minus,
  quote: Quote,
  card: SquareStack,
  footer: Type,
};

const ORDER: BlockType[] = ['heading', 'text', 'image', 'button', 'quote', 'card', 'divider', 'footer'];

interface Props {
  blocks: NewsletterBlock[];
  onChange: (blocks: NewsletterBlock[]) => void;
}

/** Composition par blocs : ajout, déplacement, duplication, suppression, réglages. */
export const BlockEditor: React.FC<Props> = ({ blocks, onChange }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);

  const patch = (id: string, values: Partial<NewsletterBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...values } as NewsletterBlock) : b)));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = (type: BlockType) => {
    const b = newBlock(type);
    onChange([...blocks, b]);
    setOpenId(b.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((t) => {
          const Icon = ICONS[t];
          return (
            <Button
              key={t}
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full"
              onClick={() => add(t)}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {BLOCK_LABELS[t]}
            </Button>
          );
        })}
      </div>

      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Plus className="mx-auto mb-2 h-6 w-6 opacity-40" />
          Ajoutez un premier bloc pour composer votre lettre.
        </div>
      )}

      <div className="space-y-2">
        {blocks.map((b, i) => {
          const Icon = ICONS[b.type];
          const open = openId === b.id;
          return (
            <div key={b.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center gap-2 p-2.5">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : b.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium">{BLOCK_LABELS[b.type]}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {'text' in b ? b.text : 'title' in b ? b.title : 'label' in b ? b.label : 'url' in b ? b.url : ''}
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => move(i, -1)} aria-label="Monter">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => move(i, 1)} aria-label="Descendre">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    aria-label="Dupliquer"
                    onClick={() => {
                      const copy = { ...b, id: `b_${Math.random().toString(36).slice(2, 10)}` } as NewsletterBlock;
                      const next = [...blocks];
                      next.splice(i + 1, 0, copy);
                      onChange(next);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive"
                    aria-label="Supprimer"
                    onClick={() => onChange(blocks.filter((x) => x.id !== b.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {open && (
                <div className="space-y-3 border-t bg-muted/30 p-3">
                  {b.type === 'heading' && (
                    <>
                      <Field label="Titre">
                        <Input value={b.text} onChange={(e) => patch(b.id, { text: e.target.value } as any)} />
                      </Field>
                      <div className="flex gap-2">
                        {[1, 2].map((lvl) => (
                          <Button
                            key={lvl}
                            type="button"
                            size="sm"
                            variant={(b.level ?? 1) === lvl ? 'default' : 'outline'}
                            onClick={() => patch(b.id, { level: lvl as 1 | 2 } as any)}
                          >
                            {lvl === 1 ? 'Grand titre' : 'Sous-titre'}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}

                  {b.type === 'text' && (
                    <Field label="Texte">
                      <Textarea rows={5} value={b.text} onChange={(e) => patch(b.id, { text: e.target.value } as any)} />
                    </Field>
                  )}

                  {b.type === 'image' && (
                    <>
                      <Field label="Adresse de l'image (https://…)">
                        <Input value={b.url} onChange={(e) => patch(b.id, { url: e.target.value } as any)} />
                      </Field>
                      <Field label="Description de l'image">
                        <Input value={b.alt ?? ''} onChange={(e) => patch(b.id, { alt: e.target.value } as any)} />
                      </Field>
                      <Field label="Lien au clic (facultatif)">
                        <Input value={b.href ?? ''} onChange={(e) => patch(b.id, { href: e.target.value } as any)} />
                      </Field>
                    </>
                  )}

                  {b.type === 'button' && (
                    <>
                      <Field label="Texte du bouton">
                        <Input value={b.label} onChange={(e) => patch(b.id, { label: e.target.value } as any)} />
                      </Field>
                      <Field label="Lien">
                        <Input value={b.href} onChange={(e) => patch(b.id, { href: e.target.value } as any)} />
                      </Field>
                    </>
                  )}

                  {b.type === 'quote' && (
                    <>
                      <Field label="Citation">
                        <Textarea rows={3} value={b.text} onChange={(e) => patch(b.id, { text: e.target.value } as any)} />
                      </Field>
                      <Field label="Auteur">
                        <Input value={b.author ?? ''} onChange={(e) => patch(b.id, { author: e.target.value } as any)} />
                      </Field>
                    </>
                  )}

                  {b.type === 'card' && (
                    <>
                      <Field label="Titre de la carte">
                        <Input value={b.title} onChange={(e) => patch(b.id, { title: e.target.value } as any)} />
                      </Field>
                      <Field label="Texte">
                        <Textarea rows={3} value={b.text ?? ''} onChange={(e) => patch(b.id, { text: e.target.value } as any)} />
                      </Field>
                      <Field label="Image (https://…)">
                        <Input value={b.imageUrl ?? ''} onChange={(e) => patch(b.id, { imageUrl: e.target.value } as any)} />
                      </Field>
                      <Field label="Lien">
                        <Input value={b.href ?? ''} onChange={(e) => patch(b.id, { href: e.target.value } as any)} />
                      </Field>
                      <Field label="Texte du lien">
                        <Input value={b.cta ?? ''} onChange={(e) => patch(b.id, { cta: e.target.value } as any)} />
                      </Field>
                    </>
                  )}

                  {b.type === 'footer' && (
                    <Field label="Mention de bas de page">
                      <Textarea rows={3} value={b.text} onChange={(e) => patch(b.id, { text: e.target.value } as any)} />
                    </Field>
                  )}

                  {b.type === 'divider' && (
                    <p className="text-xs text-muted-foreground">Un simple trait de séparation, rien à régler.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default BlockEditor;
