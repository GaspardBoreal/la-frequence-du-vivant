import { useState, useCallback, useRef } from 'react';
import { convertHeicToJpeg } from '@/utils/heicConverter';

export const CHAT_IMAGE_MAX_DIM = 1024;
export const CHAT_IMAGE_QUALITY = 0.8;

export interface ChatImageAttachment {
  type: 'image';
  dataUrl: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  testType?: SoilTestType;
}

export const SOIL_TEST_TYPES = [
  { id: 'ph', label: 'Bandelette pH', icon: '🧪' },
  { id: 'npk', label: 'Test NPK colorimétrique', icon: '🧫' },
  { id: 'sedimentation', label: 'Bocal de sédimentation', icon: '🏺' },
  { id: 'calcaire', label: "Test à l'acide (calcaire)", icon: '💧' },
  { id: 'structure', label: 'Test bêche / structure', icon: '📐' },
  { id: 'labo', label: 'Rapport de labo', icon: '📄' },
  { id: 'autre', label: 'Autre', icon: '🔍' },
] as const;

export type SoilTestType = (typeof SOIL_TEST_TYPES)[number]['id'];

export const getSoilTestLabel = (id?: SoilTestType) =>
  SOIL_TEST_TYPES.find((t) => t.id === id)?.label ?? 'Test de sol';

export const getSoilTestIcon = (id?: SoilTestType) =>
  SOIL_TEST_TYPES.find((t) => t.id === id)?.icon ?? '📷';

export function useChatImage() {
  const [image, setImage] = useState<ChatImageAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dataUrlToBytes = (dataUrl: string): number => {
    const base64 = dataUrl.split(',')[1] ?? '';
    return Math.round((base64.length * 3) / 4);
  };

  const resizeAndEncode = async (file: File): Promise<ChatImageAttachment> => {
    const converted = await convertHeicToJpeg(file, { quality: CHAT_IMAGE_QUALITY });
    const url = URL.createObjectURL(converted);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("Impossible de lire l'image"));
        im.src = url;
      });
      let { width, height } = img;
      if (width > CHAT_IMAGE_MAX_DIM || height > CHAT_IMAGE_MAX_DIM) {
        const ratio = Math.min(CHAT_IMAGE_MAX_DIM / width, CHAT_IMAGE_MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponible');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', CHAT_IMAGE_QUALITY);
      const bytes = dataUrlToBytes(dataUrl);
      return {
        type: 'image',
        dataUrl,
        fileName: converted.name,
        mimeType: 'image/jpeg',
        width,
        height,
        bytes,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setProcessing(true);
    try {
      const isImage = file.type.startsWith('image/');
      const isHeic = /\.(heic|heif)$/i.test(file.name);
      if (!isImage && !isHeic) {
        throw new Error('Format non supporté. Utilisez JPG, PNG, HEIC ou HEIF.');
      }
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Image trop lourde. Limite : 20 Mo.');
      }
      const attachment = await resizeAndEncode(file);
      setImage(attachment);
    } catch (e: any) {
      console.error('Chat image error:', e);
      setError(e.message || 'Erreur de traitement de la photo');
    } finally {
      setProcessing(false);
    }
  }, []);

  const removeImage = useCallback(() => {
    setImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const setTestType = useCallback((testType: SoilTestType) => {
    setImage((prev) => (prev ? { ...prev, testType } : prev));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return {
    image,
    error,
    processing,
    fileInputRef,
    processFile,
    removeImage,
    openFilePicker,
    setTestType,
    handleFileChange,
    acceptedFormats: 'image/jpeg,image/png,image/jpg,image/heic,image/heif,.heic,.heif',
  };
}
