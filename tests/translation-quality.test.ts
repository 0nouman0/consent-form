import { test } from "node:test";
import assert from "node:assert/strict";
import { assessTranslation, allowedEnglish, leakedWords } from "../lib/translation-quality";
import { buildTranslationPrompt } from "../lib/consent-template";

const EN = [
  "## 1. Procedure & Purpose",
  "- **Proposed Procedure:** Laparoscopic Cholecystectomy (Scheduled Date: 2026-12-01)",
  "- **Counselling:** The procedure was explained to the patient, and the patient confirmed that they understood it.",
  "## 2. Declarations",
  "### 2.1 Patient Declaration",
  '> "I confirm that the nature, purpose, risks and alternatives have been fully explained to me."',
  "- **Signature:** ___________________________",
  "- **Date & Time:** ____/____/________  ____:____ IST",
].join("\n");

const TELUGU_GOOD = [
  "## 1. ప్రక్రియ మరియు ఉద్దేశ్యం",
  "- **ప్రతిపాదిత ప్రక్రియ:** Laparoscopic Cholecystectomy (షెడ్యూల్ తేదీ: 2026-12-01)",
  "- **సలహా:** ప్రక్రియ రోగికి వివరించబడింది, మరియు రోగి దానిని అర్థం చేసుకున్నట్లు ధృవీకరించారు.",
  "## 2. ప్రకటనలు",
  "### 2.1 రోగి ప్రకటన",
  '> "ప్రక్రియ యొక్క స్వభావం, ఉద్దేశ్యం, ప్రమాదాలు మరియు ప్రత్యామ్నాయాలు నాకు పూర్తిగా వివరించబడ్డాయని నేను ధృవీకరిస్తున్నాను."',
  "- **సంతకం:** ___________________________",
  "- **తేదీ & సమయం:** ____/____/________  ____:____ IST",
].join("\n");

// headings translated, body left in English: exactly the failure measured on Telugu / Marathi / Gujarati
const TELUGU_LEAKY = [
  "## 1. ప్రక్రియ మరియు ఉద్దేశ్యం",
  "- **ప్రతిపాదిత ప్రక్రియ:** Laparoscopic Cholecystectomy (Scheduled Date: 2026-12-01)",
  "- **సలహా:** The procedure was explained to the patient, and the patient confirmed that they understood it fully.",
  "## 2. ప్రకటనలు",
  "### 2.1 రోగి ప్రకటన",
  '> "I confirm that the nature, purpose, risks and alternatives have been fully explained to me in a language I understand."',
  "- **సంతకం:** ___________________________",
  "- **తేదీ & సమయం:** ____/____/________  ____:____ IST",
].join("\n");

const PROTECTED = ["Laparoscopic Cholecystectomy", "Anita Deshmukh"];

test("a complete Telugu translation passes", () => {
  const a = assessTranslation(EN, TELUGU_GOOD, "Telugu", PROTECTED);
  assert.deepEqual(a.issues, []);
  assert.equal(a.ok, true);
  assert.ok(a.scriptShare > 0.9);
  assert.ok(a.latinLeak < 0.06);
});

test("a translation that left the body in English is rejected", () => {
  const a = assessTranslation(EN, TELUGU_LEAKY, "Telugu", PROTECTED);
  assert.equal(a.ok, false);
  assert.ok(a.latinLeak > 0.2, `leak ${a.latinLeak}`);
  assert.ok(a.issues.some((i) => /still in English/.test(i)));
});

test("protected names and procedure terms are not counted as untranslated", () => {
  const allowed = allowedEnglish(PROTECTED);
  assert.deepEqual(leakedWords("ప్రక్రియ Laparoscopic Cholecystectomy Anita BNS IST", allowed), []);
  assert.deepEqual(leakedWords("ప్రక్రియ Hospital admission form", allowed), ["Hospital", "admission", "form"]);
});

test("text in the wrong script is rejected (Hindi returned for Telugu)", () => {
  const hindi = TELUGU_GOOD.replace(/[ఀ-౿]+/g, "हिंदी");
  const a = assessTranslation(EN, hindi, "Telugu", PROTECTED);
  assert.equal(a.ok, false);
  assert.ok(a.issues.some((i) => /script/.test(i)));
});

test("structure changes are caught: lost heading, lost signature line, lost date field", () => {
  const noHeading = TELUGU_GOOD.replace("### 2.1 రోగి ప్రకటన\n", "");
  assert.ok(assessTranslation(EN, noHeading, "Telugu", PROTECTED).issues.some((i) => /heading count/.test(i)));
  const noSig = TELUGU_GOOD.replace("- **సంతకం:** ___________________________\n", "");
  assert.ok(assessTranslation(EN, noSig, "Telugu", PROTECTED).issues.some((i) => /signature lines/.test(i)));
  const noDate = TELUGU_GOOD.replace("____/____/________  ____:____ IST", "తేదీ");
  assert.ok(assessTranslation(EN, noDate, "Telugu", PROTECTED).issues.some((i) => /date\/time/.test(i)));
});

test("empty or whitespace output is rejected", () => {
  assert.equal(assessTranslation(EN, "   ", "Hindi", PROTECTED).ok, false);
});

test("a language without a configured script is not failed on script share", () => {
  const a = assessTranslation(EN, TELUGU_GOOD, "Klingon", PROTECTED);
  assert.equal(a.scriptShare, 1);
});

test("the strict retry prompt is stronger and the normal one already demands completeness", () => {
  const normal = buildTranslationPrompt(EN, "Marathi");
  const strict = buildTranslationPrompt(EN, "Marathi", { strict: true });
  assert.match(normal.system, /COMPLETENESS IS MANDATORY/);
  assert.match(normal.system, /every sentence, bullet item, heading and field label/);
  assert.ok(!/PREVIOUS ANSWER LEFT ENGLISH/.test(normal.system));
  assert.match(strict.system, /PREVIOUS ANSWER LEFT ENGLISH TEXT UNTRANSLATED/);
  assert.equal(strict.user, EN, "the form itself is never altered");
});
