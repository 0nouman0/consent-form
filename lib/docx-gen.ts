import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, LeaderType, LevelFormat, Packer, PageNumber,
  Paragraph, ShadingType, Tab, Table, TableCell, TableLayoutType, TableRow, TabStopType, TextRun, VerticalAlign,
  WidthType, convertMillimetersToTwip,
} from "docx";
import {
  type Block, type Inline, type ListItem, type ConsentMeta,
  buildConsentMeta, footerLabel, isFieldList, parseConsentMarkdown, splitField,
} from "./consent-layout";

/* A4 geometry — identical to the print / PDF layout */
const PAGE = { w: 11906, h: 16838 };
const MARGIN = {
  top: convertMillimetersToTwip(14),
  bottom: convertMillimetersToTwip(18),
  left: convertMillimetersToTwip(16),
  right: convertMillimetersToTwip(16),
};
const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right; // 10092 twips

/* half-points: 20 = 10pt */
const SZ = { body: 20, quote: 19, h2: 22, h3: 20, hosp: 30, addr: 18, small: 17, label: 15, cell: 19, banner: 21 };
const INK = "111827";
const MUTED = "64748b";
const NAVY = "1E293B";
const RULE = "CBD5E1";

export interface DocxParams {
  markdown: string;
  consentId: string;
  hospitalName?: string;
  timestamp?: string;
  isResearch?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData?: any;
  language?: string;
}

/* ───────────────────────────── runs ───────────────────────────── */

function fontFor(meta: ConsentMeta) {
  // Latin text in Arial; Indian scripts use the complex-script font Word ships for them
  const cs = meta.isRtl ? "Arial" : "Nirmala UI";
  return { ascii: "Arial", hAnsi: "Arial", eastAsia: "Arial", cs };
}

interface RunOpts { size?: number; color?: string; bold?: boolean; italics?: boolean; caps?: boolean; spacing?: number }

function runs(meta: ConsentMeta, inline: Inline[], o: RunOpts = {}): TextRun[] {
  const size = o.size ?? SZ.body;
  return inline.map(
    (i) =>
      new TextRun({
        text: i.text,
        bold: o.bold || i.bold,
        italics: o.italics || i.italic,
        boldComplexScript: o.bold || i.bold,
        italicsComplexScript: o.italics || i.italic,
        allCaps: o.caps,
        characterSpacing: o.spacing,
        size,
        sizeComplexScript: size,
        color: o.color ?? INK,
        font: fontFor(meta),
        rightToLeft: meta.isRtl && /[\u0590-\u08FF]/.test(i.text),
      })
  );
}

const plainRun = (meta: ConsentMeta, text: string, o: RunOpts = {}) => runs(meta, [{ text }], o);

// only right-to-left copies carry the bidi flag; left-to-right paragraphs stay completely plain
const bidi = (meta: ConsentMeta) =>
  meta.isRtl ? { bidirectional: true, alignment: AlignmentType.START } : { alignment: AlignmentType.LEFT };

/* ───────────────────────────── numbering ───────────────────────────── */

const bulletLevels = ["•", "–", "·"].map((text, level) => ({
  level,
  format: LevelFormat.BULLET,
  text,
  alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 340 + level * 340, hanging: 240 } }, run: { color: "475569" } },
}));

function orderedLevels() {
  return [0, 1, 2].map((level) => ({
    level,
    format: LevelFormat.DECIMAL,
    text: `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 400 + level * 340, hanging: 300 } } },
  }));
}

/* ───────────────────────────── block rendering ───────────────────────────── */

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};
const thin = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const gridBorders = { top: thin, bottom: thin, left: thin, right: thin };

function listParagraphs(meta: ConsentMeta, items: ListItem[], ref: string, level: number, out: Paragraph[]) {
  for (const it of items) {
    out.push(
      new Paragraph({
        children: runs(meta, it.inline, { size: level > 0 ? 19 : SZ.body }),
        numbering: { reference: ref, level: Math.min(level, 2) },
        spacing: { before: 0, after: 50, line: 290 },
        keepLines: true,
        ...bidi(meta),
      })
    );
    if (it.children.length) listParagraphs(meta, it.children, ref, level + 1, out);
  }
}

function fieldParagraphs(meta: ConsentMeta, items: ListItem[], keepWithNext: boolean): Paragraph[] {
  const FIRST_TAB = 4100;
  return items.map((it, idx) => {
    const f = splitField(it);
    const last = idx === items.length - 1;
    const common = {
      spacing: { before: 150, after: 60, line: 290 },
      keepLines: true,
      keepNext: keepWithNext || !last,
      tabStops: [
        { type: TabStopType.LEFT, position: FIRST_TAB },
        { type: TabStopType.RIGHT, position: CONTENT_W, leader: LeaderType.UNDERSCORE },
      ],
      ...bidi(meta),
    };
    if (!f) return new Paragraph({ ...common, children: runs(meta, it.inline) });
    const label = runs(meta, f.label, { bold: true, size: 19 });
    if (f.kind === "blank") {
      return new Paragraph({ ...common, children: [...label, new TextRun({ children: [new Tab(), new Tab()] })] });
    }
    if (f.kind === "datetime") {
      return new Paragraph({
        ...common,
        children: [...label, new TextRun({ children: [new Tab()] }), ...plainRun(meta, "____ / ____ / ________      ____ : ____  IST", { size: 19 })],
      });
    }
    return new Paragraph({ ...common, children: [...label, new TextRun({ children: [new Tab()] }), ...runs(meta, f.value)] });
  });
}

function tableBlock(meta: ConsentMeta, header: Inline[][], rows: Inline[][][]): Table {
  const cols = Math.max(1, header.length);
  const w = Math.floor(CONTENT_W / cols);
  const cell = (inl: Inline[], head: boolean) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: gridBorders,
      shading: head ? { type: ShadingType.CLEAR, fill: "F1F5F9", color: "auto" } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: runs(meta, inl, { size: 19, bold: head }), ...bidi(meta) })],
    });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: Array(cols).fill(w),
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c) => cell(c, false)) })),
    ],
  });
}

function bodyChildren(meta: ConsentMeta, blocks: Block[], orderedRefs: string[]): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    switch (b.type) {
      case "h2":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: runs(meta, b.inline, { size: SZ.h2, bold: true, caps: true, spacing: 8 }),
            shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "auto" },
            border: { left: { style: BorderStyle.SINGLE, size: 24, color: NAVY, space: 6 } },
            spacing: { before: 280, after: 110 },
            keepNext: true,
            keepLines: true,
            ...bidi(meta),
          })
        );
        break;
      case "h3":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: runs(meta, b.inline, { size: SZ.h3, bold: true, color: "1F2937" }),
            spacing: { before: 220, after: 80 },
            keepNext: true,
            keepLines: true,
            ...bidi(meta),
          })
        );
        break;
      case "p":
        out.push(new Paragraph({ children: runs(meta, b.inline), spacing: { after: 110, line: 300 }, ...bidi(meta) }));
        break;
      case "quote":
        out.push(
          new Paragraph({
            children: runs(meta, b.inline, { size: SZ.quote, italics: true, color: "334155" }),
            shading: { type: ShadingType.CLEAR, fill: "F8FAFC", color: "auto" },
            border: { left: { style: BorderStyle.SINGLE, size: 18, color: "94A3B8", space: 8 } },
            indent: { left: 200, right: 100 },
            spacing: { before: 60, after: 140, line: 310 },
            keepLines: true,
            keepNext: true,
            ...bidi(meta),
          })
        );
        break;
      case "hr":
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } }, spacing: { before: 100, after: 100 }, children: [] }));
        break;
      case "sigline":
        out.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W, leader: LeaderType.UNDERSCORE }],
            spacing: { before: 280, after: 100 },
            children: [new TextRun({ children: [new Tab()] })],
          })
        );
        break;
      case "table":
        out.push(tableBlock(meta, b.header, b.rows), new Paragraph({ spacing: { after: 100 }, children: [] }));
        break;
      case "ul":
      case "ol": {
        if (isFieldList(b.items)) {
          out.push(...fieldParagraphs(meta, b.items, false));
        } else {
          let ref = "cg-bullets";
          if (b.type === "ol") {
            ref = `cg-num-${orderedRefs.length}`;
            orderedRefs.push(ref);
          }
          const paras: Paragraph[] = [];
          listParagraphs(meta, b.items, ref, 0, paras);
          out.push(...paras);
        }
        break;
      }
    }
    void next;
  }
  return out;
}

/* ───────────────────────────── header ───────────────────────────── */

function headerElements(meta: ConsentMeta): Array<Paragraph | Table> {
  const half = Math.floor(CONTENT_W / 2);
  const masthead = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [Math.floor(CONTENT_W * 0.6), CONTENT_W - Math.floor(CONTENT_W * 0.6)],
    layout: TableLayoutType.FIXED,
    borders: { ...noBorders, insideHorizontal: noBorders.top, insideVertical: noBorders.top },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: Math.floor(CONTENT_W * 0.6), type: WidthType.DXA },
            borders: noBorders,
            margins: { left: 0, right: 100 },
            children: [
              new Paragraph({ children: plainRun(meta, meta.hospitalName, { size: SZ.hosp, bold: true }), spacing: { after: 20 } }),
              ...(meta.hospitalAddress
                ? [new Paragraph({ children: plainRun(meta, meta.hospitalAddress, { size: SZ.addr, color: MUTED }), spacing: { after: 0 } })]
                : []),
            ],
          }),
          new TableCell({
            width: { size: CONTENT_W - Math.floor(CONTENT_W * 0.6), type: WidthType.DXA },
            borders: noBorders,
            margins: { left: 100, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 20 },
                children: [...plainRun(meta, "Consent ID: ", { size: SZ.small, color: MUTED }), ...plainRun(meta, meta.consentId, { size: SZ.small, bold: true })],
              }),
              ...(meta.timestamp
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [...plainRun(meta, "Date & Time: ", { size: SZ.small, color: MUTED }), ...plainRun(meta, meta.timestamp, { size: SZ.small, bold: true })],
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    ],
  });
  void half;

  const rule = new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: RULE, space: 1 } }, spacing: { before: 60, after: 160 }, children: [] });

  const banner = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            borders: noBorders,
            shading: { type: ShadingType.CLEAR, fill: NAVY, color: "auto" },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 110, bottom: 110, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: plainRun(meta, meta.title, { size: SZ.banner, bold: true, color: "FFFFFF", caps: true, spacing: 16 }),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const out: Array<Paragraph | Table> = [masthead, rule, banner, new Paragraph({ spacing: { after: 140 }, children: [] })];

  if (meta.identity.length) {
    // fill rows of four grid columns; wide cells take two
    const colW = Math.floor(CONTENT_W / 4);
    const rows: TableRow[] = [];
    let current: TableCell[] = [];
    let used = 0;
    const flush = () => {
      if (!current.length) return;
      // pad an unfinished row with empty cells so the grid stays rectangular
      while (used < 4) {
        current.push(new TableCell({ width: { size: colW, type: WidthType.DXA }, borders: gridBorders, children: [new Paragraph({ children: [] })] }));
        used++;
      }
      rows.push(new TableRow({ cantSplit: true, children: current }));
      current = [];
      used = 0;
    };
    for (const c of meta.identity) {
      const span = c.wide ? 2 : 1;
      if (used + span > 4) flush();
      current.push(
        new TableCell({
          width: { size: colW * span, type: WidthType.DXA },
          columnSpan: span,
          borders: gridBorders,
          margins: { top: 70, bottom: 70, left: 110, right: 110 },
          children: [
            new Paragraph({ children: plainRun(meta, c.label, { size: SZ.label, color: MUTED, bold: true, caps: true, spacing: 10 }), spacing: { after: 10 } }),
            ...c.value.split("\n").map((line) => new Paragraph({ children: plainRun(meta, line, { size: SZ.cell, bold: true }), spacing: { after: 0 } })),
          ],
        })
      );
      used += span;
      if (used >= 4) flush();
    }
    flush();
    out.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [colW, colW, colW, colW],
        layout: TableLayoutType.FIXED,
        rows,
      }),
      new Paragraph({ spacing: { after: 60 }, children: [] })
    );
  }
  return out;
}

/* ───────────────────────────── document ───────────────────────────── */

export function buildConsentDocument(p: DocxParams): Document {
  const meta = buildConsentMeta({
    formData: p.formData,
    isResearch: p.isResearch,
    consentId: p.consentId,
    hospitalName: p.hospitalName,
    timestamp: p.timestamp,
    language: p.language,
  });

  const orderedRefs: string[] = [];
  const body = bodyChildren(meta, parseConsentMarkdown(p.markdown), orderedRefs);

  const footer = new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
        tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
        children: [
          ...plainRun(meta, footerLabel(meta), { size: 16, color: MUTED }),
          new TextRun({ children: [new Tab()], size: 16 }),
          new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: "Arial" }),
        ],
      }),
    ],
  });

  return new Document({
    creator: "ConsentGen",
    title: `Consent Form ${meta.consentId}`,
    description: meta.title,
    styles: {
      default: { document: { run: { font: fontFor(meta), size: SZ.body, color: INK }, paragraph: { spacing: { line: 300 } } } },
      paragraphStyles: [
        { id: "Heading2", name: "heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: SZ.h2, bold: true, color: INK } },
        { id: "Heading3", name: "heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: SZ.h3, bold: true, color: "1F2937" } },
      ],
    },
    numbering: {
      config: [
        { reference: "cg-bullets", levels: bulletLevels },
        ...orderedRefs.map((reference) => ({ reference, levels: orderedLevels() })),
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: PAGE.w, height: PAGE.h }, margin: { ...MARGIN, footer: convertMillimetersToTwip(8) } } },
        footers: { default: footer },
        children: [...headerElements(meta), ...body],
      },
    ],
  });
}

/** Node/test friendly: the .docx as bytes. */
export async function consentDocxBuffer(p: DocxParams): Promise<Buffer> {
  return Packer.toBuffer(buildConsentDocument(p));
}

/** Browser: build and download. */
export async function downloadConsentDOCX(p: DocxParams): Promise<void> {
  const blob = await Packer.toBlob(buildConsentDocument(p));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consent-${p.consentId}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
