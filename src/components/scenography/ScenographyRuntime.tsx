import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Babel from '@babel/standalone';
import { buildScenographyHtml } from './scenographyRuntimeHtml';
import type { ScenographyData } from '@/hooks/useScenography';
import type { BrandKit } from '@/lib/brandKits/types';

interface Props {
  code: string;
  data: Partial<ScenographyData>;
  title?: string;
  className?: string;
  /** Called when iframe reported a render error. */
  onError?: (msg: string) => void;
  /** Show the exit button (default true). */
  showExit?: boolean;
  /** Click handler for the exit/fallback button. */
  onExit?: () => void;
  /** Optional brand kit — repaints the sandbox iframe with partner tokens/fonts. */
  brand?: BrandKit | null;
}

/**
 * Sandboxed runtime that transpiles user TSX with Babel-standalone and
 * runs it inside an isolated iframe (no same-origin → no cookie access).
 */
const ScenographyRuntime: React.FC<Props> = ({
  code,
  data,
  title = 'Scénographie',
  className,
  onError,
  showExit = true,
  onExit,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Transpile TSX → JS once per code change
  const compiled = useMemo(() => {
    try {
      const repairedCode = code.replace(
        /},\s*(sp\.common_name\s*\|\|\s*sp\.scientific_name)\),/g,
        (_match, labelExpr) => `}, ${labelExpr});`
      );

      const wrapped = `
        (function(){
          const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment, createElement } = React;
          const { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } = (window.Motion || window.motion || window["framer-motion"] || {});
          const { useScrollProgress, useMousePos, lerp, clamp, hashColor } = window.Scenography.helpers;
          const data = window.__SCENO_DATA__ || {};
          ${repairedCode}
          // Convention: the last expression OR an explicit Scenography.register(Component)
          if (typeof Scenography_default !== 'undefined') {
            window.Scenography.Component = Scenography_default;
          }
        })();
      `;
      // Rewrite "export default X" → "var Scenography_default = X;"
      const normalized = wrapped.replace(/export\s+default\s+/g, 'var Scenography_default = ');
      // Auto-detect JSX (capitalised tag or closing tag). When absent we use
      // the plain TS parser to avoid the `a < b` / JSX ambiguity which breaks
      // expressions like `p < 0.8` in createElement-based templates.
      const hasJsx = /<[A-Za-z][\s\S]*?>|<\/[A-Za-z]/.test(code);
      const out = Babel.transform(normalized, {
        presets: hasJsx
          ? [['react', { runtime: 'classic' }], ['typescript', { allExtensions: true, isTSX: true }]]
          : [['typescript', { allExtensions: true, isTSX: false }]],
        filename: hasJsx ? 'scenography.tsx' : 'scenography.ts',
      });
      return { code: out.code ?? '', error: null as string | null };
    } catch (e: any) {
      return { code: '', error: e.message ?? String(e) };
    }
  }, [code]);

  const html = useMemo(
    () => (compiled.error ? null : buildScenographyHtml({ compiledCode: compiled.code, nonceTitle: title })),
    [compiled, title]
  );

  // Post data once iframe boots
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === '__SCENO_BOOT__') {
        iframeRef.current?.contentWindow?.postMessage(
          { type: '__SCENO_DATA__', payload: data },
          '*'
        );
      } else if (ev.data.type === '__SCENO_ERROR__') {
        setError(ev.data.message);
        onError?.(ev.data.message);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [data, onError]);

  if (compiled.error) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Erreur de scénographie</h1>
          <pre className="text-xs bg-destructive/10 border border-destructive/30 rounded p-4 overflow-auto text-destructive whitespace-pre-wrap">
            {compiled.error}
          </pre>
          {showExit && onExit && (
            <button onClick={onExit} className="text-sm underline text-primary">
              Revenir à la page classique
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? 'fixed inset-0 z-0'}>
      <iframe
        ref={iframeRef}
        title={title}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        srcDoc={html ?? ''}
        className="w-full h-full border-0 block"
        style={{ width: '100%', height: '100vh' }}
      />
      {showExit && onExit && (
        <button
          onClick={onExit}
          className="fixed top-3 right-3 z-50 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur border border-white/20"
        >
          Mode classique
        </button>
      )}
      {error && (
        <div className="fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto text-xs bg-destructive text-destructive-foreground px-3 py-2 rounded shadow">
          Scénographie en erreur : {error}
        </div>
      )}
      {showExit && onExit && !error &&
        (!data?.species || data.species.length === 0) &&
        (!data?.photos || data.photos.length === 0) && (
        <div className="fixed bottom-3 left-3 right-3 z-50 max-w-lg mx-auto text-xs bg-amber-500/95 text-black px-3 py-2 rounded shadow">
          Aperçu : aucune observation ni photo collectée pour cet évènement — la scénographie s'animera dès qu'il y aura des données.
        </div>
      )}
    </div>
  );
};

export default ScenographyRuntime;
