
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Save, ArrowLeft } from 'lucide-react';
import { useSupabaseMarche } from '../../hooks/useSupabaseMarches';
import { createMarche, updateMarche, MarcheFormData } from '../../utils/supabaseMarcheOperations';
import MediaUploadSection from './MediaUploadSection';
import AudioUploadSection from './AudioUploadSection';

interface MarcheFormProps {
  mode: 'create' | 'edit';
  marcheId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const MarcheForm: React.FC<MarcheFormProps> = ({ mode, marcheId, onCancel, onSuccess }) => {
  const { data: marche, isLoading } = useSupabaseMarche(marcheId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MarcheFormData>();

  useEffect(() => {
    if (mode === 'edit' && marche) {
      reset({
        ville: marche.ville || '',
        region: marche.region || '',
        nomMarche: marche.nomMarche || '',
        theme: marche.theme || '',
        descriptifCourt: marche.descriptifCourt || '',
        poeme: marche.poeme || '',
        date: marche.date || '',
        temperature: marche.temperature || null,
        latitude: marche.latitude || 0,
        longitude: marche.longitude || 0,
        lienGoogleDrive: marche.lien || '',
        sousThemes: marche.sousThemes?.join(', ') || '',
        tags: marche.supabaseTags?.join(', ') || '',
        adresse: marche.adresse || ''
      });
    }
  }, [mode, marche, reset]);

  const onSubmit = async (data: MarcheFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Données à sauvegarder:', data);

      if (mode === 'create') {
        const newMarcheId = await createMarche(data);
        console.log('✅ Nouvelle marche créée avec l\'ID:', newMarcheId);
      } else if (mode === 'edit' && marcheId) {
        await updateMarche(marcheId, data);
        console.log('✅ Marche mise à jour avec succès');
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'edit' && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {mode === 'create' ? 'Créer une nouvelle marche' : 'Modifier la marche'}
        </h2>
        <Button variant="outline" onClick={onCancel} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Informations</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ville">Ville *</Label>
                <Input
                  id="ville"
                  {...register('ville', { required: 'La ville est requise' })}
                  className={errors.ville ? 'border-red-500' : ''}
                />
                {errors.ville && (
                  <p className="text-red-500 text-sm mt-1">{errors.ville.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="region">Région</Label>
                <Input
                  id="region"
                  {...register('region')}
                />
              </div>

              <div>
                <Label htmlFor="nomMarche">Nom de la marche</Label>
                <Input
                  id="nomMarche"
                  {...register('nomMarche')}
                />
              </div>

              <div>
                <Label htmlFor="theme">Thème *</Label>
                <Input
                  id="theme"
                  {...register('theme', { required: 'Le thème est requis' })}
                  className={errors.theme ? 'border-red-500' : ''}
                />
                {errors.theme && (
                  <p className="text-red-500 text-sm mt-1">{errors.theme.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                />
              </div>

              <div>
                <Label htmlFor="temperature">Température (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  {...register('temperature', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register('latitude', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                {...register('adresse')}
              />
            </div>

            <div>
              <Label htmlFor="lienGoogleDrive">Lien Google Drive</Label>
              <Input
                id="lienGoogleDrive"
                type="url"
                {...register('lienGoogleDrive')}
              />
            </div>

            <div>
              <Label htmlFor="sousThemes">Sous-thèmes (séparés par des virgules)</Label>
              <Input
                id="sousThemes"
                {...register('sousThemes')}
                placeholder="thème1, thème2, thème3"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </TabsContent>

          <TabsContent value="description" className="space-y-4">
            <div>
              <Label htmlFor="descriptifCourt">Descriptif court</Label>
              <Textarea
                id="descriptifCourt"
                rows={3}
                {...register('descriptifCourt')}
              />
            </div>

            <div>
              <Label htmlFor="poeme">Poème / Texte littéraire</Label>
              <Textarea
                id="poeme"
                rows={8}
                {...register('poeme')}
                placeholder="Texte poétique ou littéraire associé à la marche..."
              />
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <MediaUploadSection 
              marcheId={marcheId} 
              mediaType="photos" 
            />
          </TabsContent>

          <TabsContent value="audio">
            <AudioUploadSection 
              marcheId={marcheId} 
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MarcheForm;
