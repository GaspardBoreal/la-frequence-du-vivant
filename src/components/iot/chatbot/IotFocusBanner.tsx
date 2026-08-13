import React from 'react';
import { Radio, X } from 'lucide-react';
import { iotChatFocus, useIotChatFocus, IOT_WINDOWS } from './iotChatFocus';
import { formatBytes } from '@/lib/chatContextCost';
import type { ContextProvider } from '@/hooks/useChatPageContext';
import type { IotScope } from '@/hooks/iot/useIotChatProviders';
import type { IotAiCredit } from '@/hooks/iot/useIotAiCredit';

/**
 * Bandeau de cadrage du poste IoT : l'administrateur voit d'un coup d'œil sur
 * quel périmètre l'IA raisonne et quels contextes partent réellement au modèle.
 */
export function IotFocusBanner({
  scope,
  activeProviders = [],
  credit = null,
}: {
  scope: IotScope;
  activeProviders?: ContextProvider[];
  /** Crédits de messages du partenaire (absent côté admin). */
  credit?: IotAiCredit | null;
}) {
  const focus = useIotChatFocus();
  const totalBytes = activeProviders.reduce((s, p) => s + p.bytes, 0);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--ds-gold))]/30 bg-[hsl(var(--ds-forest-deep))] px-3 py-2 text-[hsl(var(--ds-cream))]">
      <Radio className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ds-gold))]" />
      <span className="min-w-0 truncate text-[11px]">
        Cadré sur <span className="font-semibold">{scope.label}</span>
      </span>

      {credit && !credit.admin && credit.quota >= 0 && (
        <span
          title="Messages IA restants ce mois-ci"
          className={`rounded-full border px-2 py-0.5 text-[10px] ${
            credit.remaining === 0
              ? 'border-red-400/60 text-red-200'
              : credit.remaining <= 2
                ? 'border-amber-400/60 text-amber-200'
                : 'border-[hsl(var(--ds-gold))]/50 text-[hsl(var(--ds-gold))]'
          }`}
        >
          ✦ {credit.remaining}/{credit.quota}
        </span>
      )}

      <span className="ml-auto flex items-center gap-1">
        {IOT_WINDOWS.map((d) => (
          <button
            key={d}
            onClick={() => iotChatFocus.setWindowDays(d)}
            className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
              focus.windowDays === d
                ? 'bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))]'
                : 'border border-[hsl(var(--ds-cream))]/25 hover:border-[hsl(var(--ds-gold))]/60'
            }`}
          >
            {d === 1 ? '24 h' : `${d} j`}
          </button>
        ))}
        {scope.level !== 'parc' && (
          <button
            onClick={() => iotChatFocus.reset()}
            title="Élargir au parc entier"
            className="ml-1 rounded-full p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>

      {activeProviders.length > 0 ? (
        <span className="flex w-full flex-wrap items-center gap-1 text-[9.5px]">
          <span className="opacity-60">Transmis :</span>
          {activeProviders.map((p) => (
            <span key={p.id} className="rounded-full border border-[hsl(var(--ds-gold))]/40 px-1.5 py-[1px]">
              {p.emoji} {p.label}
            </span>
          ))}
          <span className="opacity-60">— {formatBytes(totalBytes)}</span>
          <span className="opacity-45">· ajustable dans la Console 📎</span>
        </span>
      ) : (
        <span className="flex w-full items-center gap-1 text-[9.5px] opacity-60">
          Aucun contexte transmis — ouvrez la Console 📎 pour activer les données des sondes.
        </span>
      )}
    </div>
  );
}

export default IotFocusBanner;
