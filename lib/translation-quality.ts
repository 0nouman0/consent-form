/**
 * Quality gate for machine-translated consent forms.
 *
 * Measured in testing: for some languages (Telugu 53%, Marathi 24%, Gujarati 21% of words) the model
 * returned headings in the right language but left whole clauses in English. A patient must never be
 * handed that as "their language" copy, so every translation is checked before it is released.
 */

export interface TranslationAssessment {
  ok: boolean;
  issues: string[];
  /** Share of words that are untranslated English (0..1). */
  latinLeak: number;
  /** Share of letters written in the target language's script (0..1). */
  scriptShare: number;
}

const SCRIPT: Record<string, RegExp> = {
  Hindi: /[ऀ-ॿ]/g,
  Marathi: /[ऀ-ॿ]/g,
  Bengali: /[ঀ-৿]/g,
  Punjabi: /[਀-੿]/g,
  Gujarati: /[઀-૿]/g,
  Odia: /[଀-୿]/g,
  Tamil: /[஀-௿]/g,
  Telugu: /[ఀ-౿]/g,
  Kannada: /[ಀ-೿]/g,
  Malayalam: /[ഀ-ൿ]/g,
  Urdu: /[؀-ۿݐ-ݿ]/g,
};

/** English words that are allowed to remain (abbreviations, fixed labels). Compared lower-case. */
const ALWAYS_ALLOWED = ["bns", "icmr", "morth", "ist", "opd", "ipd", "aadhaar", "reg", "self", "consumer", "protection", "act", "xxxx", "dr", "tms", "edar"];

export const MAX_LATIN_LEAK = 0.06;
export const MIN_SCRIPT_SHARE = 0.6;

const words = (s: string, re: RegExp): string[] => s.match(re) ?? [];

export function allowedEnglish(protectedTerms: string[]): Set<string> {
  const set = new Set(ALWAYS_ALLOWED);
  for (const t of protectedTerms) for (const w of words(t, /[A-Za-z]{2,}/g)) set.add(w.toLowerCase());
  return set;
}

/** English words (4+ letters) in the translation that are neither protected terms nor allowed abbreviations. */
export function leakedWords(translated: string, allowed: Set<string>): string[] {
  return words(translated, /[A-Za-z]{4,}/g).filter((w) => !allowed.has(w.toLowerCase()));
}

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

export function assessTranslation(
  english: string,
  translated: string,
  language: string,
  protectedTerms: string[] = []
): TranslationAssessment {
  const issues: string[] = [];
  const t = translated.trim();

  if (!t) return { ok: false, issues: ["empty translation"], latinLeak: 1, scriptShare: 0 };

  const allowed = allowedEnglish(protectedTerms);
  const allWords = Math.max(1, count(t, /[\p{L}\p{N}]+/gu));
  const latinLeak = leakedWords(t, allowed).length / allWords;

  const scriptRe = SCRIPT[language];
  const targetLetters = scriptRe ? count(t, scriptRe) : 0;
  // only English that is genuinely untranslated counts against the script share (names, the procedure and
  // abbreviations legitimately stay in Latin script)
  const latinLetters = leakedWords(t, allowed).join("").length;
  const scriptShare = scriptRe ? targetLetters / Math.max(1, targetLetters + latinLetters) : 1;

  if (latinLeak > MAX_LATIN_LEAK) issues.push(`${Math.round(latinLeak * 100)}% of the words are still in English`);
  if (scriptRe && scriptShare < MIN_SCRIPT_SHARE) issues.push(`only ${Math.round(scriptShare * 100)}% of the letters are in ${language} script`);

  // structure must survive translation exactly
  const heads = (s: string) => count(s, /^#{2,6}\s/gm);
  if (heads(english) !== heads(translated)) issues.push(`heading count changed (${heads(english)} → ${heads(translated)})`);
  if (count(english, /_{6,}/g) !== count(translated, /_{6,}/g)) issues.push("signature lines changed");
  if (count(english, /_{2,}\s*\/\s*_{2,}\s*\/\s*_{2,}/g) !== count(translated, /_{2,}\s*\/\s*_{2,}\s*\/\s*_{2,}/g)) issues.push("date/time fields changed");
  const bullets = (s: string) => count(s, /^\s*[-*]\s+/gm);
  if (Math.abs(bullets(english) - bullets(translated)) > 2) issues.push(`bullet count changed (${bullets(english)} → ${bullets(translated)})`);

  return { ok: issues.length === 0, issues, latinLeak, scriptShare };
}
