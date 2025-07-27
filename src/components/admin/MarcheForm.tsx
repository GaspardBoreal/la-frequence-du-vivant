
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RichTextEditor } from '../ui/rich-text-editor';
import { Save, ArrowLeft } from 'lucide-react';
import { useSupabaseMarche } from '../../hooks/useSupabaseMarches';
import { createMarche, updateMarche, MarcheFormData } from '../../utils/supabaseMarcheOperations';
import MediaUploadSection from './MediaUploadSection';
import AudioUploadSection from './AudioUploadSection';
import { queryClient } from '../../lib/queryClient';
import { FRENCH_REGIONS } from '../../utils/frenchRegions';
import { FRENCH_DEPARTMENTS } from '../../utils/frenchDepartments';
import { toast } from 'sonner';

interface MarcheFormProps {
  mode: 'create' | 'edit';
  marcheId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

// Interface pour le formulaire avec des types corrects
interface FormData {
  ville: string;
  region: string;
  sousRegion: string;
  nomMarche: string;
  poeme: string;
  date: string;
  temperature: number | null;
  latitude: number | null;
  longitude: number | null;
  lienGoogleDrive: string;
  sousThemes: string;
  tags: string;
  adresse: string;
}

const MarcheForm: React.FC<MarcheFormProps> = ({ mode, marcheId, onCancel, onSuccess }) => {
  const { data: marche, isLoading } = useSupabaseMarche(marcheId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [themeRichText, setThemeRichText] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>();

  const selectedRegion = watch('region');
  const selectedSousRegion = watch('sousRegion');

  useEffect(() => {
    if (mode === 'edit' && marche) {
      const formData: FormData = {
        ville: marche.ville || '',
        region: marche.region || '',
        sousRegion: marche.departement || '',
        nomMarche: marche.nomMarche || '',
        poeme: marche.poeme || '',
        date: marche.date || '',
        temperature: marche.temperature || null,
        latitude: marche.latitude || null,
        longitude: marche.longitude || null,
        lienGoogleDrive: marche.lien || '',
        sousThemes: marche.sousThemes?.join(', ') || '',
        tags: marche.supabaseTags?.join(', ') || '',
        adresse: marche.adresse || ''
      };
      
      reset(formData);
      setThemeRichText(marche.theme || '');
    }
  }, [mode, marche, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      console.log('Données à sauvegarder:', data);

      // Convertir les données pour l'API
      const apiData: MarcheFormData = {
        ville: data.ville,
        region: data.region,
        nomMarche: data.nomMarche,
        poeme: data.poeme,
        date: data.date,
        temperature: data.temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        lienGoogleDrive: data.lienGoogleDrive,
        sousThemes: data.sousThemes ? data.sousThemes.split(',').map(t => t.trim()) : [],
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        adresse: data.adresse,
        sousRegion: data.sousRegion,
        theme: themeRichText,
        descriptifCourt: ''
      };

      console.log('Données converties pour API:', apiData);

      if (mode === 'create') {
        const newMarcheId = await createMarche(apiData);
        console.log('✅ Nouvelle marche créée avec l\'ID:', newMarcheId);
        toast.success('Marche créée avec succès !');
      } else if (mode === 'edit' && marcheId) {
        await updateMarche(marcheId, apiData);
        console.log('✅ Marche mise à jour avec succès');
        toast.success('Marche mise à jour avec succès !');
        
        // Forcer une invalidation complète du cache pour s'assurer que la liste se met à jour
        await queryClient.invalidateQueries({ queryKey: ['marches-supabase'] });
        await queryClient.refetchQueries({ queryKey: ['marches-supabase'] });
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.');
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
                <Select
                  value={selectedRegion || ''}
                  onValueChange={(value) => setValue('region', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENCH_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sousRegion">Sous-région (Département)</Label>
                <Select
                  value={selectedSousRegion || ''}
                  onValueChange={(value) => setValue('sousRegion', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un département" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENCH_DEPARTMENTS.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nomMarche">Nom de la marche</Label>
                <Input
                  id="nomMarche"
                  {...register('nomMarche')}
                />
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
                  {...register('temperature', { 
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register('latitude', { 
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude', { 
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })}
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
            <div className="col-span-2">
              <Label htmlFor="theme">Thème</Label>
              <RichTextEditor
                value={themeRichText}
                onChange={setThemeRichText}
                placeholder="Décrivez le thème de la marche avec mise en forme..."
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
