import { PERSONA_FALLBACK, type Persona } from './personas';

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

export type TileIcon =
  | 'tomate'
  | 'salade'
  | 'fruit'
  | 'herbe'
  | 'arbre'
  | 'fleur'
  | 'racine'
  | 'mare'
  | 'carre'
  | 'serre'
  | 'repas'
  | 'ruche';

/** Texte libre demandé quand une option précise est retenue. */
export interface OptionFollowUp {
  /** Clé de stockage dans `answers` (ex. `priorite_probleme`). */
  answerId: string;
  label: string;
  placeholder?: string;
  /** La réponse est indispensable pour valider l'écran. */
  required?: boolean;
  multiline?: boolean;
}

export interface OnboardingOption {
  value: string;
  label: string;
  hint?: string;
  image?: string;
  icon?: TileIcon;
  /** Précision en texte libre ouverte par ce choix. */
  followUp?: OptionFollowUp;
}

export type QuestionKind = 'single' | 'multi' | 'gallery' | 'tiles' | 'slider' | 'surface';

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  /** Phrase vivante affichée sous le grand chiffre. */
  describe: (value: number) => string;
}

export type Chapter = 'Vous' | 'Votre lieu' | 'Vos envies' | 'Vos moyens';
export const CHAPTERS: Chapter[] = ['Vous', 'Votre lieu', 'Vos envies', 'Vos moyens'];

/** Ce qu'une persona peut redéfinir sur une question. */
export interface QuestionVariant {
  title?: string;
  subtitle?: string;
  options?: OnboardingOption[];
  slider?: SliderConfig;
  optional?: boolean;
}

export interface OnboardingQuestion {
  id: string;
  /** Question posée, une seule par écran. */
  title: string;
  subtitle?: string;
  kind: QuestionKind;
  /** Chapitre affiché dans la barre de progression segmentée. */
  chapter: Chapter;
  /** Token sémantique servant d'accent unique à l'écran. */
  accent: string;
  options?: OnboardingOption[];
  slider?: SliderConfig;
  /** Deux curseurs de surface : total et surface encore disponible. */
  surface?: { totalId: string; freeId: string; max: number; default: number; freeDefault: number };
  /** L'écran peut être passé sans réponse. */
  optional?: boolean;
  /** Désactivée depuis l'admin : la question n'est plus posée. */
  disabled?: boolean;
  /** Personae qui voient la question. Absent = toutes. */
  personas?: Persona[];
  /** Libellés et choix propres à une persona. */
  variants?: Partial<Record<Persona, QuestionVariant>>;
  /** Branchement : l'écran n'est posé que si la condition est vraie. */
  when?: (answers: Answers, persona: Persona) => boolean;
}

/** Séquence complète, versionnée : le parcours devient une donnée. */
export interface OnboardingSequence {
  version: number;
  label: string;
  questions: OnboardingQuestion[];
}

/** Applique la surcharge de persona (avec chaîne de repli) à une question. */
export const resolveQuestion = (question: OnboardingQuestion, persona: Persona): OnboardingQuestion => {
  const chain = [persona, ...(PERSONA_FALLBACK[persona] ?? [])];
  const variant = chain.map((p) => question.variants?.[p]).find((v): v is QuestionVariant => Boolean(v));
  if (!variant) return question;
  return {
    ...question,
    title: variant.title ?? question.title,
    subtitle: variant.subtitle ?? question.subtitle,
    options: variant.options ?? question.options,
    slider: variant.slider ?? question.slider,
    optional: variant.optional ?? question.optional,
  };
};

/** Écrans réellement posés compte tenu de la persona et des branchements. */
export const buildSequence = (
  questions: OnboardingQuestion[],
  answers: Answers,
  persona: Persona,
): OnboardingQuestion[] =>
  questions
    .filter((q) => !q.disabled)
    .filter((q) => !q.personas || q.personas.includes(persona))
    .filter((q) => !q.when || q.when(answers, persona))
    .map((q) => resolveQuestion(q, persona));

/** Avancement par chapitre, pour la barre segmentée. */
export const chapterSegments = (questions: OnboardingQuestion[], index: number) =>
  CHAPTERS.map((chapter) => {
    const items = questions.filter((q) => q.chapter === chapter);
    if (items.length === 0) return { chapter, fill: 0 };
    const done = items.filter((q) => questions.indexOf(q) < index).length;
    const current = questions[index]?.chapter === chapter ? 0.5 : 0;
    return { chapter, fill: Math.min(1, (done + current) / items.length) };
  });
