import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface PublishExportOptions {
  blob: Blob;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  coverUrl?: string;
  explorationId?: string;
  artisticDirection?: string;
  fileType: 'epub' | 'pdf';
}

export interface PublishedExport {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string;
  cover_url: string | null;
  file_url: string;
  file_size_bytes: number | null;
  file_type: string;
  artistic_direction: string | null;
  download_count: number;
  published_at: string;
  publicUrl: string;
}

// ============================================================================
// SLUG GENERATION
// ============================================================================

const generateSlug = (title: string): string => {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50)
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Add random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `${baseSlug}-${timestamp}-${randomSuffix}`;
};

// ============================================================================
// PUBLISH EXPORT
// ============================================================================

export const publishExport = async (options: PublishExportOptions): Promise<PublishedExport> => {
  const {
    blob,
    title,
    subtitle,
    description,
    author = 'Gaspard Boréal',
    coverUrl,
    explorationId,
    artisticDirection,
    fileType,
  } = options;

  // 1. Generate unique slug
  const slug = generateSlug(title);
  const fileName = `${slug}.${fileType}`;

  console.log('[PublishExport] Starting publication:', { slug, fileType, size: blob.size });

  // 2. Upload to Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('public-exports')
    .upload(fileName, blob, {
      contentType: fileType === 'epub' ? 'application/epub+zip' : 'application/pdf',
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (uploadError) {
    console.error('[PublishExport] Upload error:', uploadError);
    throw new Error(`Erreur upload: ${uploadError.message}`);
  }

  console.log('[PublishExport] Upload successful:', uploadData.path);

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from('public-exports')
    .getPublicUrl(fileName);

  const fileUrl = urlData.publicUrl;

  // 4. Insert into database
  const { data: insertData, error: insertError } = await supabase
    .from('published_exports')
    .insert({
      slug,
      title,
      subtitle: subtitle || null,
      description: description || null,
      author,
      cover_url: coverUrl || null,
      file_url: fileUrl,
      file_size_bytes: blob.size,
      file_type: fileType,
      artistic_direction: artisticDirection || null,
      exploration_id: explorationId || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[PublishExport] Insert error:', insertError);
    // Clean up uploaded file on failure
    await supabase.storage.from('public-exports').remove([fileName]);
    throw new Error(`Erreur base de données: ${insertError.message}`);
  }

  console.log('[PublishExport] Publication complete:', insertData.id);

  // 5. Build public URL
  const publicUrl = `${window.location.origin}/epub/${slug}`;

  return {
    ...insertData,
    publicUrl,
  };
};

// ============================================================================
// FETCH PUBLISHED EXPORTS
// ============================================================================

export const fetchPublishedExports = async (): Promise<PublishedExport[]> => {
  const { data, error } = await supabase
    .from('published_exports')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[fetchPublishedExports] Error:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    publicUrl: `${window.location.origin}/epub/${item.slug}`,
  }));
};

// ============================================================================
// DELETE PUBLISHED EXPORT
// ============================================================================

export const deletePublishedExport = async (slug: string): Promise<void> => {
  // 1. Get the export to find file info
  const { data: exportData, error: fetchError } = await supabase
    .from('published_exports')
    .select('file_type')
    .eq('slug', slug)
    .single();

  if (fetchError) {
    throw new Error(`Export non trouvé: ${fetchError.message}`);
  }

  const fileName = `${slug}.${exportData.file_type}`;

  // 2. Delete from storage
  const { error: storageError } = await supabase.storage
    .from('public-exports')
    .remove([fileName]);

  if (storageError) {
    console.error('[deletePublishedExport] Storage error:', storageError);
    // Continue anyway to clean up DB
  }

  // 3. Delete from database
  const { error: dbError } = await supabase
    .from('published_exports')
    .delete()
    .eq('slug', slug);

  if (dbError) {
    throw new Error(`Erreur suppression: ${dbError.message}`);
  }

  console.log('[deletePublishedExport] Deleted:', slug);
};

// ============================================================================
// INCREMENT DOWNLOAD COUNT
// ============================================================================

export const incrementDownloadCount = async (slug: string): Promise<void> => {
  const { error } = await supabase.rpc('increment_download_count', { export_slug: slug });
  
  if (error) {
    console.error('[incrementDownloadCount] Error:', error);
    // Don't throw, this is non-critical
  }
};
