export type PdfDebugCharSummary = {
  // Existing “suspicious” buckets
  asciiControl: number;
  bidiControl: number;
  nonBmp: number;
  surrogates: number;

  // Invisible / typography chars that frequently slip through and are hard to spot
  zwsp: number; // U+200B
  zwnj: number; // U+200C
  zwj: number; // U+200D
  wordJoiner: number; // U+2060

  nbsp: number; // U+00A0
  narrowNbsp: number; // U+202F
  thinSpace: number; // U+2009
  hairSpace: number; // U+200A
  softHyphen: number; // U+00AD

  replacementChar: number; // U+FFFD

  // Common punctuation that sometimes breaks when fonts/glyph fallback misbehaves
  emDash: number; // U+2014
  enDash: number; // U+2013
  ellipsis: number; // U+2026

  // Decorative characters (lines, box drawing)
  boxDrawing: number; // U+2500..U+257F

  // Heuristic: longest run of “non-break” chars (potential unbreakable token)
  maxRunWithoutBreak: number;

  notable: Array<{
    label: string;
    codepoint: string;
    char: string;
    count: number;
  }>;
};

const cpHex = (cp: number) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

const isBreakChar = (ch: string): boolean => {
  // Treat common whitespace + punctuation as “break opportunities”.
  // Note: we also consider ZWSP as a break.
  if (ch === '\u200B') return true;
  return /[\s\-–—.,;:!?/\\()\[\]{}«»“”"'’]/.test(ch);
};

export const summarizePdfDebugChars = (text: string): PdfDebugCharSummary => {
  const summary: Omit<PdfDebugCharSummary, 'notable'> & { notable: PdfDebugCharSummary['notable'] } = {
    asciiControl: 0,
    bidiControl: 0,
    nonBmp: 0,
    surrogates: 0,

    zwsp: 0,
    zwnj: 0,
    zwj: 0,
    wordJoiner: 0,

    nbsp: 0,
    narrowNbsp: 0,
    thinSpace: 0,
    hairSpace: 0,
    softHyphen: 0,

    replacementChar: 0,

    emDash: 0,
    enDash: 0,
    ellipsis: 0,

    boxDrawing: 0,

    maxRunWithoutBreak: 0,
    notable: [],
  };

  const counts = new Map<number, number>();

  let run = 0;
  for (const ch of text || '') {
    const cp = ch.codePointAt(0) ?? 0;
    counts.set(cp, (counts.get(cp) ?? 0) + 1);

    // Match previous suspicious buckets (same logic as PdfExportPanel)
    if (cp < 0x20 || cp === 0x7f) {
      if (cp !== 0x0a && cp !== 0x09 && cp !== 0x0d) summary.asciiControl++;
    }

    const isBidi =
      cp === 0x200e ||
      cp === 0x200f ||
      cp === 0x061c ||
      (cp >= 0x202a && cp <= 0x202e) ||
      (cp >= 0x2066 && cp <= 0x2069) ||
      cp === 0xfeff;
    if (isBidi) summary.bidiControl++;
    if (cp > 0xffff) summary.nonBmp++;
    if (cp >= 0xd800 && cp <= 0xdfff) summary.surrogates++;

    // Invisible / typographic suspects
    if (cp === 0x200b) summary.zwsp++;
    if (cp === 0x200c) summary.zwnj++;
    if (cp === 0x200d) summary.zwj++;
    if (cp === 0x2060) summary.wordJoiner++;
    if (cp === 0x00a0) summary.nbsp++;
    if (cp === 0x202f) summary.narrowNbsp++;
    if (cp === 0x2009) summary.thinSpace++;
    if (cp === 0x200a) summary.hairSpace++;
    if (cp === 0x00ad) summary.softHyphen++;
    if (cp === 0xfffd) summary.replacementChar++;

    // Common punctuation
    if (cp === 0x2014) summary.emDash++;
    if (cp === 0x2013) summary.enDash++;
    if (cp === 0x2026) summary.ellipsis++;

    // Decorative
    if (cp >= 0x2500 && cp <= 0x257f) summary.boxDrawing++;

    // Max run heuristic
    if (isBreakChar(ch)) {
      run = 0;
    } else {
      run += 1;
      if (run > summary.maxRunWithoutBreak) summary.maxRunWithoutBreak = run;
    }
  }

  // Build a concise notable list (only the chars we explicitly track + if present)
  const notableSpecs: Array<{ label: string; cp: number }> = [
    { label: 'ZWSP', cp: 0x200b },
    { label: 'ZWNJ', cp: 0x200c },
    { label: 'ZWJ', cp: 0x200d },
    { label: 'WORD_JOINER', cp: 0x2060 },
    { label: 'NBSP', cp: 0x00a0 },
    { label: 'NNBSP', cp: 0x202f },
    { label: 'THIN_SPACE', cp: 0x2009 },
    { label: 'HAIR_SPACE', cp: 0x200a },
    { label: 'SOFT_HYPHEN', cp: 0x00ad },
    { label: 'REPLACEMENT_CHAR', cp: 0xfffd },
    { label: 'EM_DASH', cp: 0x2014 },
    { label: 'EN_DASH', cp: 0x2013 },
    { label: 'ELLIPSIS', cp: 0x2026 },
  ];

  summary.notable = notableSpecs
    .map(({ label, cp }) => {
      const count = counts.get(cp) ?? 0;
      return {
        label,
        codepoint: cpHex(cp),
        char: String.fromCharCode(cp),
        count,
      };
    })
    .filter((x) => x.count > 0);

  return summary;
};
