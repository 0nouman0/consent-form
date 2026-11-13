/**
 * Shared layout model for every consent-form output (print, PDF, Word).
 *
 * One parser turns the form markdown into typed blocks, so all three outputs contain exactly the same
 * content. Renderers (consent-html.ts for print/PDF, docx-gen.ts for Word) only decide how to draw it.
 * Pure functions, no DOM: safe to unit-test and to run anywhere.
 */

/* ───────────────────────────── types ───────────────────────────── */

export interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ListItem {
  inline: Inline[];
  children: ListItem[];
}

export type Block =
  | { type: "h2" | "h3"; inline: Inline[] }
  | { type: "p"; inline: Inline[] }
  | { type: "quote"; inline: Inline[] }
  | { type: "ul" | "ol"; items: ListItem[] }
  | { type: "sigline" }
  | { type: "hr" }
  | { type: "table"; header: Inline[][]; rows: Inline[][][] };

export interface ConsentMeta {
  isResearch: boolean;
  consentId: string;
  timestamp: string;
  hospitalName: string;
  hospitalAddress: string;
  /** Text of the dark title banner. */
  title: string;
  /** Cells of the identification grid. `wide` cells span two columns. */
  identity: Array<{ label: string; value: string; wide?: boolean }>;
  /** Patient or participant name, repeated in every page footer. */
  subjectName: string;
  language: string;
  isRtl: boolean;
}

/* ───────────────────────────── inline ───────────────────────────── */

/** Strip HTML and markdown noise that must never reach a printed form. */
function cleanInline(s: string): string {
  return s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/`/g, "");
}

export function parseInline(raw: string): Inline[] {
  const text = cleanInline(raw);
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**")) out.push({ text: tok.slice(2, -2), bold: true });
    else out.push({ text: tok.slice(1, -1), italic: true });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text }];
}

export const inlineToPlain = (inline: Inline[]): string => inline.map((i) => i.text).join("");

/* ───────────────────────────── block parser ───────────────────────────── */

const BLANK_RUN = /_{6,}/;
const LIST_RE = /^(\s*)([-*•]|\d+\.)\s+(.*)$/;

/** Repair models that emit a whole markdown table on ONE line (`| a | b | | --- | --- | | 1 | 2 |`). */
function repairTables(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const t = line.trim();
      // only touch lines that are a table and contain row boundaries written as "| |" on the same line
      if (t.startsWith("|") && /\|[ \t]+\|/.test(t) && /-{3}/.test(t)) return t.replace(/\|[ \t]+\|/g, "|\n|");
      return line;
    })
    .join("\n");
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

export function parseConsentMarkdown(markdown: string): Block[] {
  const lines = repairTables(markdown.replace(/\r\n?/g, "\n")).split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", inline: parseInline(para.join(" ")) });
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) { flushPara(); i++; continue; }

    // top-level title is rendered by the document banner, never twice
    if (/^#\s/.test(t)) { flushPara(); i++; continue; }

    const h = /^(#{2,6})\s+(.*)$/.exec(t);
    if (h) {
      flushPara();
      blocks.push({ type: h[1].length === 2 ? "h2" : "h3", inline: parseInline(h[2]) });
      i++; continue;
    }

    if (/^_{10,}$/.test(t)) { flushPara(); blocks.push({ type: "sigline" }); i++; continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flushPara(); blocks.push({ type: "hr" }); i++; continue; }

    if (t.startsWith("|") && t.endsWith("|")) {
      flushPara();
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const body = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
      if (body.length) {
        blocks.push({
          type: "table",
          header: body[0].map(parseInline),
          rows: body.slice(1).map((r) => r.map(parseInline)),
        });
      }
      continue;
    }

    if (t.startsWith(">")) {
      flushPara();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        q.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", inline: parseInline(q.join(" ").replace(/^"|"$/g, "")) });
      continue;
    }

    if (LIST_RE.test(line)) {
      flushPara();
      const ordered = /^\s*\d+\./.test(line);
      const root: ListItem[] = [];
      const stack: Array<{ indent: number; items: ListItem[] }> = [{ indent: -1, items: root }];
      let lastItem: ListItem | null = null;

      while (i < lines.length) {
        const cur = lines[i];
        const m = LIST_RE.exec(cur);
        if (!m) {
          // continuation text of the previous item (indented, not blank, not a new block)
          if (cur.trim() && /^\s{2,}\S/.test(cur) && lastItem) {
            lastItem.inline = [...lastItem.inline, { text: " " }, ...parseInline(cur.trim())];
            i++; continue;
          }
          break;
        }
        const indent = m[1].replace(/\t/g, "  ").length;
        const item: ListItem = { inline: parseInline(m[3]), children: [] };

        // climb out of containers owned by items at the same or a deeper indent, then attach here
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
        stack[stack.length - 1].items.push(item);
        // lines indented deeper than this one become its children
        stack.push({ indent, items: item.children });
        lastItem = item;
        i++;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items: root });
      continue;
    }

    para.push(t);
    i++;
  }
  flushPara();
  return blocks;
}

/* ───────────────────────────── signature field detection ───────────────────────────── */

export interface FieldParts {
  label: Inline[];
  /** "blank" = a line to sign/write on; "datetime" = DD/MM/YYYY HH:MM template; otherwise a filled value. */
  kind: "blank" | "datetime" | "value";
  value: Inline[];
}

const DATETIME_RE = /_{2,}\s*\/\s*_{2,}\s*\/\s*_{2,}\s+_{2,}\s*:\s*_{2,}\s*IST/;

/** Split "**Label:** ____" style list items so renderers can draw real signature lines. */
export function splitField(item: ListItem): FieldParts | null {
  const plain = inlineToPlain(item.inline);
  if (!BLANK_RUN.test(plain) && !DATETIME_RE.test(plain)) {
    // a filled field of a signature list ("Name of Signatory: X") is still shown as label/value
    const first = item.inline[0];
    if (first?.bold && /:\s*$/.test(first.text)) {
      return { label: [first], kind: "value", value: item.inline.slice(1) };
    }
    return null;
  }
  const first = item.inline[0];
  const hasLabel = first?.bold && /:\s*$/.test(first.text);
  const label = hasLabel ? [first] : [];
  const rest = hasLabel ? item.inline.slice(1) : item.inline;
  const restPlain = inlineToPlain(rest);
  if (DATETIME_RE.test(restPlain)) return { label, kind: "datetime", value: [] };
  if (BLANK_RUN.test(restPlain)) return { label, kind: "blank", value: [] };
  return { label, kind: "value", value: rest };
}

/** A list is a "fields" list (signature/date rows) when it contains a blank or datetime row. */
export function isFieldList(items: ListItem[]): boolean {
  return items.some((it) => {
    const f = splitField(it);
    return f && (f.kind === "blank" || f.kind === "datetime");
  });
}

/* ───────────────────────────── page units (pagination) ───────────────────────────── */

/**
 * Group blocks into indivisible units so a page break can never separate a heading from its content
 * or split a signature declaration.
 *   - h2  + the unit that follows it
 *   - h3  + everything up to the next heading  (a complete signature declaration stays together)
 *   - each paragraph / list item / table / quote stands alone
 */
export function groupIntoUnits(blocks: Block[]): Block[][] {
  const units: Block[][] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "h3") {
      const unit: Block[] = [b];
      i++;
      while (i < blocks.length && blocks[i].type !== "h2" && blocks[i].type !== "h3") unit.push(blocks[i++]);
      units.push(unit);
    } else if (b.type === "h2") {
      const unit: Block[] = [b];
      i++;
      // A section made of sub-sections (the declarations) is kept together on ONE page, so a patient,
      // clinician and witness all sign on the same sheet and a declaration never lands apart from its signature.
      if (i < blocks.length && blocks[i].type === "h3") {
        while (i < blocks.length && blocks[i].type !== "h2") unit.push(blocks[i++]);
        units.push(unit);
        continue;
      }
      // keep the heading with the first piece of content that follows it
      if (i < blocks.length && blocks[i].type !== "h2" && blocks[i].type !== "h3") {
        const next = blocks[i];
        if (next.type === "ul" || next.type === "ol") {
          // heading stays with the first list item only; the remaining items flow on
          const [first, ...rest] = next.items;
          unit.push({ ...next, items: [first] });
          i++;
          units.push(unit);
          for (const item of rest) units.push([{ ...next, items: [item] }]);
          continue;
        }
        unit.push(next);
        i++;
      }
      units.push(unit);
    } else if (b.type === "ul" || b.type === "ol") {
      // a signature/date list is one unit; ordinary lists break between items
      if (isFieldList(b.items)) units.push([b]);
      else for (const item of b.items) units.push([{ ...b, items: [item] }]);
      i++;
    } else {
      units.push([b]);
      i++;
    }
  }
  return units;
}

/* ───────────────────────────── header metadata ───────────────────────────── */

const RTL_LANGUAGES = new Set(["Urdu"]);

const dash = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s || "—";
};

/** Build the masthead / banner / identification grid. Works with or without the original form data. */
export function buildConsentMeta(opts: {
  formData?: any;
  isResearch?: boolean;
  consentId: string;
  hospitalName?: string;
  timestamp?: string;
  language?: string;
}): ConsentMeta {
  const { formData, isResearch = false } = opts;
  const language = opts.language || (isResearch ? formData?.study?.counselingLanguage : formData?.clinical?.counselingLanguage) || "English";

  let hospitalName = opts.hospitalName || "";
  let hospitalAddress = "";
  let title = isResearch ? "INFORMED CONSENT FOR RESEARCH PARTICIPATION" : "INFORMED CONSENT FORM";
  let identity: ConsentMeta["identity"] = [];
  let subjectName = "";

  if (formData && isResearch) {
    const s = formData.study ?? {};
    const p = formData.participant ?? {};
    hospitalName = s.institutionName || hospitalName;
    hospitalAddress = s.institutionAddress || "";
    title = `INFORMED CONSENT FOR RESEARCH: ${String(s.studyTitle || "VOLUNTARY PARTICIPATION").toUpperCase()}`;
    subjectName = p.participantName || "";
    identity = [
      { label: "Participant Name", value: dash(p.participantName) },
      { label: "Participant ID", value: dash(p.participantId) },
      { label: "Age / Sex", value: `${dash(p.age)} Yrs / ${dash(p.sex)}` },
      { label: "Counselling Language", value: dash(s.counselingLanguage) },
      { label: "Study Title", value: dash(s.studyTitle), wide: true },
      { label: "Principal Investigator", value: dash(s.principalInvestigator) },
      { label: "Department", value: dash(s.department) },
    ];
  } else if (formData) {
    const p = formData.patient ?? {};
    const c = formData.clinical ?? {};
    hospitalName = c.hospitalName || hospitalName;
    hospitalAddress = c.hospitalAddress || "";
    title = `INFORMED CONSENT FORM — ${String(c.procedureName || "SURGICAL").toUpperCase()} PROCEDURE`;
    subjectName = p.patientName || "";
    identity = [
      { label: "Patient Name", value: dash(p.patientName) },
      { label: "Age / Sex", value: `${dash(p.age)} Yrs / ${dash(p.sex)}` },
      { label: "OPD / IPD No.", value: dash(p.hospitalOpdIpdNo) },
      { label: "Aadhaar (Last 4)", value: p.aadhaarLast4 ? `XXXX-XXXX-${p.aadhaarLast4}` : "—" },
      { label: "Treating Clinician", value: `Dr. ${dash(c.doctorName)}\nReg: ${dash(c.doctorRegistrationNo)}` },
      { label: "Proposed Procedure", value: dash(c.procedureName) },
      { label: "Scheduled Date", value: dash(c.procedureDate) },
      { label: "Counselling Language", value: dash(c.counselingLanguage) },
    ];
  }

  return {
    isResearch,
    consentId: opts.consentId,
    timestamp: opts.timestamp || "",
    hospitalName: hospitalName || "Medical Healthcare Institution",
    hospitalAddress,
    title,
    identity,
    subjectName,
    language,
    isRtl: RTL_LANGUAGES.has(language),
  };
}

/** Footer text shared by every output. ASCII-safe pieces first so it survives any font. */
export function footerLabel(meta: ConsentMeta): string {
  return meta.subjectName
    ? `Consent ID: ${meta.consentId}  |  ${meta.isResearch ? "Participant" : "Patient"}: ${meta.subjectName}`
    : `Consent ID: ${meta.consentId}`;
}
