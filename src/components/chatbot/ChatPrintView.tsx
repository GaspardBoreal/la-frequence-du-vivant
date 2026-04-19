import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { chatConfig } from './chatConfig';

type Msg = { role: 'user' | 'assistant'; content: string };

const COLORS = chatConfig.printBranding.colors;
const B = chatConfig.printBranding;

function PrintModeView({ messages }: { messages: Msg[] }) {
  const dateStr = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });

  const msgHtml = messages
    .map((msg) => {
      const isUser = msg.role === 'user';
      const label = isUser ? 'Question' : "Réponse de l'Assistant";
      const icon = isUser ? '👤' : '🌿';
      const borderColor = isUser ? COLORS.forest : COLORS.gold;
      const bgColor = isUser ? '#f0f4f0' : COLORS.creamLight;
      const contentHtml = msg.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^### (.+)$/gm, `<h3 style="font-size:14px;font-weight:600;color:${COLORS.forest};margin:12px 0 6px;">$1</h3>`)
        .replace(/^## (.+)$/gm, `<h2 style="font-size:15px;font-weight:600;color:${COLORS.forest};margin:14px 0 8px;">$1</h2>`)
        .replace(/^# (.+)$/gm, `<h1 style="font-size:16px;font-weight:700;color:${COLORS.forest};margin:16px 0 8px;">$1</h1>`)
        .replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:3px 0;margin-left:20px;list-style-type:decimal;">$1</li>')
        .replace(/^[-•]\s+(.+)$/gm, '<li style="margin:3px 0;margin-left:20px;list-style-type:disc;">$1</li>')
        .replace(/\n{2,}/g, '</p><p style="margin:8px 0;">')
        .replace(/\n/g, '<br/>');

      return `
        <div style="page-break-inside:avoid;margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:16px;">${icon}</span>
            <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${borderColor};">${label}</span>
          </div>
          <div style="border-left:3px solid ${borderColor};background:${bgColor};padding:16px 20px;border-radius:0 8px 8px 0;">
            <div style="font-size:13px;line-height:1.7;color:${COLORS.text};">
              <p style="margin:8px 0;">${contentHtml}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Rapport ${B.title} — ${dateStr}</title>
      <style>
        @page { margin: 2cm; size: A4; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${COLORS.text}; background: #fff; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div style="border-bottom:3px solid ${COLORS.gold};padding-bottom:20px;margin-bottom:30px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <span style="font-size:32px;">${B.emoji}</span>
          <div>
            <h1 style="font-size:22px;font-weight:700;color:${COLORS.forest};margin:0;">${B.title}</h1>
            <p style="font-size:11px;font-weight:500;color:${COLORS.gold};letter-spacing:1.5px;text-transform:uppercase;margin:2px 0 0;">${B.subtitle}</p>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
          <p style="font-size:12px;color:${COLORS.textMuted};">${B.program}</p>
          <p style="font-size:11px;color:${COLORS.textMuted};">Généré le ${dateStr}</p>
        </div>
      </div>
      <div style="background:linear-gradient(135deg,${COLORS.forest},${COLORS.forestLight});color:#fff;padding:16px 24px;border-radius:8px;margin-bottom:24px;">
        <h2 style="font-size:15px;font-weight:600;margin:0;">📋 Rapport de conversation</h2>
        <p style="font-size:12px;opacity:0.85;margin-top:4px;">
          ${messages.filter((m) => m.role === 'user').length} question${messages.filter((m) => m.role === 'user').length > 1 ? 's' : ''} · ${messages.filter((m) => m.role === 'assistant').length} réponse${messages.filter((m) => m.role === 'assistant').length > 1 ? 's' : ''}
        </p>
      </div>
      ${msgHtml}
      <div style="border-top:2px solid ${COLORS.gold};padding-top:16px;margin-top:40px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">${B.emoji}</span>
            <span style="font-size:11px;font-weight:600;color:${COLORS.forest};">${B.title} — ${B.subtitle}</span>
          </div>
          <span style="font-size:10px;color:${COLORS.textMuted};">${B.website}</span>
        </div>
        <p style="font-size:9px;color:${COLORS.textMuted};margin-top:8px;text-align:center;">${B.copyright}</p>
      </div>
    </body>
    </html>
  `;
}

export function ChatPrintPreview({ messages }: { messages: Msg[] }) {
  const dateStr = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
  const questionCount = messages.filter((m) => m.role === 'user').length;
  const answerCount = messages.filter((m) => m.role === 'assistant').length;

  return (
    <div className="bg-white rounded-lg overflow-hidden text-sm">
      <div className="border-b-2 border-secondary p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{B.emoji}</span>
          <div>
            <h1 className="text-base font-bold text-primary">{B.title}</h1>
            <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">
              {B.subtitle}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-[11px] text-muted-foreground">{B.program}</p>
          <p className="text-[10px] text-muted-foreground">{dateStr}</p>
        </div>
      </div>
      <div className="bg-primary text-primary-foreground px-4 py-3 mx-4 mt-4 rounded-lg">
        <h2 className="text-xs font-semibold">📋 Rapport de conversation</h2>
        <p className="text-[10px] opacity-80 mt-1">
          {questionCount} question{questionCount > 1 ? 's' : ''} · {answerCount} réponse
          {answerCount > 1 ? 's' : ''}
        </p>
      </div>
      <div className="p-4 space-y-4">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{isUser ? '👤' : '🌿'}</span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isUser ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  {isUser ? 'Question' : "Réponse de l'Assistant"}
                </span>
              </div>
              <div
                className={`border-l-[3px] rounded-r-lg px-4 py-3 ${
                  isUser ? 'border-primary bg-primary/5' : 'border-secondary bg-secondary/5'
                }`}
              >
                {isUser ? (
                  <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {msg.content}
                  </p>
                ) : (
                  <div className="prose prose-xs max-w-none text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 text-xs leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t-2 border-secondary px-4 py-3 mt-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">{B.emoji}</span>
            <span className="text-[10px] font-semibold text-primary">
              {B.title} — {B.subtitle}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground">{B.website}</span>
        </div>
        <p className="text-[8px] text-muted-foreground mt-2 text-center">{B.copyright}</p>
      </div>
    </div>
  );
}

export function generatePrintHtml(messages: Msg[]): string {
  return PrintModeView({ messages });
}
