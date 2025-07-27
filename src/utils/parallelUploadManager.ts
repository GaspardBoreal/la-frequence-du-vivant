
import { PhotoToUpload, UploadProgress } from './supabasePhotoOperations';
import { savePhoto } from './supabasePhotoOperations';

export interface ParallelUploadOptions {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface UploadTask {
  id: string;
  photo: PhotoToUpload;
  marcheId: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  retryCount: number;
}

export class ParallelUploadManager {
  private tasks: Map<string, UploadTask> = new Map();
  private activeUploads: Set<string> = new Set();
  private options: Required<ParallelUploadOptions>;
  private progressCallback?: (tasks: UploadTask[]) => void;

  constructor(options: ParallelUploadOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000
    };
  }

  // Ajouter des photos à la queue d'upload
  addPhotos(marcheId: string, photos: PhotoToUpload[]): void {
    console.log(`📋 [ParallelUploadManager] Ajout de ${photos.length} photos à la queue`);
    
    photos.forEach(photo => {
      const task: UploadTask = {
        id: photo.id,
        photo,
        marcheId,
        status: 'pending',
        progress: 0,
        retryCount: 0
      };
      
      this.tasks.set(photo.id, task);
    });

    this.notifyProgress();
  }

  // Définir le callback de progression
  onProgress(callback: (tasks: UploadTask[]) => void): void {
    this.progressCallback = callback;
  }

  // Démarrer l'upload parallèle
  async startUpload(): Promise<string[]> {
    console.log(`🚀 [ParallelUploadManager] Démarrage upload parallèle (max: ${this.options.maxConcurrent})`);
    
    const pendingTasks = Array.from(this.tasks.values()).filter(t => t.status === 'pending');
    
    if (pendingTasks.length === 0) {
      console.log('✅ [ParallelUploadManager] Aucune tâche en attente');
      return [];
    }

    // Lancer les uploads par batch
    const promises: Promise<string | null>[] = [];
    
    while (pendingTasks.length > 0 || this.activeUploads.size > 0) {
      // Remplir les slots disponibles
      while (this.activeUploads.size < this.options.maxConcurrent && pendingTasks.length > 0) {
        const task = pendingTasks.shift()!;
        promises.push(this.processTask(task));
      }

      // Attendre qu'au moins un upload se termine
      if (promises.length > 0) {
        await Promise.race(promises.filter(p => p));
      }
    }

    // Attendre que tous les uploads se terminent
    const results = await Promise.all(promises);
    
    // Filtrer les résultats réussis
    const successfulIds = results.filter(id => id !== null) as string[];
    
    const failedCount = results.length - successfulIds.length;
    console.log(`✅ [ParallelUploadManager] Upload terminé: ${successfulIds.length} réussis, ${failedCount} échecs`);
    
    return successfulIds;
  }

  // Traiter une tâche d'upload
  private async processTask(task: UploadTask): Promise<string | null> {
    this.activeUploads.add(task.id);
    task.status = 'uploading';
    this.notifyProgress();

    try {
      console.log(`📤 [ParallelUploadManager] Upload de ${task.photo.file.name}`);
      
      const photoId = await savePhoto(task.marcheId, task.photo, (progress) => {
        task.progress = progress.progress;
        task.status = progress.status === 'success' ? 'success' : 'uploading';
        if (progress.error) {
          task.error = progress.error;
          task.status = 'error';
        }
        this.notifyProgress();
      });

      task.status = 'success';
      task.progress = 100;
      this.notifyProgress();
      
      console.log(`✅ [ParallelUploadManager] Upload réussi: ${task.photo.file.name} -> ${photoId}`);
      return photoId;
      
    } catch (error) {
      console.error(`❌ [ParallelUploadManager] Erreur upload ${task.photo.file.name}:`, error);
      
      task.error = error instanceof Error ? error.message : 'Erreur inconnue';
      task.retryCount++;
      
      // Tentative de retry
      if (task.retryCount < this.options.retryAttempts) {
        console.log(`🔄 [ParallelUploadManager] Retry ${task.retryCount}/${this.options.retryAttempts} pour ${task.photo.file.name}`);
        
        // Attendre avant le retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * task.retryCount));
        
        task.status = 'pending';
        task.progress = 0;
        this.notifyProgress();
        
        // Relancer la tâche
        return this.processTask(task);
      } else {
        task.status = 'error';
        this.notifyProgress();
        return null;
      }
    } finally {
      this.activeUploads.delete(task.id);
    }
  }

  // Notifier la progression
  private notifyProgress(): void {
    if (this.progressCallback) {
      const tasks = Array.from(this.tasks.values());
      this.progressCallback(tasks);
    }
  }

  // Obtenir le statut global
  getStatus(): { total: number; pending: number; uploading: number; success: number; error: number } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      uploading: tasks.filter(t => t.status === 'uploading').length,
      success: tasks.filter(t => t.status === 'success').length,
      error: tasks.filter(t => t.status === 'error').length
    };
  }

  // Nettoyer les tâches
  clear(): void {
    this.tasks.clear();
    this.activeUploads.clear();
  }
}
