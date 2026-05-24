/**
 * Default scenography template for the DEVIAT / Jardin Monde event.
 * Implements the 4-act narrative (Sol → Éclosion Punk → Dérive Mycélienne → Jardin Monde)
 * with CSS/SVG/Framer Motion only — no Three.js.
 *
 * Globals available inside (injected by ScenographyRuntime):
 *   React, motion, AnimatePresence, useScroll, useTransform,
 *   useScrollProgress, useMousePos, lerp, clamp, hashColor, data
 *
 * Must end with: export default Scenography;
 */
export const DEVIAT_JARDIN_MONDE_TEMPLATE = String.raw`
function StatPulse({ value, label }) {
  return createElement('div', { className: 'text-center' },
    createElement('div', { className: 'text-5xl sm:text-7xl font-display font-light text-emerald-300 tabular-nums' }, value),
    createElement('div', { className: 'text-[10px] uppercase tracking-[0.3em] text-emerald-100/60 mt-2' }, label),
  );
}

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

function ActEclosion({ photos, species }) {
  const p = useScrollProgress();
  // Active between 0.1 → 0.45
  const active = p > 0.08 && p < 0.5;
  const localP = clamp((p - 0.08) / 0.42, 0, 1);
  const items = photos.slice(0, 60);

  return createElement('section', {
    className: 'fixed inset-0 z-0 overflow-hidden pointer-events-none',
    'aria-hidden': true,
  },
    items.map((ph, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      const rand = seed / 233280;
      const x = ((i * 73) % 100);
      const y = ((i * 137 + 23) % 100);
      const size = 60 + ((i * 17) % 120);
      const delay = (i / items.length);
      const visible = active && localP > delay * 0.8;
      const rot = ((i * 41) % 30) - 15;
      return createElement(motion.div, {
        key: i,
        className: 'absolute rounded-sm overflow-hidden shadow-2xl',
        style: {
          left: x + '%', top: y + '%',
          width: size + 'px', height: size + 'px',
          transform: 'translate(-50%, -50%) rotate(' + rot + 'deg)',
        },
        initial: { opacity: 0, scale: 0.3 },
        animate: visible ? { opacity: 0.85, scale: 1 } : { opacity: 0, scale: 0.3 },
        transition: { duration: 0.6, ease: 'easeOut' },
      },
        createElement('img', {
          src: ph.thumbnail_url || ph.url,
          alt: '',
          loading: 'lazy',
          className: 'w-full h-full object-cover',
        }),
      );
    }),
    // Species name overlays
    species.slice(0, 12).map((sp, i) => {
      const localStart = 0.2 + (i / 12) * 0.6;
      const visible = active && localP > localStart && localP < localStart + 0.15;
      return createElement(motion.div, {
        key: 'sp-' + i,
        className: 'absolute font-mono text-[10px] sm:text-xs uppercase tracking-widest text-emerald-200/80 mix-blend-difference',
        style: { left: ((i * 113) % 80 + 10) + '%', top: ((i * 67) % 80 + 10) + '%' },
        initial: { opacity: 0 },
        animate: { opacity: visible ? 1 : 0 },
        transition: { duration: 0.3 },
      }, sp.common_name || sp.scientific_name),
    }),
  );
}

function ActDerive({ species, photos }) {
  const p = useScrollProgress();
  const active = p > 0.45 && p < 0.8;
  const localP = clamp((p - 0.45) / 0.35, 0, 1);
  const nodes = species.slice(0, 30);

  // Build mycelium network (radial layout)
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cx = w / 2, cy = h / 2;
  const positions = nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const r = 100 + ((i * 53) % 200);
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
      // Mycelium lines
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
      // Nodes
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

function ActJardinMonde({ species, photos, waypoints, testimonies, event }) {
  const p = useScrollProgress();
  const active = p > 0.78;
  const localP = clamp((p - 0.78) / 0.22, 0, 1);

  // Layout: compose particles around the centroid of waypoints (or event center)
  const all = species.length + photos.length;

  return createElement('section', {
    className: 'fixed inset-0 z-0 overflow-hidden pointer-events-none',
    'aria-hidden': true,
    style: { opacity: active ? 1 : 0, transition: 'opacity 0.8s' },
  },
    createElement(motion.div, {
      className: 'absolute inset-0',
      animate: { rotate: localP * 6 },
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
      createElement('p', {
        className: 'text-xs uppercase tracking-[0.4em] text-emerald-100/40 mb-3',
      }, 'Jardin Monde'),
      createElement('h2', {
        className: 'font-display text-2xl sm:text-4xl text-emerald-50/80 font-light',
        style: { opacity: localP },
      }, species.length + ' espèces · ' + photos.length + ' regards'),
      testimonies[0] && createElement('p', {
        className: 'mt-6 italic text-sm text-emerald-100/60 max-w-xl mx-auto',
        style: { opacity: localP },
      }, '« ' + (testimonies[0].text || '').slice(0, 180) + ' »'),
    ),
  );
}

function Scenography({ data }) {
  const event = data.event || {};
  const species = data.species || [];
  const photos = data.photos || [];
  const waypoints = data.waypoints || [];
  const testimonies = data.testimonies || [];

  return createElement('div', { className: 'relative min-h-[500vh]' },
    // Persistent humus background
    createElement('div', {
      className: 'fixed inset-0 -z-10 pointer-events-none',
      style: {
        background: 'radial-gradient(ellipse at 50% 30%, rgba(20, 60, 40, 0.4), rgba(8, 14, 12, 1) 70%)',
      },
    }),
    // Cover image dimmed
    event.cover_image_url && createElement('img', {
      src: event.cover_image_url,
      alt: '',
      'aria-hidden': true,
      className: 'fixed inset-0 -z-20 w-full h-full object-cover opacity-15',
      style: { filter: 'blur(2px) brightness(0.5)' },
    }),

    createElement(ActSol, { event, speciesCount: species.length, photosCount: photos.length }),
    createElement(ActEclosion, { photos, species }),
    createElement(ActDerive, { species, photos }),
    createElement(ActJardinMonde, { species, photos, waypoints, testimonies, event }),

    // Top corner: discrete branding
    createElement('div', {
      className: 'fixed top-3 left-3 z-50 text-[10px] uppercase tracking-[0.3em] text-emerald-100/40',
    }, 'la fréquence du vivant'),
  );
}

export default Scenography;
`;
