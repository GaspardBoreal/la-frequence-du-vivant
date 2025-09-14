import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Badge } from '../../ui/badge';
import { Edit3, Trash2, FileText, Book, Quote, Feather } from 'lucide-react';
import { SecureRichTextEditor } from '../../ui/secure-rich-text-editor';
import { useMarcheTextes, useCreateMarcheTexte, useUpdateMarcheTexte, useDeleteMarcheTexte, useReorderMarcheTextes, MarcheTexte } from '../../../hooks/useMarcheTextes';
import { TextType } from '../../../types/textTypes';
import { toast } from 'sonner';

interface MarcheTextesAdminMobileProps {
  marcheId: string;
}

const TEXT_TYPE_ICONS: Record<TextType, React.ReactNode> = {
  haiku: <Feather className="w-4 h-4" />,
  poeme: <Book className="w-4 h-4" />,
  'texte-libre': <FileText className="w-4 h-4" />,
  'dialogue-polyphonique': <Quote className="w-4 h-4" />,
  fragment: <Quote className="w-4 h-4" />,
  prose: <FileText className="w-4 h-4" />,
  senryu: <Feather className="w-4 h-4" />,
  haibun: <Book className="w-4 h-4" />,
  'essai-bref': <FileText className="w-4 h-4" />,
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
  'dialogue-polyphonique': 'Dialogue polyphonique',
  fragment: 'Fragment',
  prose: 'Prose',
  senryu: 'Senryū',
  haibun: 'Haïbun',
  'essai-bref': 'Essai bref',
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

const MarcheTextesAdminMobile: React.FC<MarcheTextesAdminMobileProps> = ({ marcheId }) => {
  const { data: textes = [], isLoading } = useMarcheTextes(marcheId);
  const createTexte = useCreateMarcheTexte();
  const updateTexte = useUpdateMarcheTexte();
  const deleteTexte = useDeleteMarcheTexte();
  const reorderTextes = useReorderMarcheTextes();

  const [selectedTexte, setSelectedTexte] = useState<MarcheTexte | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<TextType>('prose');
  const [editOrder, setEditOrder] = useState(1);

  const handleCreateTexte = () => {
    setSelectedTexte(null);
    setEditTitle('');
    setEditContent('');
    setEditType('prose');
    setEditOrder(textes.length + 1);
    setIsCreateModalOpen(true);
  };

  const handleEditTexte = (texte: MarcheTexte) => {
    setSelectedTexte(texte);
    setEditTitle(texte.titre);
    setEditContent(texte.contenu);
    setEditType(texte.type_texte);
    setEditOrder(texte.ordre);
    setIsCreateModalOpen(true);
  };

  const handleSaveTexte = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Le titre et le contenu sont obligatoires');
      return;
    }

    try {
      if (selectedTexte) {
        // Update existing text
        await updateTexte.mutateAsync({
          id: selectedTexte.id,
          titre: editTitle,
          contenu: editContent,
          type_texte: editType,
          ordre: editOrder
        });
      } else {
        // Create new text
        await createTexte.mutateAsync({
          marche_id: marcheId,
          titre: editTitle,
          contenu: editContent,
          type_texte: editType,
          ordre: editOrder
        });
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDeleteTexte = async (texteId: string, titre: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le texte "${titre}" ?`)) {
      try {
        await deleteTexte.mutateAsync(texteId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getTypeColor = (type: TextType) => {
    const colors: Record<TextType, string> = {
      haiku: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      poeme: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100', 
      'texte-libre': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'dialogue-polyphonique': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      fragment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      prose: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      senryu: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      haibun: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
      'essai-bref': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      fable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'carte-poetique': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      carnet: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      correspondance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      manifeste: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      glossaire: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      protocole: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      synthese: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
      'recit-donnees': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100'
    };
    return colors[type] || colors.prose;
  };

  const truncateContent = (content: string, maxLength = 60) => {
    const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  if (textes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📝 Textes littéraires (0)</h3>
        </div>
        
        <div className="bg-muted rounded-lg p-6 text-center">
          <div className="text-muted-foreground mb-2">📝</div>
          <p className="text-sm text-muted-foreground mb-4">
            Aucun texte pour cette marche
          </p>
          <Button onClick={handleCreateTexte} className="animate-fade-in">
            <FileText className="w-4 h-4 mr-2" />
            ➕ Ajouter un texte
          </Button>
        </div>

        {/* Create/Edit Modal */}
        <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {selectedTexte ? '✏️ Modifier le texte' : '➕ Nouveau texte'}
              </SheetTitle>
              <SheetDescription>
                {selectedTexte ? 'Modifiez les informations du texte' : 'Créez un nouveau texte littéraire'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Titre du texte..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type de texte *</label>
                <Select value={editType} onValueChange={(value) => setEditType(value as TextType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEXT_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {TEXT_TYPE_ICONS[type as TextType]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Ordre</label>
                <Input
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contenu *</label>
                <div className="mt-2">
                  <SecureRichTextEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Écrivez votre texte ici..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveTexte} 
                  className="flex-1"
                  disabled={createTexte.isPending || updateTexte.isPending}
                >
                  💾 Enregistrer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          📝 Textes littéraires ({textes.length})
        </h3>
        <Button size="sm" onClick={handleCreateTexte}>
          <FileText className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="space-y-2">
        {textes.map((texte) => (
          <div key={texte.id} className="rounded-lg bg-card border border-border p-4">
            <div className="flex items-start gap-3">
              {/* Type icon */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {TEXT_TYPE_ICONS[texte.type_texte]}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm truncate pr-2">{texte.titre}</h4>
                  <Badge className={`text-xs ${getTypeColor(texte.type_texte)}`}>
                    {TEXT_TYPE_LABELS[texte.type_texte]}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {truncateContent(texte.contenu)}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    Ordre: {texte.ordre}
                  </span>
                  
                  {/* Actions - always visible on mobile */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditTexte(texte)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTexte(texte.id, texte.titre)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedTexte ? '✏️ Modifier le texte' : '➕ Nouveau texte'}
            </SheetTitle>
            <SheetDescription>
              {selectedTexte ? 'Modifiez les informations du texte' : 'Créez un nouveau texte littéraire'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Titre *</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre du texte..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type de texte *</label>
              <Select value={editType} onValueChange={(value) => setEditType(value as TextType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEXT_TYPE_LABELS).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {TEXT_TYPE_ICONS[type as TextType]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Ordre</label>
              <Input
                type="number"
                value={editOrder}
                onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Contenu *</label>
              <div className="mt-2">
                <SecureRichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Écrivez votre texte ici..."
                  className="min-h-[200px]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveTexte} 
                className="flex-1"
                disabled={createTexte.isPending || updateTexte.isPending}
              >
                💾 Enregistrer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MarcheTextesAdminMobile;