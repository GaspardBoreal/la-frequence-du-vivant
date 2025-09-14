import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Badge } from '../../ui/badge';
import { FileText, Plus, Book, Quote, Feather } from 'lucide-react';
import { SecureRichTextEditor } from '../../ui/secure-rich-text-editor';
import { useCreateMarcheTexte, useMarcheTextes } from '../../../hooks/useMarcheTextes';
import { TextType } from '../../../types/textTypes';
import { toast } from 'sonner';

interface TexteCaptureFloatProps {
  marcheId: string;
}

const TEXT_TYPE_ICONS: Record<TextType, React.ReactNode> = {
  haiku: <Feather className="w-4 h-4" />,
  poeme: <Book className="w-4 h-4" />,
  'texte-libre': <FileText className="w-4 h-4" />,
  fragment: <Quote className="w-4 h-4" />,
  prose: <FileText className="w-4 h-4" />,
  senryu: <Feather className="w-4 h-4" />,
  haibun: <Book className="w-4 h-4" />,
  'essai-bref': <FileText className="w-4 h-4" />,
  'dialogue-polyphonique': <Quote className="w-4 h-4" />,
  fable: <Book className="w-4 h-4" />,
  'carte-poetique': <FileText className="w-4 h-4" />,
  carnet: <FileText className="w-4 h-4" />,
  correspondance: <Quote className="w-4 h-4" />,
  manifeste: <Book className="w-4 h-4" />,
  glossaire: <FileText className="w-4 h-4" />,
  protocole: <FileText className="w-4 h-4" />,
  synthese: <FileText className="w-4 h-4" />,
  'recit-donnees': <FileText className="w-4 h-4" />
};

const TEXT_TYPE_LABELS: Record<TextType, string> = {
  haiku: 'Haïku',
  poeme: 'Poème', 
  'texte-libre': 'Texte libre',
  fragment: 'Fragment',
  prose: 'Prose',
  senryu: 'Senryū',
  haibun: 'Haïbun',
  'essai-bref': 'Essai bref',
  'dialogue-polyphonique': 'Dialogue polyphonique',
  fable: 'Fable',
  'carte-poetique': 'Carte poétique',
  carnet: 'Carnet de terrain',
  correspondance: 'Correspondance',
  manifeste: 'Manifeste',
  glossaire: 'Glossaire poétique',
  protocole: 'Protocole hybride',
  synthese: 'Synthèse IA-Humain',
  'recit-donnees': 'Récit-données'
};

const TexteCaptureFloat: React.FC<TexteCaptureFloatProps> = ({ marcheId }) => {
  const createTexte = useCreateMarcheTexte();
  const { data: existingTextes = [] } = useMarcheTextes(marcheId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState<TextType>('prose');

  const textesCount = existingTextes.length;

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Le titre et le contenu sont obligatoires');
      return;
    }

    try {
      await createTexte.mutateAsync({
        marche_id: marcheId,
        titre: title,
        contenu: content,
        type_texte: textType,
        ordre: textesCount + 1
      });

      // Reset form
      setTitle('');
      setContent('');
      setTextType('prose');
      setIsSheetOpen(false);
      
      toast.success('📝 Texte ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du texte:', error);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce z-50"
          size="icon"
        >
          <div className="relative">
            <FileText className="h-6 w-6" />
            {textesCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {textesCount}
              </Badge>
            )}
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>📝 Nouveau texte littéraire</SheetTitle>
          <SheetDescription>
            Créez un nouveau texte pour enrichir cette marche
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Quick type selector */}
          <div>
            <label className="text-sm font-medium mb-3 block">Type de texte</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TEXT_TYPE_LABELS).map(([type, label]) => (
                <Button
                  key={type}
                  variant={textType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextType(type as TextType)}
                  className="justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-2">
                    {TEXT_TYPE_ICONS[type as TextType]}
                    <span className="text-xs">{label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Titre *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donnez un titre à votre texte..."
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contenu *</label>
            <div className="mt-2">
              <SecureRichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Écrivez votre texte ici..."
                className="min-h-[250px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-background">
            <Button 
              onClick={handleSave} 
              className="flex-1 h-12"
              disabled={createTexte.isPending}
            >
              {createTexte.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter le texte
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsSheetOpen(false)}
              className="flex-1 h-12"
            >
              Annuler
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TexteCaptureFloat;