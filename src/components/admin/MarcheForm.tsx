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

// Interface pour le formulaire alignée avec les champs de la base de données
interface FormData {
  ville: string;
  region: string;
  departement: string;
  nomMarche: string;
  descriptifCourt: string;
  descriptifLong: string;
  date: string;
  temperature: number | null;
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  lienGoogleDrive: string;
  sousThemes: string;
  tags: string;
}
const MarcheForm: React.FC<MarcheFormProps> = ({
  mode,
  marcheId,
  onCancel,
  onSuccess
}) => {
  const {
    data: marche,
    isLoading
  } = useSupabaseMarche(marcheId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [themePrincipalRichText, setThemePrincipalRichText] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<FormData>();
  const selectedRegion = watch('region');
  const selectedDepartement = watch('departement');
  useEffect(() => {
    if (mode === 'edit' && marche) {
      console.log('📋 Données de la marche à éditer:', marche);
      const formData: FormData = {
        ville: marche.ville || '',
        region: marche.region || '',
        departement: marche.departement || '',
        nomMarche: marche.nomMarche || '',
        descriptifCourt: marche.descriptifCourt || '',
        descriptifLong: marche.descriptifLong || '',
        date: marche.date || '',
        temperature: marche.temperature ?? null,
        latitude: marche.latitude ?? null,
        longitude: marche.longitude ?? null,
        adresse: marche.adresse || '',
        lienGoogleDrive: marche.lien || '',
        sousThemes: marche.sousThemes?.join(', ') || '',
        tags: marche.supabaseTags?.join(', ') || ''
      };
      console.log('🔄 Données du formulaire après mapping:', formData);
      console.log('🔍 Coordonnées reçues:', {
        originalLatitude: marche.latitude,
        originalLongitude: marche.longitude,
        formLatitude: formData.latitude,
        formLongitude: formData.longitude
      });
      reset(formData);
      setThemePrincipalRichText(marche.theme || '');
    }
  }, [mode, marche, reset]);
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      console.log('📝 Données du formulaire à sauvegarder:', data);

      // Convertir les données pour l'API en respectant les champs de la base de données
      const apiData: MarcheFormData = {
        ville: data.ville,
        region: data.region,
        departement: data.departement,
        nomMarche: data.nomMarche,
        descriptifCourt: data.descriptifCourt,
        descriptifLong: data.descriptifLong,
        date: data.date,
        temperature: data.temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        adresse: data.adresse,
        lienGoogleDrive: data.lienGoogleDrive,
        sousThemes: data.sousThemes ? data.sousThemes.split(',').map(t => t.trim()) : [],
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        themesPrincipaux: [themePrincipalRichText].filter(Boolean) // Sauvegarde dans theme_principal
      };
      console.log('🔄 Données converties pour API:', apiData);
      if (mode === 'create') {
        const newMarcheId = await createMarche(apiData);
        console.log('✅ Nouvelle marche créée avec l\'ID:', newMarcheId);
        toast.success('Marche créée avec succès !');
      } else if (mode === 'edit' && marcheId) {
        await updateMarche(marcheId, apiData);
        console.log('✅ Marche mise à jour avec succès');
        toast.success('Marche mise à jour avec succès !');

        // Forcer une invalidation complète du cache pour s'assurer que la liste se met à jour
        await queryClient.invalidateQueries({
          queryKey: ['marches-supabase']
        });
        await queryClient.refetchQueries({
          queryKey: ['marches-supabase']
        });
      }
      onSuccess();
    } catch (error) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (mode === 'edit' && isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>;
  }
  return <div className="space-y-6">
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
                <Input id="ville" {...register('ville', {
                required: 'La ville est requise'
              })} className={errors.ville ? 'border-red-500' : ''} />
                {errors.ville && <p className="text-red-500 text-sm mt-1">{errors.ville.message}</p>}
              </div>

              <div>
                <Label htmlFor="region">Région</Label>
                <Select value={selectedRegion || ''} onValueChange={value => setValue('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENCH_REGIONS.map(region => <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="departement">Département</Label>
                <Select value={selectedDepartement || ''} onValueChange={value => setValue('departement', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un département" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENCH_DEPARTMENTS.map(department => <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nomMarche">Nom de la marche</Label>
                <Input id="nomMarche" {...register('nomMarche')} />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register('date')} />
              </div>

              <div>
                <Label htmlFor="temperature">Température (°C)</Label>
                <Input id="temperature" type="number" step="0.1" {...register('temperature', {
                setValueAs: value => value === '' ? null : Number(value)
              })} />
              </div>

              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" {...register('latitude', {
                setValueAs: value => value === '' ? null : Number(value)
              })} />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" {...register('longitude', {
                setValueAs: value => value === '' ? null : Number(value)
              })} />
              </div>
            </div>

            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" {...register('adresse')} />
            </div>

            <div>
              <Label htmlFor="lienGoogleDrive">Lien Google Drive</Label>
              <Input id="lienGoogleDrive" type="url" {...register('lienGoogleDrive')} />
            </div>

            <div>
              <Label htmlFor="sousThemes">Sous-thèmes (séparés par des virgules)</Label>
              <Input id="sousThemes" {...register('sousThemes')} placeholder="thème1, thème2, thème3" />
            </div>

            <div>
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input id="tags" {...register('tags')} placeholder="tag1, tag2, tag3" />
            </div>
          </TabsContent>

          <TabsContent value="description" className="space-y-4">
            <div>
              <Label htmlFor="descriptifCourt">Descriptif court</Label>
              <Textarea id="descriptifCourt" rows={3} {...register('descriptifCourt')} placeholder="Résumé en quelques phrases..." />
            </div>

            <div>
              <Label htmlFor="descriptifLong">Descriptif long</Label>
              <Textarea id="descriptifLong" rows={6} {...register('descriptifLong')} placeholder="Description détaillée de la marche..." />
            </div>

            
          </TabsContent>

          <TabsContent value="photos">
            <MediaUploadSection marcheId={marcheId} mediaType="photos" />
          </TabsContent>

          <TabsContent value="audio">
            <AudioUploadSection marcheId={marcheId} />
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
    </div>;
};
export default MarcheForm;