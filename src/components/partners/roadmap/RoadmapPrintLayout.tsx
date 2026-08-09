import React from 'react';
import { createPortal } from 'react-dom';
import type { PartnerRoadmap } from '@/lib/partnerRoadmaps';
import { STATUS_LABEL, priorityEffort } from '@/lib/partnerRoadmaps';
import { taskKey } from '@/lib/partnerRoadmaps/prompt';
import { useRoadmapTaskStatus } from '@/hooks/useRoadmapTaskStatus';
import { SensorChainDiagram, NavigationShiftDiagram } from './RoadmapDiagrams';

const PORTAL_ID = 'partner-roadmap-print-portal';

/** Mini graphe de charge, dessiné en SVG pour être fiable à l'impression. */
const PrintEffortChart: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => {
  const rows = roadmap.priorities.map((p) => ({
    code: p.code,
    days: priorityEffort(p.tasks),
  }));
  const max = Math.max(...rows.map((r) => r.days), 1);
  return (
    <svg viewBox={`0 0 600 ${rows.length * 26 + 8}`} className="rm-svg" role="img" aria-label="Charge par priorité">
      {rows.map((r, i) => (
        <g key={r.code}>
          <text x="0" y={i * 26 + 22} fontSize="11" fill="#1c2420">
            {r.code}
          </text>
          <rect
            x="34"
            y={i * 26 + 10}
            width={(r.days / max) * 480}
            height="14"
            rx="3"
            fill="#0d6b58"
            opacity={1 - i * 0.09}
          />
          <text x={40 + (r.days / max) * 480} y={i * 26 + 21} fontSize="10" fill="#45544e">
            {r.days} j
          </text>
        </g>
      ))}
    </svg>
  );
};

/** Courbe sol / air en SVG statique. */
const PrintSensorChart: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => {
  const data = roadmap.sensorSample;
  const W = 600;
  const H = 180;
  const pad = 28;
  const all = data.flatMap((d) => [d.air, d.sol10, d.sol30, d.sol60]);
  const min = Math.min(...all) - 1;
  const max = Math.max(...all) + 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const path = (key: 'air' | 'sol10' | 'sol30' | 'sol60') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');
  const series: { key: 'air' | 'sol10' | 'sol30' | 'sol60'; label: string; color: string }[] = [
    { key: 'air', label: 'Air 3 m', color: '#c9a227' },
    { key: 'sol10', label: 'Surface 10 cm', color: '#0d6b58' },
    { key: 'sol30', label: 'Sol 30 cm', color: '#7aa88f' },
    { key: 'sol60', label: 'Sol 60 cm', color: '#5f8fa6' },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="rm-svg" role="img" aria-label="Écart sol / air sur 7 jours">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#d8d2c4" strokeWidth="0.8" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#d8d2c4" strokeWidth="0.8" />
      {series.map((s) => (
        <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="1.6" />
      ))}
      {data.map((d, i) => (
        <text key={d.day} x={x(i)} y={H - pad + 12} fontSize="8" textAnchor="middle" fill="#6d786f">
          {d.day}
        </text>
      ))}
      {series.map((s, i) => (
        <g key={`l-${s.key}`}>
          <rect x={pad + i * 130} y={H + 6} width="16" height="3" fill={s.color} />
          <text x={pad + i * 130 + 21} y={H + 10} fontSize="8.5" fill="#45544e">
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

/**
 * Portail d'impression A4 de la feuille de route partenaire.
 * Visible uniquement via `body.partner-roadmap-print-mode` (cf. src/index.css).
 */
export const RoadmapPrintLayout: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => {
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  const { resolve } = useRoadmapTaskStatus(roadmap.slug, roadmap.date);

  React.useEffect(() => {
    let el = document.getElementById(PORTAL_ID);
    let created = false;
    if (!el) {
      el = document.createElement('div');
      el.id = PORTAL_ID;
      document.body.appendChild(el);
      created = true;
    }
    setHost(el);
    return () => {
      if (created && el?.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  if (!host) return null;

  const themeById = new Map(roadmap.themes.map((t) => [t.id, t]));
  const totalTasks = roadmap.priorities.reduce((s, p) => s + p.tasks.length, 0);
  const totalDays = roadmap.priorities.reduce((s, p) => s + priorityEffort(p.tasks), 0);


  return createPortal(
    <div className="rm-print-doc">
      {/* Couverture */}
      <section className="rm-cover">
        <div className="rm-cover-rule" />
        <p className="rm-kicker">Feuille de route — diffusion restreinte</p>
        <h1 className="rm-cover-title">
          La Fréquence du Vivant <span className="rm-x">×</span> {roadmap.partnerName}
        </h1>
        <p className="rm-cover-sub">{roadmap.subtitle}</p>
        <div className="rm-cover-meta">
          <div>
            <span className="rm-label">Entretien</span>
            <span>{roadmap.interviewLabel}</span>
          </div>
          <div>
            <span className="rm-label">Interlocuteur</span>
            <span>{roadmap.partnerContact}</span>
          </div>
          <div>
            <span className="rm-label">Volume</span>
            <span>
              {totalTasks} chantiers · {Math.round(totalDays)} jours
            </span>
          </div>
        </div>
        <p className="rm-cover-intro">{roadmap.intro}</p>
        <p className="rm-cover-sources">
          <span className="rm-label">Contexte</span>
          {roadmap.context}
        </p>
        <div className="rm-cover-foot">La Fréquence du Vivant — feuille de route des travaux</div>
      </section>

      {/* 1 — Sujets et verbatims */}
      <section className="rm-section">
        <h2 className="rm-h2">1 · Ce qui est ressorti de l'entretien</h2>
        <table className="rm-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Sujet</th>
              <th style={{ width: '13%' }}>Famille</th>
              <th style={{ width: '32%' }}>Constat</th>
              <th style={{ width: '35%' }}>Extrait</th>
            </tr>
          </thead>
          <tbody>
            {roadmap.themes.map((t) => {
              const q = roadmap.verbatims.find((v) => v.themeId === t.id);
              return (
                <tr key={t.id}>
                  <td>
                    <strong>{t.label}</strong>
                  </td>
                  <td className="rm-dim">{t.family}</td>
                  <td>{t.summary}</td>
                  <td className="rm-quote">
                    {q ? `« ${q.quote} » — ${q.speaker}, ${q.at}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 2 — Lecture d'ensemble */}
      <section className="rm-section">
        <h2 className="rm-h2">2 · Lecture d'ensemble</h2>
        <p className="rm-lead">Charge estimée par priorité, en jours-homme.</p>
        <PrintEffortChart roadmap={roadmap} />

        <h3 className="rm-h3 rm-h3-space">Frise de priorisation — août à octobre 2026</h3>
        <div className="rm-gantt">
          {roadmap.priorities.map((p, i) => (
            <div className="rm-gantt-row" key={p.code}>
              <span className="rm-gantt-code">{p.code}</span>
              <span className="rm-gantt-track">
                <span
                  className="rm-gantt-bar"
                  style={{
                    left: `${p.startPct}%`,
                    width: `${p.widthPct}%`,
                    opacity: 1 - i * 0.09,
                  }}
                />
              </span>
              <span className="rm-gantt-when">{p.window}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — Chantiers */}
      {roadmap.priorities.map((p) => (
        <section className="rm-section" key={p.code}>
          <h2 className="rm-h2">
            {p.code} · {p.title}
          </h2>
          <p className="rm-lead">
            {p.window} — {priorityEffort(p.tasks)} jours — {p.tasks.length} chantiers. {p.rationale}
          </p>
          <div className="rm-grid">
            {p.tasks.map((t) => (
              <div className="rm-card" key={t.title}>
                <h3 className="rm-h3">{t.title}</h3>
                <p>{t.detail}</p>
                <p className="rm-meta">
                  <span className="rm-label-inline">Produit</span>
                  {t.output}
                </p>
                <p className="rm-meta">
                  <span className="rm-label-inline">Charge</span>
                  {t.effortDays} j
                  <span className="rm-label-inline" style={{ marginLeft: '3mm' }}>
                    État
                  </span>
                  {STATUS_LABEL[resolve(p.code, taskKey(t.title), t.status)]}
                  {t.themeId && themeById.get(t.themeId) && (
                    <>
                      <span className="rm-label-inline" style={{ marginLeft: '3mm' }}>
                        Sujet
                      </span>
                      {themeById.get(t.themeId)!.label}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>

          {p.code === 'P3' && (
            <>
              <h3 className="rm-h3 rm-h3-space">Chaîne de la donnée capteurs</h3>
              <div className="rm-diagram">
                <SensorChainDiagram variant="print" />
              </div>
              <h3 className="rm-h3 rm-h3-space">Restitution cible : écart sol / air sur 7 jours</h3>
              <PrintSensorChart roadmap={roadmap} />
            </>
          )}

          {p.code === 'P4' && (
            <>
              <h3 className="rm-h3 rm-h3-space">Reconfiguration de la navigation</h3>
              <div className="rm-diagram">
                <NavigationShiftDiagram variant="print" />
              </div>
            </>
          )}
        </section>
      ))}

      {/* 4 — Planning */}
      <section className="rm-section">
        <h2 className="rm-h2">Planning des livraisons</h2>
        <table className="rm-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Date</th>
              <th style={{ width: '24%' }}>Jalon</th>
              <th style={{ width: '58%' }}>Contenu</th>
            </tr>
          </thead>
          <tbody>
            {roadmap.milestones.map((m) => (
              <tr key={m.date}>
                <td>
                  <strong>{m.date}</strong>
                </td>
                <td>{m.label}</td>
                <td>{m.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rm-closing">{roadmap.closing}</p>
        <p className="rm-end">
          La Fréquence du Vivant — document de travail transmis à {roadmap.partnerName}. Diffusion
          restreinte.
        </p>
      </section>
    </div>,
    host,
  );
};

export default RoadmapPrintLayout;
