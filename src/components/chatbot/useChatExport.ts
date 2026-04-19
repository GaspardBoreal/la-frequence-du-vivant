import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { generatePrintHtml } from './ChatPrintView';
import { chatConfig } from './chatConfig';

type Msg = { role: 'user' | 'assistant'; content: string };

function messagesToText(messages: Msg[]): string {
  const { printBranding } = chatConfig;
  const dateStr = format(new Date(), 'dd/MM/yyyy', { locale: fr });
  const header = `RAPPORT ${printBranding.title} — ${dateStr}\n${printBranding.program}\n${'—'.repeat(40)}`;
  const body = messages
    .map((msg) => {
      const label = msg.role === 'user' ? 'QUESTION' : 'RÉPONSE';
      return `\n${label} :\n${msg.content}`;
    })
    .join('\n');
  const footer = `\n${'—'.repeat(40)}\n${printBranding.title} — ${printBranding.subtitle}\n${printBranding.website}`;
  return `${header}${body}${footer}`;
}

export function useChatExport(messages: Msg[]) {
  const canShare = useMemo(
    () => typeof navigator !== 'undefined' && !!navigator.share,
    []
  );

  const exportPrint = useCallback(() => {
    if (messages.length === 0) return;
    const html = generatePrintHtml(messages);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Le navigateur a bloqué l'ouverture de la fenêtre. Autorisez les popups puis réessayez.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 600);
    };
  }, [messages]);

  const exportCopy = useCallback(async () => {
    if (messages.length === 0) return;
    const text = messagesToText(messages);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Conversation copiée dans le presse-papier');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Conversation copiée dans le presse-papier');
    }
  }, [messages]);

  const exportShare = useCallback(async () => {
    if (messages.length === 0 || !navigator.share) return;
    const text = messagesToText(messages);
    try {
      await navigator.share({
        title: `Rapport ${chatConfig.printBranding.title}`,
        text,
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Erreur lors du partage');
    }
  }, [messages]);

  return { exportPrint, exportCopy, exportShare, canShare };
}
