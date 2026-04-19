import { useState, useCallback, useRef } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_TEXT_LENGTH = 12_000;
const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
];
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.csv', '.md'];

export interface DocumentContext {
  fileName: string;
  text: string;
}

export function useDocumentExtractor() {
  const [document, setDocument] = useState<DocumentContext | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const truncate = (text: string): string => {
    if (text.length <= MAX_TEXT_LENGTH) return text;
    const truncated = text.slice(0, MAX_TEXT_LENGTH);
    const lastDot = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastDot, lastNewline);
    return (
      (cutPoint > MAX_TEXT_LENGTH * 0.8 ? truncated.slice(0, cutPoint + 1) : truncated) +
      '\n\n[… document tronqué à ~12 000 caractères]'
    );
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
    const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

    const pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN);
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
      if (text.trim()) pages.push(text.trim());
    }

    return pages.join('\n\n');
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setDocument(null);

    if (file.size > MAX_FILE_SIZE) {
      setError('Le fichier dépasse la limite de 10 Mo.');
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
    if (!isValidType) {
      setError('Format non supporté. Utilisez PDF, TXT, CSV ou MD.');
      return;
    }

    setIsExtracting(true);

    try {
      let text: string;
      if (file.type === 'application/pdf' || ext === '.pdf') {
        text = await extractTextFromPdf(file);
      } else {
        text = await extractTextFromFile(file);
      }

      if (!text.trim()) {
        setError("Aucun texte n'a pu être extrait de ce document.");
        return;
      }

      setDocument({ fileName: file.name, text: truncate(text.trim()) });
    } catch (e: any) {
      console.error('Document extraction error:', e);
      setError(e.message || "Erreur lors de l'extraction du texte.");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const removeDocument = useCallback(() => {
    setDocument(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    document,
    isExtracting,
    error,
    fileInputRef,
    processFile,
    removeDocument,
    openFilePicker,
    acceptedFormats: ACCEPTED_EXTENSIONS.join(','),
  };
}
