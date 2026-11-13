import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { consentFormSchema, type ConsentFormSchema } from "../lib/schema";
import { composeClinicalMarkdown, fallbackProcedureContent } from "../lib/consent-template";
import { buildConsentMeta, parseConsentMarkdown } from "../lib/consent-layout";
import { buildPrintDocument, buildUnits, consentCss, PAGE_MM } from "../lib/consent-html";
import { consentDocxBuffer } from "../lib/docx-gen";

const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Gujarati", "Punjabi", "Odia", "Urdu"] as const;

function input(over: object = {}): ConsentFormSchema {
  return consentFormSchema.parse({
    patient: { patientName: "Anita Deshmukh", age: "42", sex: "Female", hospitalOpdIpdNo: "IPD-1", aadhaarLast4: "7391", insuranceProvider: "", insurancePolicyNo: "", patientCompetent: true, guardianName: "", guardianRelationship: "" },
    clinical: { doctorName: "Rao", doctorRegistrationNo: "KMC-12345", hospitalName: "Apollo Hospital", hospitalAddress: "Bangalore", diagnosis: "Gallstones", procedureName: "Laparoscopic Cholecystectomy", procedureDate: "2026-12-01", consentType: "surgical", counselingLanguage: "English", specificRisks: "Bile duct injury; bile leak; bleeding; infection; conversion to open surgery", alternatives: "Observation; diet", additionalNotes: "", edarVictimId: "", tmsPatientId: "", ...over },
    clauses: { anaesthesia: true, bloodTransfusion: true, tissueDisposal: true, photographyAcademicUse: false },
    languageLevel: "standard", includeWitnessBlock: true, includeGuardianBlock: false,
  });
}
const md = () => { const i = input(); return composeClinicalMarkdown(i, fallbackProcedureContent(i)); };
const params = (language: string) => ({ markdown: md(), consentId: "APOL-1", hospitalName: "Apollo Hospital", timestamp: "13/11/2026", formData: input(), language });

test("the refusal sentence is its own top-level line, not part of the alternatives list", () => {
  const blocks = parseConsentMarkdown(md());
  const items = blocks.flatMap((b) => (b.type === "ul" ? b.items : []));
  const refusal = items.find((it) => it.inline.some((x) => x.text.includes("Refusal or Delay")));
  assert.ok(refusal, "refusal must be a top-level item");
  const alt = items.find((it) => it.inline.some((x) => x.text.includes("Alternatives Discussed")))!;
  assert.ok(alt.children.every((c) => !c.inline.some((x) => x.text.includes("refusing"))));
});

test("print HTML is a complete A4 document with page footers and the shared stylesheet", () => {
  const html = buildPrintDocument(buildConsentMeta({ formData: input(), consentId: "APOL-1", timestamp: "t" }), md());
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /@page\s*\{[^}]*size: A4 portrait/);
  assert.ok(html.includes(`margin: ${PAGE_MM.top}mm`));
  assert.match(html, /counter\(page\) " of " counter\(pages\)/);
  assert.ok(html.includes("Consent ID: APOL-1  |  Patient: Anita Deshmukh"), "footer names the consent and the patient");
  assert.ok(html.includes(consentCss().slice(0, 40)));
  assert.ok(!html.includes("undefined") && !html.includes("[object"));
});

test("body text is 10pt and nothing in the stylesheet is below 7.5pt", () => {
  const css = consentCss();
  assert.match(css, /\.cg \{[^}]*font-size: 10pt/);
  const sizes = [...css.matchAll(/font-size:\s*([\d.]+)pt/g)].map((m) => Number(m[1]));
  assert.ok(Math.min(...sizes) >= 7.5, `smallest font ${Math.min(...sizes)}pt`);
});

test("bullets do not depend on the host page's CSS reset", () => {
  const css = consentCss();
  assert.match(css, /ul > li::before \{ content: "\\2022"/);
  assert.match(css, /list-style: none/);
});

test("form content is HTML-escaped (no injection through patient or clinician text)", () => {
  const evil = input({ procedureName: "Test <img src=x onerror=alert(1)> & more" });
  const html = buildPrintDocument(buildConsentMeta({ formData: evil, consentId: "X", timestamp: "t" }), composeClinicalMarkdown(evil, fallbackProcedureContent(evil)));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img") || !html.includes("onerror"));
});

test("every supported language gets the right language tag, and only Urdu is right-to-left", () => {
  for (const lang of LANGUAGES) {
    const meta = buildConsentMeta({ formData: input(), consentId: "X", timestamp: "t", language: lang });
    const units = buildUnits(meta, md());
    assert.equal(meta.isRtl, lang === "Urdu", lang);
    assert.ok(units.length >= 5, `${lang}: units`);
    const body = units.slice(1).join("");
    assert.match(body, lang === "Urdu" ? /dir="rtl"/ : /dir="ltr"/, lang);
    assert.match(body, /lang="[a-z]{2}"/, lang);
    if (lang !== "English") assert.ok(body.includes("cg-nl"), `${lang}: non-Latin spacing rules`);
    assert.ok(units[0].includes('dir="ltr"'), `${lang}: masthead stays left-to-right`);
  }
});

test("right-to-left copies isolate Latin bracketed references so they cannot wander", () => {
  const meta = buildConsentMeta({ formData: input(), consentId: "X", timestamp: "t", language: "Urdu" });
  const body = buildUnits(meta, "## 1. x\n- Consent applies (BNS §§24–30; Consumer Protection Act 2019). More text.\n").join("");
  assert.ok(body.includes("<bdi>(BNS §§24–30; Consumer Protection Act 2019)</bdi>"));
  const ltr = buildUnits(buildConsentMeta({ formData: input(), consentId: "X", timestamp: "t", language: "English" }), "## 1. x\n- (BNS §§24–30)\n").join("");
  assert.ok(!ltr.includes("<bdi>"), "left-to-right copies are untouched");
});

test("identity grid puts clinician and registration number on separate lines", () => {
  const meta = buildConsentMeta({ formData: input(), consentId: "X", timestamp: "t" });
  const cell = meta.identity.find((c) => c.label === "Treating Clinician")!;
  assert.equal(cell.value, "Dr. Rao\nReg: KMC-12345");
});

test("a Word file is produced for every language and is a valid package containing the form", async () => {
  for (const lang of LANGUAGES) {
    const buf = await consentDocxBuffer(params(lang));
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.file("word/document.xml")!.async("string");
    assert.ok(doc.includes("Apollo Hospital"), `${lang}: masthead`);
    assert.ok(doc.includes("Laparoscopic Cholecystectomy"), `${lang}: procedure`);
    assert.ok(/<w:pgSz [^>]*w:w="11906"[^>]*w:h="16838"/.test(doc), `${lang}: A4 page`);
    assert.ok(!doc.includes("&gt; "), `${lang}: no literal quote markers`);
    if (lang === "Urdu") assert.ok(doc.includes("<w:bidi"), "Urdu paragraphs are marked bidirectional");
    else assert.ok(!doc.includes("<w:bidi"), `${lang}: not bidirectional`);
  }
});

test("Word output has a footer with the consent id, patient and page numbering", async () => {
  const zip = await JSZip.loadAsync(await consentDocxBuffer(params("English")));
  const footerName = Object.keys(zip.files).find((n) => /word\/footer\d*\.xml/.test(n))!;
  const footer = await zip.file(footerName)!.async("string");
  assert.ok(footer.includes("Consent ID: APOL-1"));
  assert.ok(footer.includes("Anita Deshmukh"));
  assert.ok(/PAGE/.test(footer) && /NUMPAGES/.test(footer), "page X of Y fields");
});

test("Word body text is at least 10pt and uses real list numbering", async () => {
  const zip = await JSZip.loadAsync(await consentDocxBuffer(params("English")));
  const doc = await zip.file("word/document.xml")!.async("string");
  assert.ok(/<w:sz w:val="20"\/>/.test(doc), "10pt body runs");
  assert.ok(doc.includes("<w:numPr>"), "bullets use Word list numbering, not typed characters");
  const small = [...doc.matchAll(/<w:sz w:val="(\d+)"\/>/g)].map((m) => Number(m[1]));
  assert.ok(Math.min(...small) >= 15, `smallest run ${Math.min(...small) / 2}pt`);
});
