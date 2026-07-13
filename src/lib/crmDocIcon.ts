import { FileText, FileImage, FileSpreadsheet, File as FileIcon, type LucideIcon } from 'lucide-react';

export function iconFor(mime: string | null, name: string): LucideIcon {
  const m = (mime || '').toLowerCase();
  const n = name.toLowerCase();
  if (m.startsWith('image/')) return FileImage;
  if (m.includes('pdf') || n.endsWith('.pdf')) return FileText;
  if (m.includes('sheet') || m.includes('excel') || /\.(xlsx?|csv)$/.test(n)) return FileSpreadsheet;
  if (m.includes('word') || /\.docx?$/.test(n)) return FileText;
  return FileIcon;
}

export function formatSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
