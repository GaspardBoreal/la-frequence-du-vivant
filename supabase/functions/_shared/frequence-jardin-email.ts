// Gabarit d'email « Fréquence Jardin » — styles inline, sobres, papier crème + vert profond.

const VERT = '#0d6b58';
const ENCRE = '#1f2421';
const CREME = '#faf8f3';
const TRAIT = '#e2e0d8';
const GRIS = '#6b7280';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const para = (s: string) =>
  esc(s)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;line-height:1.6;">${p.replace(/\n/g, '<br />')}</p>`)
    .join('');

export interface CarnetEmailData {
  message: string;
  proprieteNom: string;
  tourTitre: string;
  dateTour: string; // déjà formatée en français
  dureeMin?: number | null;
  saison?: string | null;
  gestes: string[];
  expediteur: string;
  siteUrl: string;
  pieceJointe: string;
}

export function renderCarnetEmailHtml(d: CarnetEmailData): string {
  const gestes = d.gestes.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${d.gestes
        .map(
          (g) =>
            `<tr><td width="16" valign="top" style="color:${VERT};font-size:14px;line-height:1.6;">·</td><td style="font-size:14px;line-height:1.6;color:${ENCRE};">${esc(
              g,
            )}</td></tr>`,
        )
        .join('')}</table>`
    : `<p style="margin:0;font-size:14px;color:${GRIS};">Aucun geste retenu pour ce tour.</p>`;

  const meta = [d.dateTour, d.dureeMin ? `${d.dureeMin} min` : null, d.saison || null]
    .filter(Boolean)
    .map((s) => esc(String(s)))
    .join(' · ');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(d.tourTitre)}</title></head>
<body style="margin:0;padding:0;background:${CREME};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREME};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${TRAIT};border-radius:12px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:${ENCRE};">
    <tr><td style="background:${VERT};padding:18px 24px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#cfe6df;">Fréquence Jardin</div>
      <div style="font-size:19px;color:#ffffff;margin-top:4px;">${esc(d.tourTitre)}</div>
      <div style="font-size:12px;color:#cfe6df;margin-top:3px;">${esc(d.proprieteNom)}${meta ? ` — ${meta}` : ''}</div>
    </td></tr>

    <tr><td style="padding:22px 24px 4px;font-size:15px;color:${ENCRE};font-family:Helvetica,Arial,sans-serif;">
      ${para(d.message)}
    </td></tr>

    <tr><td style="padding:6px 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREME};border:1px solid ${TRAIT};border-radius:10px;">
        <tr><td style="padding:16px 18px;font-family:Helvetica,Arial,sans-serif;">
          <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${VERT};margin-bottom:8px;">Les gestes retenus</div>
          ${gestes}
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:16px 24px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${GRIS};">
      Le carnet complet est joint à ce message : <strong style="color:${ENCRE};">${esc(d.pieceJointe)}</strong> — à imprimer, plier et annoter au crayon pendant le tour.
    </td></tr>

    <tr><td style="padding:22px 24px 24px;">
      <div style="border-top:1px solid ${TRAIT};padding-top:14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${GRIS};line-height:1.6;">
        Envoyé par ${esc(d.expediteur)} depuis <strong style="color:${VERT};">Fréquence Jardin</strong><br />
        <a href="${esc(d.siteUrl)}" style="color:${VERT};text-decoration:none;">La Fréquence du Vivant</a>
      </div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

export function renderCarnetEmailText(d: CarnetEmailData): string {
  const meta = [d.dateTour, d.dureeMin ? `${d.dureeMin} min` : null, d.saison || null].filter(Boolean).join(' · ');
  return [
    `FRÉQUENCE JARDIN`,
    `${d.tourTitre} — ${d.proprieteNom}${meta ? ` (${meta})` : ''}`,
    '',
    d.message,
    '',
    'Les gestes retenus :',
    ...(d.gestes.length ? d.gestes.map((g) => `- ${g}`) : ['- (aucun)']),
    '',
    `Le carnet complet est joint : ${d.pieceJointe}`,
    '',
    `Envoyé par ${d.expediteur} depuis Fréquence Jardin — ${d.siteUrl}`,
  ].join('\n');
}
