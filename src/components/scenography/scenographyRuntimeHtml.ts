/**
 * Builds the HTML document served inside the sandboxed iframe used to run
 * per-event scenographies. The iframe is loaded with `sandbox="allow-scripts"`
 * (no `allow-same-origin`), so it cannot read cookies or the parent Supabase
 * session. The user's TSX is transpiled with @babel/standalone in the parent,
 * then injected as a plain script tag here.
 *
 * Runtime exposed to the scenography code (globals):
 *   - React, ReactDOM (UMD, React 18)
 *   - Motion (Framer Motion UMD ESM-compatible build) → use `Motion.motion.div` etc.
 *   - Scenography.data → the injected payload
 *   - Scenography.helpers → { useScrollProgress, useMousePos, lerp, clamp, hashColor }
 *   - tailwind CSS (CDN)
 *
 * The code MUST define and export a default function component named `Scenography`.
 */

export function buildScenographyHtml(opts: { compiledCode: string; nonceTitle: string }): string {
  const { compiledCode, nonceTitle } = opts;
  const safeTitle = nonceTitle.replace(/[<>"'&]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c]!)
  );

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${safeTitle}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['ui-serif', 'Georgia', 'serif'],
        },
      },
    },
  };
</script>
<style>
  html, body, #root { margin: 0; padding: 0; min-height: 100vh; background: #0a0f0d; color: #e7efe9; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  body { overflow-x: hidden; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 999px; }
  .scenography-error {
    position: fixed; inset: 0; display: grid; place-items: center; padding: 24px;
    background: #1a0e0e; color: #fecaca; font-family: ui-monospace, monospace;
    font-size: 13px; white-space: pre-wrap; overflow: auto;
  }
</style>
</head>
<body>
<div id="root"></div>

<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script crossorigin src="https://unpkg.com/framer-motion@11.11.17/dist/framer-motion.js"></script>
<script crossorigin src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>

<script>
  // === Receive data from parent via postMessage ===
  window.__SCENO_READY__ = false;
  window.__SCENO_DATA__ = null;
  const pendingRender = { fn: null };

  window.addEventListener('message', (ev) => {
    if (!ev.data || typeof ev.data !== 'object') return;
    if (ev.data.type === '__SCENO_DATA__') {
      window.__SCENO_DATA__ = ev.data.payload;
      window.__SCENO_READY__ = true;
      if (pendingRender.fn) pendingRender.fn();
    }
  });

  // Signal ready immediately so parent posts data
  try { window.parent.postMessage({ type: '__SCENO_BOOT__' }, '*'); } catch (e) {}
</script>

<script>
  // === Runtime helpers exposed to scenography code ===
  (function() {
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const useScrollProgress = () => {
      const [p, setP] = useState(0);
      useEffect(() => {
        const onScroll = () => {
          const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
          setP(Math.min(1, Math.max(0, window.scrollY / max)));
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
      }, []);
      return p;
    };
    const useMousePos = () => {
      const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
      useEffect(() => {
        const on = (e) => setPos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
        window.addEventListener('pointermove', on, { passive: true });
        return () => window.removeEventListener('pointermove', on);
      }, []);
      return pos;
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const hashColor = (s) => {
      let h = 0;
      for (let i = 0; i < (s||'').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      const hue = Math.abs(h) % 360;
      return 'hsl(' + hue + ' 65% 55%)';
    };

    window.Scenography = {
      helpers: { useScrollProgress, useMousePos, lerp, clamp, hashColor },
      data: null,
    };
  })();
</script>

<script>
try {
${compiledCode}
} catch (err) {
  document.body.insertAdjacentHTML('beforeend',
    '<div class="scenography-error">Erreur de scénographie:\\n\\n' + (err && err.stack ? err.stack : String(err)) + '</div>'
  );
  try { window.parent.postMessage({ type: '__SCENO_ERROR__', message: String(err && err.message || err) }, '*'); } catch(e) {}
}
</script>

<script>
  (function mount() {
    const render = () => {
      try {
        window.Scenography.data = window.__SCENO_DATA__ || {};
        const Component = window.Scenography.Component;
        if (!Component) {
          throw new Error('La scénographie doit appeler Scenography.register(YourComponent).');
        }
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component, { data: window.Scenography.data }));
        try { window.parent.postMessage({ type: '__SCENO_RENDERED__' }, '*'); } catch(e) {}
      } catch (err) {
        document.body.insertAdjacentHTML('beforeend',
          '<div class="scenography-error">Erreur au montage:\\n\\n' + (err && err.stack ? err.stack : String(err)) + '</div>'
        );
      }
    };
    if (window.__SCENO_READY__) render();
    else pendingRender.fn = render;
  })();
</script>
</body>
</html>`;
}
