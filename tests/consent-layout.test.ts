import { test } from "node:test";
import assert from "node:assert/strict";
import { consentFormSchema, type ConsentFormSchema } from "../lib/schema";
import { composeClinicalMarkdown, fallbackProcedureContent } from "../lib/consent-template";
import {
  parseConsentMarkdown, parseInline, splitField, isFieldList, groupIntoUnits, buildConsentMeta, footerLabel,
  inlineToPlain, type Block, type ListItem,
} from "../lib/consent-layout";

type ListBlock = Extract<Block, { items: ListItem[] }>;

function sampleInput(over: object = {}): ConsentFormSchema {
  return consentFormSchema.parse({
    patient: { patientName: "Anita Deshmukh", age: "42", sex: "Female", hospitalOpdIpdNo: "IPD-1", aadhaarLast4: "7391", insuranceProvider: "", insurancePolicyNo: "", patientCompetent: true, guardianName: "", guardianRelationship: "" },
    clinical: { doctorName: "Rao", doctorRegistrationNo: "KMC-1", hospitalName: "Apollo", hospitalAddress: "Bangalore", diagnosis: "Gallstones", procedureName: "Laparoscopic Cholecystectomy", procedureDate: "2026-12-01", consentType: "surgical", counselingLanguage: "English", specificRisks: "Bile duct injury; bleeding", alternatives: "Observation", additionalNotes: "", edarVictimId: "", tmsPatientId: "", ...over },
    clauses: { anaesthesia: true, bloodTransfusion: true, tissueDisposal: true, photographyAcademicUse: false },
    languageLevel: "standard", includeWitnessBlock: true, includeGuardianBlock: false,
  });
}
const composed = () => { const i = sampleInput(); return composeClinicalMarkdown(i, fallbackProcedureContent(i)); };
const types = (b: Block[]) => b.map((x) => x.type);

test("a composed form parses into 4 sections, 3 declarations and 3 quote blocks", () => {
  const blocks = parseConsentMarkdown(composed());
  assert.equal(blocks.filter((b) => b.type === "h2").length, 4);
  assert.equal(blocks.filter((b) => b.type === "h3").length, 3);
  assert.equal(blocks.filter((b) => b.type === "quote").length, 3);
  assert.ok(!blocks.some((b) => b.type === "p" && /^>/.test(inlineToPlain(b.inline))), "no literal '>' may survive");
});

test("nested bullets keep their nesting", () => {
  const blocks = parseConsentMarkdown("- **Risks:**\n  * one\n  * two\n- **Other:** x\n");
  assert.equal(blocks.length, 1);
  const ul = blocks[0] as ListBlock;
  assert.equal(ul.items.length, 2);
  assert.equal(ul.items[0].children.length, 2);
  assert.equal(inlineToPlain(ul.items[0].children[1].inline), "two");
  assert.equal(ul.items[1].children.length, 0);
});

test("deeper nesting and returning to the top level", () => {
  const blocks = parseConsentMarkdown("- A\n  - B\n    - C\n- D\n");
  const ul = blocks[0] as ListBlock;
  assert.equal(ul.items.length, 2);
  assert.equal(ul.items[0].children[0].children[0].inline[0].text, "C");
});

test("inline bold and italic, and html / backticks are stripped", () => {
  const i = parseInline("A **bold** and *italic* <b>x</b> `code`<br>end");
  assert.deepEqual(i.filter((x) => x.bold).map((x) => x.text), ["bold"]);
  assert.deepEqual(i.filter((x) => x.italic).map((x) => x.text), ["italic"]);
  assert.ok(!inlineToPlain(i).includes("<"));
  assert.ok(!inlineToPlain(i).includes("`"));
});

test("signature blanks are not mistaken for italics", () => {
  const i = parseInline("**Signature:** ___________________________");
  assert.ok(inlineToPlain(i).includes("___________________________"));
  assert.ok(!i.some((x) => x.italic));
});

test("signature, name and date rows are detected as fields", () => {
  const blocks = parseConsentMarkdown("- **Signature:** ___________________________\n- **Name of Signatory:** Anita (Self)\n- **Date & Time:** ____/____/________  ____:____ IST\n");
  const ul = blocks[0] as ListBlock;
  assert.equal(isFieldList(ul.items), true);
  assert.equal(splitField(ul.items[0])!.kind, "blank");
  const name = splitField(ul.items[1])!;
  assert.equal(name.kind, "value");
  assert.equal(inlineToPlain(name.value).trim(), "Anita (Self)");
  assert.equal(splitField(ul.items[2])!.kind, "datetime");
});

test("an ordinary bullet list is not a field list", () => {
  const ul = parseConsentMarkdown("- **Counselling:** The procedure was explained.\n- **Capacity:** Adult.\n")[0] as ListBlock;
  assert.equal(isFieldList(ul.items), false);
});

test("markdown tables and one-line tables from older forms are parsed", () => {
  const t = parseConsentMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n")[0] as Extract<Block, { type: "table" }>;
  assert.equal(t.type, "table");
  assert.equal(t.header.length, 2);
  assert.equal(t.rows.length, 2);
  const joined = parseConsentMarkdown("| A | B | | --- | --- | | 1 | 2 |")[0];
  assert.equal(joined.type, "table");
});

test("a lone underscore line is a signature line, a dash line is a rule, a top title is dropped", () => {
  assert.deepEqual(types(parseConsentMarkdown("# Title\n\n___________________________\n\n---\n\ntext")), ["sigline", "hr", "p"]);
});

test("consecutive lines merge into one paragraph", () => {
  const b = parseConsentMarkdown("first line\nsecond line\n\nnew para");
  assert.equal(b.length, 2);
  assert.equal(inlineToPlain((b[0] as any).inline), "first line second line");
});

test("units never separate a heading from its content, and the whole declarations section stays together", () => {
  const units = groupIntoUnits(parseConsentMarkdown(composed()));
  for (const u of units) {
    assert.ok(!(u.length === 1 && (u[0].type === "h2" || u[0].type === "h3")), "a heading must not be alone in a unit");
  }
  const decl = units.filter((u) => u.some((b) => b.type === "h3"));
  assert.equal(decl.length, 1, "all three declarations live in one unit (one signature page)");
  assert.deepEqual(types(decl[0]), ["h2", "h3", "quote", "ul", "h3", "quote", "ul", "h3", "quote", "ul"]);
});

test("a section's first list item stays with its heading; the rest flow on", () => {
  const units = groupIntoUnits(parseConsentMarkdown("## 1. X\n- a\n- b\n- c\n"));
  assert.equal(units.length, 3);
  assert.deepEqual(types(units[0]), ["h2", "ul"]);
  assert.equal((units[0][1] as any).items.length, 1);
});

test("header metadata for a clinical form", () => {
  const m = buildConsentMeta({ formData: sampleInput(), consentId: "AP-1", timestamp: "13 Nov 2026" });
  assert.equal(m.hospitalName, "Apollo");
  assert.equal(m.identity.length, 8);
  assert.ok(m.identity.some((c) => c.label === "Aadhaar (Last 4)" && c.value === "XXXX-XXXX-7391"));
  assert.match(m.title, /LAPAROSCOPIC CHOLECYSTECTOMY PROCEDURE/);
  assert.equal(footerLabel(m), "Consent ID: AP-1  |  Patient: Anita Deshmukh");
  assert.equal(m.isRtl, false);
});

test("header metadata works without form data and flags right-to-left languages", () => {
  const m = buildConsentMeta({ consentId: "X-9", hospitalName: "City Hospital", language: "Urdu" });
  assert.equal(m.hospitalName, "City Hospital");
  assert.equal(m.identity.length, 0);
  assert.equal(m.isRtl, true);
  assert.equal(footerLabel(m), "Consent ID: X-9");
});

test("header metadata for research uses participant wording", () => {
  const m = buildConsentMeta({ isResearch: true, consentId: "R-1", formData: { study: { institutionName: "SRPMC", institutionAddress: "BLR", studyTitle: "SSI Study", principalInvestigator: "Dr A", department: "Surgery", counselingLanguage: "Hindi" }, participant: { participantName: "Ravi", participantId: "R1", age: "30", sex: "Male" } } });
  assert.match(m.title, /RESEARCH: SSI STUDY/);
  assert.equal(footerLabel(m), "Consent ID: R-1  |  Participant: Ravi");
  assert.ok(m.identity.find((c) => c.label === "Study Title")!.wide);
});
