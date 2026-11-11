import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableBorders,
} from "docx";

function parseBoldRuns(text: string, baseSize = 16): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex, match.index),
          size: baseSize,
          font: "Arial",
          color: "111111",
        })
      );
    }
    runs.push(
      new TextRun({
        text: match[1],
        bold: true,
        size: baseSize,
        font: "Arial",
        color: "000000",
      })
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
        size: baseSize,
        font: "Arial",
        color: "111111",
      })
    );
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text,
        size: baseSize,
        font: "Arial",
        color: "111111",
      })
    );
  }

  return runs;
}

function parseMarkdownTable(tableLines: string[]): Table {
  const contentRows = tableLines.filter((l) => !/^[|\s:-]+$/.test(l.trim()));
  const numCols = contentRows[0]
    ? contentRows[0].split("|").slice(1, -1).length
    : 1;
  const colWidth = Math.floor(100 / Math.max(1, numCols));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
    },
    rows: contentRows.map((rowLine, rowIndex) => {
      const cells = rowLine.split("|").slice(1, -1).map((c) => c.trim());
      const isHeader = rowIndex === 0;
      return new TableRow({
        children: cells.map((cellText) => {
          const parts = cellText.split(/<br\s*\/?>/i);
          return new TableCell({
            width: { size: colWidth, type: WidthType.PERCENTAGE },
            shading: isHeader ? { fill: "f3f4f6" } : undefined,
            children: parts.map(
              (p) =>
                new Paragraph({
                  children: parseBoldRuns(p.trim(), isHeader ? 14 : 15),
                  spacing: { before: 8, after: 8 },
                })
            ),
          });
        }),
      });
    }),
  });
}

function markdownToDocxParagraphs(markdown: string): (Paragraph | Table)[] {
  const cleaned = markdown
    .replace(/\|\s*\|\s*(:?---[:\s|]+)\|\s*\|\s*/g, "|\n| $1 |\n| ")
    .replace(/\|\s*\|\s*(:?---[:\s|]+)/g, "|\n| $1\n")
    .replace(/\|\s*\|\s*/g, "|\n| ");
  const lines = cleaned.split("\n");
  const paragraphs: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      paragraphs.push(parseMarkdownTable(tableLines));
      continue;
    }

    if (trimmed.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 40, after: 15 },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 70, after: 20 },
        })
      );
    } else if (trimmed.startsWith("# ")) {
      // Skip top-level heading since Title Bar is already rendered in the document header
      i++;
      continue;
    } else if (/^-{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: {
              color: "e5e7eb",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 4,
            },
          },
          spacing: { before: 40, after: 40 },
          text: "",
        })
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
      ) {
        paragraphs.push(
          new Paragraph({
            children: parseBoldRuns(lines[i].trim().slice(2), 16),
            bullet: { level: 0 },
            spacing: { before: 8, after: 8 },
          })
        );
        i++;
      }
      continue;
    } else if (/^\d+\.\s/.test(trimmed)) {
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${num}. `,
                bold: true,
                size: 16,
                font: "Arial",
              }),
              ...parseBoldRuns(lines[i].trim().replace(/^\d+\.\s/, ""), 16),
            ],
            spacing: { before: 15, after: 15 },
          })
        );
        i++;
        num++;
      }
      continue;
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseBoldRuns(trimmed, 16),
          spacing: { before: 0, after: 25 },
        })
      );
    }

    i++;
  }

  return paragraphs;
}

function buildCompactDocxGrid(data: [string, string, string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
    },
    rows: data.map(([label1, val1, label2, val2]) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: "f9fafb" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label1,
                    bold: true,
                    size: 14, // 7pt
                    color: "666666",
                    font: "Arial",
                  }),
                ],
                spacing: { before: 0, after: 0 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: val1,
                    size: 15, // 7.5pt
                    bold: true,
                    color: "111111",
                    font: "Arial",
                  }),
                ],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label2,
                    bold: true,
                    size: 14,
                    color: "666666",
                    font: "Arial",
                  }),
                ],
                spacing: { before: 0, after: 0 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: val2,
                    size: 15,
                    color: "111111",
                    font: "Arial",
                  }),
                ],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
        ],
      });
    }),
  });
}

function build4ColGrid(rows: [string, string][][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
    },
    rows: rows.map((colPairs) => {
      return new TableRow({
        children: colPairs.map(([label, value]) => {
          return new TableCell({
            width: { size: Math.floor(100 / colPairs.length), type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label.toUpperCase(),
                    bold: true,
                    size: 13, // 6.5pt
                    color: "6b7280",
                    font: "Arial",
                  }),
                ],
                spacing: { before: 0, after: 0 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: value,
                    size: 15, // 7.5pt
                    bold: label.toLowerCase().includes("name") || label.toLowerCase().includes("procedure"),
                    color: "111827",
                    font: "Arial",
                  }),
                ],
                spacing: { before: 0, after: 0 },
              }),
            ],
          });
        }),
      });
    }),
  });
}

export async function downloadConsentDOCX({
  markdown,
  consentId,
  hospitalName,
  timestamp,
  isResearch = false,
  formData,
}: {
  markdown: string;
  consentId: string;
  hospitalName: string;
  timestamp: string;
  isResearch?: boolean;
  formData?: any;
}) {
  const formTitle = isResearch
    ? "INFORMED CONSENT FOR RESEARCH PARTICIPATION"
    : "INFORMED CONSENT FORM FOR SURGICAL / CLINICAL PROCEDURE";

  const childrenElements: any[] = [
    // Header Masthead
    new Paragraph({
      children: [
        new TextRun({
          text: hospitalName || "Medical Healthcare Institution",
          bold: true,
          size: 20, // 10pt
          color: "111827",
          font: "Arial",
        }),
      ],
      spacing: { before: 0, after: 20 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Consent ID: ${consentId}`,
                      size: 14,
                      bold: true,
                      color: "4b5563",
                      font: "Arial",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `Date & Time: ${timestamp}`,
                      size: 14,
                      color: "4b5563",
                      font: "Arial",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // Title Bar
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: formTitle,
          bold: true,
          size: 18, // 9pt
          color: "111827",
          font: "Arial",
        }),
      ],
      spacing: { before: 40, after: 40 },
    }),
  ];

  // Compact Metadata Grid
  if (formData) {
    if (!isResearch) {
      const row1: [string, string][] = [
        ["Patient Name", formData.patient?.patientName || "—"],
        ["Age / Sex", `${formData.patient?.age || "—"} Yrs / ${formData.patient?.sex || "—"}`],
        ["OPD/IPD No.", formData.patient?.hospitalOpdIpdNo || "—"],
        ["Aadhaar (Last 4)", formData.patient?.aadhaarLast4 ? `XXXX-XXXX-${formData.patient.aadhaarLast4}` : "—"],
      ];
      const row2: [string, string][] = [
        ["Treating Clinician", `Dr. ${formData.clinical?.doctorName || "—"} (Reg: ${formData.clinical?.doctorRegistrationNo || "—"})`],
        ["Proposed Procedure", formData.clinical?.procedureName || "—"],
        ["Scheduled Date", formData.clinical?.procedureDate || "—"],
        ["Counseling Language", formData.clinical?.counselingLanguage || "—"],
      ];
      childrenElements.push(build4ColGrid([row1, row2]));
    } else {
      const row1: [string, string][] = [
        ["Participant Name", formData.participant?.participantName || "—"],
        ["Participant ID", formData.participant?.participantId || "—"],
        ["Age / Sex", `${formData.participant?.age || "—"} Yrs / ${formData.participant?.sex || "—"}`],
        ["Counseling Language", formData.study?.counselingLanguage || "—"],
      ];
      const row2: [string, string][] = [
        ["Study Title", formData.study?.studyTitle || "—"],
        ["Principal Investigator", formData.study?.principalInvestigator || "—"],
        ["Department", formData.study?.department || "—"],
        ["Contact", formData.study?.contactMobile || "—"],
      ];
      childrenElements.push(build4ColGrid([row1, row2]));
    }
  }

  // Add structured consent body paragraphs
  childrenElements.push(...markdownToDocxParagraphs(markdown));

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          run: { font: "Arial", size: 16, color: "111111" },
          paragraph: { spacing: { line: 220, lineRule: "auto" } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          run: { font: "Arial", size: 20, bold: true, color: "111827" },
          paragraph: { spacing: { before: 60, after: 30 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          run: { font: "Arial", size: 18, bold: true, color: "111827" },
          paragraph: { spacing: { before: 60, after: 20 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          run: { font: "Arial", size: 16, bold: true, color: "374151" },
          paragraph: { spacing: { before: 30, after: 15 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 576, right: 720, bottom: 576, left: 720 }, // 0.4 in / 0.5 in
          },
        },
        children: childrenElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consent-${consentId}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
