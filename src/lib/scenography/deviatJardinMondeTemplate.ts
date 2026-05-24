/**
 * Scenography template — DEVIAT / Jardin Monde.
 *
 * 4-act narrative (Sol → Éclosion Punk → Dérive Mycélienne → Jardin Monde)
 * augmented with:
 *   - Empty-state poetic fallback when species/photos === 0
 *   - Deterministic asymmetric "Jardin Punk" layout (Framer Motion + AnimatePresence)
 *   - Three.js mycelium canvas in z-negative background (UMD: `window.THREE`)
 *   - Web Audio API sonification with entry overlay (autoplay-policy safe)
 *   - prefers-reduced-motion respected at every layer, mute toggle persistent
 *
 * Globals injected by ScenographyRuntime:
 *   React, motion, AnimatePresence, useScroll, useTransform,
 *   useScrollProgress, useMousePos, lerp, clamp, hashColor, data
 *   window.THREE (Three.js r160 UMD)
 *
 * Must end with: export default Scenography;
 */
export const DEVIAT_JARDIN_MONDE_TEMPLATE = String.raw`
// ---------- utils ----------
function hashStr(s) {
  s = String(s || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}
function seeded(seed) {
  // mulberry32
  return function() {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function isRare(sp) {
  const c = sp && (sp.observations_count || sp.observations || 0);
  return c <= 1 || !sp.has_marcheur_obs;
}
function usePrefersReducedMotion() {
  const { useState, useEffect } = React;
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches); on();
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on);
    return () => { m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on); };
  }, []);
  return r;
}

// ---------- shared atoms ----------
function StatPulse({ value, label }) {
  return createElement('div', { className: 'text-center' },
    createElement('div', { className: 'text-5xl sm:text-7xl font-display font-light text-emerald-300 tabular-nums' }, value),
    createElement('div', { className: 'text-[10px] uppercase tracking-[0.3em] text-emerald-100/60 mt-2' }, label),
  );
}

// ---------- ACT 0 — Empty-state poetic fallback ----------
function ActSilence({ event }) {
  return createElement('section', {
    className: 'fixed inset-0 z-10 grid place-items-center pointer-events-none px-6',
  },
    createElement('div', { className: 'text-center max-w-xl' },
      createElement('div', {
        className: 'mx-auto mb-8 w-24 h-24 rounded-full border border-emerald-300/30',
        style: { boxShadow: '0 0 80px 10px rgba(110, 231, 183, 0.15) inset' },
      }),
      createElement('h1', {
        className: 'font-display text-2xl sm:text-4xl text-emerald-50/85 font-light tracking-wide leading-snug',
      }, event?.scenography_title || event?.title || 'Le jardin attend'),
      createElement('p', {
        className: 'mt-6 text-sm text-emerald-100/55 leading-relaxed',
      },
        "Aucune observation, aucun regard n'a encore été déposé ici. " +
        "Le sol est prêt. La scénographie s'ouvrira dès la première trace.",
      ),
      createElement('p', { className: 'mt-10 text-[10px] uppercase tracking-[0.4em] text-emerald-100/30' }, '· silence fertile ·'),
    ),
  );
}

// ---------- ACT 1 — Sol ----------
function ActSol({ event, speciesCount, photosCount }) {
  const p = useScrollProgress();
  const opacity = clamp(1 - p * 4, 0, 1);
  return createElement('section', {
    className: 'fixed inset-0 z-10 grid place-items-center pointer-events-none',
    style: { opacity },
  },
    createElement('div', { className: 'text-center px-6' },
      createElement('div', { className: 'flex items-end justify-center gap-8 sm:gap-16 mb-12' },
        createElement(StatPulse, { value: speciesCount, label: 'Espèces' }),
        createElement(StatPulse, { value: photosCount, label: 'Regards' }),
      ),
      createElement('h1', {
        className: 'font-display text-3xl sm:text-5xl text-emerald-50/90 font-light tracking-wide max-w-2xl mx-auto leading-tight',
      }, event?.scenography_title || event?.title || 'Un Jardin Monde'),
      createElement('p', { className: 'mt-6 text-xs uppercase tracking-[0.4em] text-emerald-100/40' },
        'Faites défiler ↓'),
    ),
  );
}

// ---------- ACT 2 — Éclosion Punk (Framer Motion, deterministic asymmetric) ----------
function ActEclosion({ photos, species, onSpeciesEnter }) {
  const p = useScrollProgress();
  const active = p > 0.08 && p < 0.5;
  const localP = clamp((p - 0.08) / 0.42, 0, 1);
  const items = photos.slice(0, 60);
  const reduced = usePrefersReducedMotion();

  return createElement('section', {
    className: 'fixed inset-0 z-0 overflow-hidden pointer-events-none',
    'aria-hidden': true,
  },
    items.map((ph, i) => {
      const rnd = seeded(hashStr((ph.id || ph.url || '') + ':' + i));
      const x = 5 + rnd() * 90;
      const y = 5 + rnd() * 90;
      const bucket = (i % 7 === 0) ? 'L' : (i % 3 === 0 ? 'M' : 'S');
      const size = bucket === 'L' ? 200 : bucket === 'M' ? 130 : 80;
      const delay = i / items.length;
      const visible = active && localP > delay * 0.8;
      const rot = (rnd() * 24) - 12;
      return createElement(motion.div, {
        key: 'ph-' + i,
        className: 'absolute rounded-sm overflow-hidden shadow-2xl ring-1 ring-emerald-100/10',
        style: {
          left: x + '%', top: y + '%',
          width: size + 'px', height: size + 'px',
          transform: 'translate(-50%, -50%) rotate(' + rot + 'deg)',
        },
        initial: { opacity: 0, scale: reduced ? 1 : 0.3 },
        animate: visible ? { opacity: 0.9, scale: 1 } : { opacity: 0, scale: reduced ? 1 : 0.3 },
        transition: { duration: reduced ? 0.2 : 0.7, ease: 'easeOut' },
        onAnimationComplete: () => {
          if (visible && onSpeciesEnter) onSpeciesEnter({ kind: 'photo', i });
        },
      },
        createElement('img', {
          src: ph.thumbnail_url || ph.url,
          alt: '',
          loading: 'lazy',
          className: 'w-full h-full object-cover',
        }),
      );
    }),
    species.slice(0, 16).map((sp, i) => {
      const rnd = seeded(hashStr((sp.scientific_name || '') + ':lbl'));
      const localStart = 0.15 + (i / 16) * 0.7;
      const visible = active && localP > localStart && localP < localStart + 0.18;
      const rare = isRare(sp);
      return createElement(motion.div, {
        key: 'sp-' + i,
        className: 'absolute font-mono text-[10px] sm:text-xs uppercase tracking-widest mix-blend-difference ' +
          (rare ? 'text-amber-200' : 'text-emerald-200/80'),
        style: { left: (5 + rnd() * 80) + '%', top: (10 + rnd() * 75) + '%' },
        initial: { opacity: 0 },
        animate: { opacity: visible ? 1 : 0 },
        transition: { duration: 0.3 },
        onAnimationComplete: () => {
          if (visible && onSpeciesEnter) onSpeciesEnter({ kind: 'species', rare, i, name: sp.scientific_name });
        },
      },
        (rare ? '· ' : '') + (sp.common_name || sp.scientific_name) + (rare ? ' ·' : ''),
      );
    }),
  );
}

// ---------- ACT 3 — Dérive Mycélienne (SVG fallback, Three.js layered on top) ----------
function ActDerive({ species }) {
  const p = useScrollProgress();
  const active = p > 0.45 && p < 0.8;
  const localP = clamp((p - 0.45) / 0.35, 0, 1);
  const nodes = species.slice(0, 30);

  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cx = w / 2, cy = h / 2;
  const positions = nodes.map((n, i) => {
    const rnd = seeded(hashStr(n.scientific_name || ('n' + i)));
    const angle = rnd() * Math.PI * 2;
    const r = 90 + rnd() * 260;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, node: n };
  });

  return createElement('section', {
    className: 'fixed inset-0 z-0 overflow-hidden pointer-events-none',
    'aria-hidden': true,
  },
    createElement('svg', {
      className: 'absolute inset-0 w-full h-full',
      style: { opacity: active ? 1 : 0, transition: 'opacity 0.6s' },
    },
      positions.map((a, i) =>
        positions.slice(i + 1, i + 4).map((b, j) =>
          createElement('line', {
            key: i + '-' + j,
            x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            stroke: hashColor(a.node.iconic_taxon || 'x'),
            strokeWidth: 0.6,
            strokeOpacity: 0.3 * localP,
          })
        )
      ),
      positions.map((pos, i) =>
        createElement('g', { key: 'n-' + i },
          createElement('circle', {
            cx: pos.x, cy: pos.y,
            r: 4 + Math.log2((pos.node.observations_count || 1) + 1),
            fill: hashColor(pos.node.iconic_taxon || 'x'),
            opacity: 0.8 * localP,
          }),
          createElement('text', {
            x: pos.x + 10, y: pos.y + 4,
            fill: '#d1fae5',
            fontSize: 9,
            opacity: localP > 0.5 ? 0.6 : 0,
            style: { fontFamily: 'ui-monospace, monospace' },
          }, (pos.node.common_name || pos.node.scientific_name || '').slice(0, 24)),
        )
      ),
    ),
  );
}

// ---------- ACT 3.b — Three.js mycelium canvas (background, all-acts) ----------
function MyceliumCanvas({ species }) {
  const { useEffect, useRef } = React;
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    const THREE = window.THREE;
    if (!THREE) return; // silent fallback to SVG layer
    let disposed = false;

    let renderer, scene, camera, points, lines, raf;
    try {
      const canvas = ref.current;
      const w = window.innerWidth, h = window.innerHeight;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      camera.position.set(0, 0, 6);

      const N = Math.min(species.length || 0, 60);
      const positions = new Float32Array(N * 3);
      const colors = new Float32Array(N * 3);
      const pts = [];
      for (let i = 0; i < N; i++) {
        const sp = species[i] || {};
        const rnd = seeded(hashStr(sp.scientific_name || ('n' + i)));
        // Spherical
        const u = rnd(), v = rnd();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 2.2 + rnd() * 1.6;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
        const colHsl = hashColor(sp.iconic_taxon || sp.scientific_name || 'x');
        const c = new THREE.Color(colHsl);
        colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
        pts.push([x, y, z]);
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pg.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const pm = new THREE.PointsMaterial({
        size: 0.12, vertexColors: true, transparent: true,
        opacity: 0.85, depthWrite: false, sizeAttenuation: true,
      });
      points = new THREE.Points(pg, pm);
      scene.add(points);

      // Lines between near neighbours
      const linePos = [];
      const lineCol = [];
      const THRESH = 1.8;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = pts[i], b = pts[j];
          const dx = a[0]-b[0], dy = a[1]-b[1], dz = a[2]-b[2];
          const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (d < THRESH) {
            linePos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
            const ci = i*3, cj = j*3;
            lineCol.push(colors[ci], colors[ci+1], colors[ci+2], colors[cj], colors[cj+1], colors[cj+2]);
          }
        }
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
      lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineCol), 3));
      const lm = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.25 });
      lines = new THREE.LineSegments(lg, lm);
      scene.add(lines);

      const onResize = () => {
        if (!renderer || !camera) return;
        const W = window.innerWidth, H = window.innerHeight;
        renderer.setSize(W, H, false);
        camera.aspect = W / H; camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      const start = performance.now();
      const tick = () => {
        if (disposed) return;
        const t = (performance.now() - start) / 1000;
        if (!reduced) {
          points.rotation.y = t * 0.04;
          points.rotation.x = Math.sin(t * 0.03) * 0.2;
          lines.rotation.copy(points.rotation);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        try { pg.dispose(); pm.dispose(); lg.dispose(); lm.dispose(); renderer.dispose(); } catch(e) {}
      };
    } catch (err) {
      // Silently bail — SVG mycelium remains as fallback
      console.warn('[Scenography] Three.js mycelium failed:', err);
    }
  }, [species, reduced]);

  return createElement('canvas', {
    ref,
    className: 'fixed inset-0 -z-[5] pointer-events-none',
    style: { width: '100vw', height: '100vh' },
  });
}

// ---------- ACT 4 — Jardin Monde ----------
function ActJardinMonde({ species, photos, testimonies, event }) {
  const p = useScrollProgress();
  const active = p > 0.78;
  const localP = clamp((p - 0.78) / 0.22, 0, 1);
  const all = species.length + photos.length;
  const reduced = usePrefersReducedMotion();

  return createElement('section', {
    className: 'fixed inset-0 z-0 overflow-hidden pointer-events-none',
    'aria-hidden': true,
    style: { opacity: active ? 1 : 0, transition: 'opacity 0.8s' },
  },
    createElement(motion.div, {
      className: 'absolute inset-0',
      animate: { rotate: reduced ? 0 : localP * 6 },
      transition: { duration: 2, ease: 'easeOut' },
    },
      Array.from({ length: Math.min(all, 200) }).map((_, i) => {
        const isPhoto = i < photos.length;
        const item = isPhoto ? photos[i] : species[i - photos.length];
        const angle = (i / Math.min(all, 200)) * Math.PI * 2;
        const radius = 100 + (i % 40) * 8;
        const x = 50 + (Math.cos(angle) * radius) / 10;
        const y = 50 + (Math.sin(angle) * radius) / 10;
        const color = isPhoto ? '#fcd34d' : hashColor(item?.iconic_taxon || 'x');
        return createElement('div', {
          key: 'pt-' + i,
          className: 'absolute rounded-full',
          style: {
            left: x + '%', top: y + '%',
            width: (isPhoto ? 4 : 3) + 'px',
            height: (isPhoto ? 4 : 3) + 'px',
            background: color,
            opacity: localP * 0.8,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 6px ' + color,
          },
        });
      }),
    ),
    createElement('div', { className: 'absolute inset-x-0 bottom-12 text-center px-6' },
      createElement('p', { className: 'text-xs uppercase tracking-[0.4em] text-emerald-100/40 mb-3' }, 'Jardin Monde'),
      createElement('h2', {
        className: 'font-display text-2xl sm:text-4xl text-emerald-50/80 font-light',
        style: { opacity: localP },
      }, species.length + ' espèces · ' + photos.length + ' regards'),
      testimonies[0] && createElement('p', {
        className: 'mt-6 italic text-sm text-emerald-100/60 max-w-xl mx-auto',
        style: { opacity: localP },
      }, '« ' + ((testimonies[0].quote || testimonies[0].text) || '').slice(0, 180) + ' »'),
    ),
  );
}

// ---------- AUDIO — entry overlay + sonification ----------
function useSonifier(muted) {
  const { useRef, useCallback } = React;
  const ctxRef = useRef(null);
  const ensure = useCallback(() => {
    if (muted) return null;
    if (!ctxRef.current) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctxRef.current = new AC();
      } catch (e) { return null; }
    }
    if (ctxRef.current.state === 'suspended') {
      try { ctxRef.current.resume(); } catch(e) {}
    }
    return ctxRef.current;
  }, [muted]);

  const play = useCallback((seedStr, rare) => {
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const seed = hashStr(seedStr || 'x');
    const base = 180 + (seed % 600); // 180-780 Hz
    const freq = rare ? base * 0.66 : base;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = rare ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(rare ? 0.09 : 0.06, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (rare ? 0.7 : 0.35));
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + (rare ? 0.75 : 0.4));
  }, [ensure]);

  return { play, ensure };
}

function EntryOverlay({ onEnter, title }) {
  const { useState } = React;
  const [hover, setHover] = useState(false);
  return createElement('div', {
    className: 'fixed inset-0 z-[60] grid place-items-center bg-[#080d0b]/95 backdrop-blur-sm',
  },
    createElement('button', {
      onClick: onEnter,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      className: 'group flex flex-col items-center gap-4 px-10 py-8 rounded-full border border-emerald-300/30 hover:border-emerald-300/70 transition-colors',
      style: { boxShadow: hover ? '0 0 80px 4px rgba(110,231,183,0.25)' : '0 0 40px 2px rgba(110,231,183,0.1)' },
    },
      createElement('span', {
        className: 'font-display text-2xl sm:text-3xl text-emerald-50/90 font-light',
      }, title || 'Pénétrer dans le jardin'),
      createElement('span', {
        className: 'text-[10px] uppercase tracking-[0.4em] text-emerald-100/50',
      }, '— scénographie sonore activée —'),
    ),
  );
}

function MuteToggle({ muted, onToggle }) {
  return createElement('button', {
    onClick: onToggle,
    className: 'fixed top-3 right-20 z-[55] text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-emerald-100/80 backdrop-blur border border-emerald-100/15',
    'aria-label': muted ? 'Activer le son' : 'Couper le son',
  }, muted ? '♪ off' : '♪ on');
}

// ---------- ROOT ----------
function Scenography({ data }) {
  const { useState, useCallback, useRef } = React;
  const event = data.event || {};
  const species = data.species || [];
  const photos = data.photos || [];
  const waypoints = data.waypoints || [];
  const testimonies = data.testimonies || [];
  const isEmpty = species.length === 0 && photos.length === 0;

  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const sonifier = useSonifier(muted);
  const playedRef = useRef(new Set());

  const onSpeciesEnter = useCallback((evt) => {
    if (!entered || muted) return;
    const key = evt.kind + ':' + (evt.name || evt.i);
    if (playedRef.current.has(key)) return;
    playedRef.current.add(key);
    sonifier.play(evt.name || ('k' + evt.i), !!evt.rare);
  }, [entered, muted, sonifier]);

  const handleEnter = useCallback(() => {
    setEntered(true);
    sonifier.ensure(); // unlock AudioContext under gesture
  }, [sonifier]);

  return createElement('div', { className: 'relative min-h-[500vh]' },
    // Humus background
    createElement('div', {
      className: 'fixed inset-0 -z-10 pointer-events-none',
      style: { background: 'radial-gradient(ellipse at 50% 30%, rgba(20, 60, 40, 0.4), rgba(8, 14, 12, 1) 70%)' },
    }),
    event.cover_image_url && createElement('img', {
      src: event.cover_image_url,
      alt: '',
      'aria-hidden': true,
      className: 'fixed inset-0 -z-20 w-full h-full object-cover opacity-15',
      style: { filter: 'blur(2px) brightness(0.5)' },
    }),

    // Three.js mycelium (only when we have species)
    species.length > 0 && createElement(MyceliumCanvas, { species }),

    isEmpty
      ? createElement(ActSilence, { event })
      : createElement(React.Fragment, null,
          createElement(ActSol, { event, speciesCount: species.length, photosCount: photos.length }),
          createElement(ActEclosion, { photos, species, onSpeciesEnter }),
          createElement(ActDerive, { species }),
          createElement(ActJardinMonde, { species, photos, testimonies, event }),
        ),

    createElement('div', {
      className: 'fixed top-3 left-3 z-50 text-[10px] uppercase tracking-[0.3em] text-emerald-100/40',
    }, 'la fréquence du vivant'),

    !isEmpty && createElement(MuteToggle, { muted, onToggle: () => setMuted(m => !m) }),
    !isEmpty && !entered && createElement(EntryOverlay, {
      onEnter: handleEnter,
      title: event?.scenography_title || event?.title,
    }),
  );
}

export default Scenography;
`;
