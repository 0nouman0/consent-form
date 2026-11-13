/**
 * HTML + CSS renderer for the printed / PDF consent form.
 *
 * One stylesheet, one set of typography rules (10pt body on A4) used by BOTH print and PDF so they
 * always match. Content comes from the shared parser in consent-layout.ts.
 */
import {
  type Block, type Inline, type ListItem, type ConsentMeta,
  parseConsentMarkdown, groupIntoUnits, splitField, isFieldList, footerLabel, inlineToPlain,
} from "./consent-layout";

/** A4 geometry shared by print @page and PDF pagination (millimetres). */
export const PAGE_MM = { width: 210, height: 297, top: 14, bottom: 18, side: 16 } as const;

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escape a value for use inside a CSS string literal. */
const cssString = (s: string): string => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");

const FONT_STACK =
  `"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", ` +
  `"Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Bengali", "Noto Sans Gujarati", ` +
  `"Noto Sans Gurmukhi", "Noto Sans Oriya", "Nirmala UI", "Mangal", "Latha", "Gautami", "Tunga", "Kartika", ` +
  `"Shruti", "Raavi", "Vrinda", "Kalinga", "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", sans-serif`;

/* ───────────────────────────── CSS ───────────────────────────── */

export function consentCss(): string {
  return `
.cg { font-family: ${FONT_STACK}; font-size: 10pt; line-height: 1.45; color: #111827; background: #fff;
      -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cg *, .cg *::before, .cg *::after { box-sizing: border-box; }
.cg-unit { display: flow-root; break-inside: avoid; page-break-inside: avoid; }

/* masthead */
.cg-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 18pt;
           padding-bottom: 8pt; border-bottom: 1pt solid #cbd5e1; margin-bottom: 10pt; }
.cg-hosp { font-size: 15pt; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; }
.cg-addr { font-size: 9pt; color: #64748b; margin-top: 2pt; line-height: 1.4; }
.cg-ids { text-align: right; font-size: 8.5pt; color: #64748b; line-height: 1.7; white-space: nowrap; }
.cg-ids b { color: #111827; font-weight: 600; font-family: Consolas, "SFMono-Regular", Menlo, monospace; }

/* title banner */
.cg-banner { background: #1e293b; color: #fff; text-align: center; font-weight: 700; font-size: 10.5pt;
             letter-spacing: 0.05em; line-height: 1.35; text-transform: uppercase; padding: 7pt 14pt;
             border-radius: 3pt; margin-bottom: 10pt; }

/* identification grid */
.cg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #cbd5e1;
           border: 1px solid #cbd5e1; border-radius: 3pt; overflow: hidden; margin-bottom: 4pt; }
.cg-cell { background: #fff; padding: 5pt 8pt; min-width: 0; }
.cg-cell.wide { grid-column: span 2; }
.cg-cell-l { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; line-height: 1.3; }
.cg-cell-v { font-size: 9.5pt; font-weight: 600; line-height: 1.35; overflow-wrap: break-word; white-space: pre-line; }

/* body */
.cg h2 { font-size: 11pt; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.3;
         margin: 12pt 0 5pt; padding: 3.5pt 8pt; background: #f1f5f9; border-inline-start: 3pt solid #1e293b; }
.cg h3 { font-size: 10pt; font-weight: 700; line-height: 1.35; margin: 0 0 3pt; padding-top: 9pt; color: #1f2937; }
.cg p { margin: 0 0 5pt; }
.cg b, .cg strong { font-weight: 700; }
.cg blockquote { margin: 3pt 0 6pt; padding: 5pt 10pt; border-inline-start: 2.5pt solid #94a3b8; background: #f8fafc;
                 font-style: italic; font-size: 9.8pt; color: #334155; line-height: 1.5; }
.cg hr { border: 0; border-top: 1pt solid #cbd5e1; margin: 8pt 0; }

/* lists: drawn with pseudo-elements so they never depend on the host page's CSS reset (Tailwind removes bullets) */
.cg ul, .cg ol { margin: 0 0 5pt; padding: 0; list-style: none; }
.cg ul > li { position: relative; margin: 0 0 2.5pt; padding-inline-start: 13pt; }
.cg ul > li::before { content: "\\2022"; position: absolute; inset-inline-start: 2pt; top: 0; color: #475569; }
.cg li > ul { margin: 2pt 0 1pt; font-size: 9.8pt; }
.cg li > ul > li::before { content: "\\2013"; }
.cg ol { list-style: decimal; padding-inline-start: 17pt; }
.cg ol > li { margin: 0 0 2.5pt; padding-inline-start: 2pt; }
/* short nested items (risks, alternatives) flow in two columns to save space */
.cg ul.cg-cols { display: grid; grid-template-columns: 1fr 1fr; column-gap: 16pt; }

/* tables (older forms) */
.cg table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 9.5pt; }
.cg th { background: #f1f5f9; font-weight: 700; text-align: start; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.04em; }
.cg th, .cg td { border: 1px solid #cbd5e1; padding: 4pt 6pt; vertical-align: top; }

/* signature / date rows */
.cg-fields { margin: 7pt 0 1pt; }
.cg-row { display: flex; align-items: flex-end; gap: 8pt; margin: 0 0 8pt; min-height: 16pt; }
.cg-lab { flex: 0 0 38%; font-weight: 700; font-size: 9.5pt; line-height: 1.3; }
.cg-line { flex: 1 1 auto; border-bottom: 1px solid #111827; height: 16pt; }
.cg-val { flex: 1 1 auto; border-bottom: 1px solid #e2e8f0; padding-bottom: 1pt; }
.cg-dt { display: inline-flex; align-items: flex-end; gap: 3pt; direction: ltr; unicode-bidi: isolate; }
.cg-b { display: inline-block; border-bottom: 1px solid #111827; height: 16pt; }
.cg-signline { border-bottom: 1px solid #111827; height: 24pt; margin: 6pt 0; }

/* translated copies: letter-spacing and capitals break joined / conjunct scripts (Arabic, Indic) */
.cg-nl h2, .cg-nl h3, .cg-nl th { letter-spacing: 0; text-transform: none; }
.cg-nl h2 { font-size: 11.5pt; }
`;
}

/* ───────────────────────────── block rendering ───────────────────────────── */

/** Set while rendering right-to-left copies so Latin bracketed references keep their own direction. */
let rtlRender = false;
// e.g. "(BNS §§24–30; Consumer Protection Act 2019)": without isolation the brackets and full stop wander in Urdu text
const LATIN_PAREN = /\([A-Za-z0-9§–\-.,;:& /']+\)/g;

const inlineHtml = (inline: Inline[]): string =>
  inline
    .map((i) => {
      let h = escapeHtml(i.text);
      if (rtlRender) h = h.replace(LATIN_PAREN, "<bdi>$&</bdi>");
      if (i.bold) h = `<b>${h}</b>`;
      if (i.italic) h = `<i>${h}</i>`;
      return h;
    })
    .join("");

function fieldsHtml(items: ListItem[]): string {
  const rows = items
    .map((it) => {
      const f = splitField(it);
      if (!f) return `<div class="cg-row"><span class="cg-val">${inlineHtml(it.inline)}</span></div>`;
      const label = f.label.length ? `<span class="cg-lab">${inlineHtml(f.label)}</span>` : "";
      if (f.kind === "blank") return `<div class="cg-row">${label}<span class="cg-line"></span></div>`;
      if (f.kind === "datetime") {
        const b = (w: number) => `<i class="cg-b" style="width:${w}px"></i>`;
        return `<div class="cg-row">${label}<span class="cg-dt">${b(26)}/${b(26)}/${b(46)}<span style="width:12px"></span>${b(26)}:${b(26)} IST</span></div>`;
      }
      return `<div class="cg-row">${label}<span class="cg-val"><bdi>${inlineHtml(f.value).trim()}</bdi></span></div>`;
    })
    .join("");
  return `<div class="cg-fields">${rows}</div>`;
}

const isShortList = (items: ListItem[]): boolean =>
  items.length >= 4 && items.every((it) => it.children.length === 0 && inlineToPlain(it.inline).length <= 70);

function listHtml(tag: "ul" | "ol", items: ListItem[], nested = false): string {
  const lis = items
    .map((it) => `<li>${inlineHtml(it.inline)}${it.children.length ? listHtml(tag, it.children, true) : ""}</li>`)
    .join("");
  const cols = tag === "ul" && nested && isShortList(items) ? ' class="cg-cols"' : "";
  return `<${tag}${cols}>${lis}</${tag}>`;
}

function blockHtml(b: Block): string {
  switch (b.type) {
    case "h2": return `<h2>${inlineHtml(b.inline)}</h2>`;
    case "h3": return `<h3>${inlineHtml(b.inline)}</h3>`;
    case "p": return `<p>${inlineHtml(b.inline)}</p>`;
    case "quote": return `<blockquote>${inlineHtml(b.inline)}</blockquote>`;
    case "hr": return "<hr/>";
    case "sigline": return `<div class="cg-signline"></div>`;
    case "ul":
    case "ol": return isFieldList(b.items) ? fieldsHtml(b.items) : listHtml(b.type, b.items);
    case "table": {
      const head = `<tr>${b.header.map((c) => `<th>${inlineHtml(c)}</th>`).join("")}</tr>`;
      const body = b.rows.map((r) => `<tr>${r.map((c) => `<td>${inlineHtml(c)}</td>`).join("")}</tr>`).join("");
      return `<table>${head}${body}</table>`;
    }
  }
}

export function headerHtml(meta: ConsentMeta): string {
  const cells = meta.identity
    .map(
      (c) =>
        `<div class="cg-cell${c.wide ? " wide" : ""}"><div class="cg-cell-l">${escapeHtml(c.label)}</div><div class="cg-cell-v">${escapeHtml(c.value)}</div></div>`
    )
    .join("");
  return `<div dir="ltr">
  <div class="cg-head">
    <div><div class="cg-hosp">${escapeHtml(meta.hospitalName)}</div>${meta.hospitalAddress ? `<div class="cg-addr">${escapeHtml(meta.hospitalAddress)}</div>` : ""}</div>
    <div class="cg-ids"><div>Consent ID: <b>${escapeHtml(meta.consentId)}</b></div>${meta.timestamp ? `<div>Date &amp; Time: <b>${escapeHtml(meta.timestamp)}</b></div>` : ""}</div>
  </div>
  <div class="cg-banner">${escapeHtml(meta.title)}</div>
  ${cells ? `<div class="cg-grid">${cells}</div>` : ""}
</div>`;
}

/** The form as indivisible page units (header first), each already wrapped for pagination. */
const LANG_CODE: Record<string, string> = {
  English: "en", Hindi: "hi", Marathi: "mr", Tamil: "ta", Telugu: "te", Kannada: "kn", Malayalam: "ml",
  Bengali: "bn", Gujarati: "gu", Punjabi: "pa", Odia: "or", Urdu: "ur",
};

export function buildUnits(meta: ConsentMeta, markdown: string): string[] {
  rtlRender = false; // the masthead is always left-to-right
  const dir = meta.isRtl ? "rtl" : "ltr";
  const code = LANG_CODE[meta.language] ?? "en";
  const cls = meta.language && meta.language !== "English" ? "cg-unit cg-nl" : "cg-unit";
  const units = groupIntoUnits(parseConsentMarkdown(markdown));
  const header = `<div class="cg-unit">${headerHtml(meta)}</div>`;
  rtlRender = meta.isRtl;
  try {
    return [header, ...units.map((u) => `<div class="${cls}" dir="${dir}" lang="${code}">${u.map(blockHtml).join("")}</div>`)];
  } finally {
    rtlRender = false;
  }
}

/** Standalone HTML document for printing. The browser paginates; page footers use @page margin boxes. */
export function buildPrintDocument(meta: ConsentMeta, markdown: string): string {
  const { top, bottom, side } = PAGE_MM;
  const footer = cssString(footerLabel(meta));
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Consent Form - ${escapeHtml(meta.consentId)}</title>
<style>
@page {
  size: A4 portrait;
  margin: ${top}mm ${side}mm ${bottom}mm ${side}mm;
  @bottom-left  { content: "${footer}"; font: 8pt ${FONT_STACK}; color: #64748b; vertical-align: top; padding-top: 4mm; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt ${FONT_STACK}; color: #64748b; vertical-align: top; padding-top: 4mm; }
}
html, body { margin: 0; padding: 0; background: #fff; }
${consentCss()}
</style>
</head>
<body><div class="cg">${buildUnits(meta, markdown).join("\n")}</div></body>
</html>`;
}

/** Plain-text length helper used by tests / diagnostics. */
export const plainLength = (markdown: string): number =>
  parseConsentMarkdown(markdown).reduce((n, b) => n + (("inline" in b ? inlineToPlain(b.inline).length : 0)), 0);
