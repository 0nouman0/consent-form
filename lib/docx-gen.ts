import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  Header,
  Footer,
  PageNumberElement,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableBorders,
} from "docx";

function parseBoldRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }
    runs.push(new TextRun({ text: match[1], bold: true }));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

function markdownToDocxParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: "" }));
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 100 },
        })
      );
    } else if (trimmed.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 120 },
        })
      );
    } else if (/^-{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: {
              color: "cccccc",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 160, after: 160 },
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
            children: parseBoldRuns(lines[i].trim().slice(2)),
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
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
              new TextRun(`${num}. `),
              ...parseBoldRuns(lines[i].trim().replace(/^\d+\.\s/, "")),
            ],
            spacing: { before: 40, after: 40 },
          })
        );
        i++;
        num++;
      }
      continue;
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseBoldRuns(trimmed),
          spacing: { before: 0, after: 80 },
        })
      );
    }

    i++;
  }

  return paragraphs;
}

function buildDocxTable(data: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" },
    },
    rows: data.map(([label, value]) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: "f9fafb" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                    size: 16, // 8pt
                    color: "555555",
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: value,
                    size: 18, // 9pt
                    color: "222222",
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        ],
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
  const complianceText = isResearch
    ? "Generated by ConsentGen · ICMR Guidelines Compliant · NMC 2023"
    : "Generated by ConsentGen · IMC 2002 Compliant · NMC 2023 · BNS §§24-30";

  const formTitle = isResearch
    ? "INFORMED CONSENT FORM FOR RESEARCH PARTICIPATION"
    : "INFORMED CONSENT FORM";

  const metaTable = new Table({
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
                    size: 16,
                    color: "666666",
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
                    text: `Date: ${timestamp}`,
                    size: 16,
                    color: "666666",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const childrenElements: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: formTitle,
          bold: true,
          size: 28,
          color: "0b0f1a",
          font: "Times New Roman",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: hospitalName || "Medical Institution",
          bold: true,
          size: 24,
          font: "Times New Roman",
          color: "333333",
        }),
      ],
      spacing: { after: 120 },
    }),
    metaTable,
    new Paragraph({
      border: {
        bottom: {
          color: "0b0f1a",
          style: BorderStyle.SINGLE,
          size: 12,
          space: 1,
        },
      },
      spacing: { before: 120, after: 240 },
      text: "",
    }),
  ];

  if (formData) {
    if (!isResearch) {
      const patientData: [string, string][] = [
        ["Patient Name", formData.patient?.patientName || "—"],
        ["Age / Sex", `${formData.patient?.age || "—"} / ${formData.patient?.sex || "—"}`],
        ["Hospital OPD/IPD No.", formData.patient?.hospitalOpdIpdNo || "—"],
        ["Aadhaar (last 4)", formData.patient?.aadhaarLast4 ? `XXXX-XXXX-${formData.patient.aadhaarLast4}` : "—"],
      ];
      if (formData.patient?.insuranceProvider) {
        patientData.push(["Insurance Provider", formData.patient.insuranceProvider]);
        patientData.push(["Insurance Policy No.", formData.patient.insurancePolicyNo || "—"]);
      }
      if (!formData.patient?.patientCompetent && formData.patient?.guardianName) {
        patientData.push(["Guardian Name", formData.patient.guardianName]);
        patientData.push(["Guardian Relationship", formData.patient.guardianRelationship || "—"]);
      }

      const clinicalData: [string, string][] = [
        ["Physician", `${formData.clinical?.doctorName || "—"} (Reg. ${formData.clinical?.doctorRegistrationNo || "—"})`],
        ["Procedure", formData.clinical?.procedureName || "—"],
        ["Scheduled Date", formData.clinical?.procedureDate || "—"],
        ["Counseling Language", formData.clinical?.counselingLanguage || "—"],
      ];

      childrenElements.push(
        new Paragraph({
          children: [new TextRun({ text: "PATIENT INFORMATION", bold: true, size: 20, color: "555555" })],
          spacing: { before: 200, after: 80 },
        }),
        buildDocxTable(patientData),
        new Paragraph({
          children: [new TextRun({ text: "CLINICAL DETAILS", bold: true, size: 20, color: "555555" })],
          spacing: { before: 200, after: 80 },
        }),
        buildDocxTable(clinicalData)
      );
    } else {
      const studyData: [string, string][] = [
        ["Study Title", formData.study?.studyTitle || "—"],
        ["Principal Investigator", formData.study?.principalInvestigator || "—"],
        ["Department", formData.study?.department || "—"],
        ["Contact", formData.study?.contactMobile || "—"],
        ["Counseling Language", formData.study?.counselingLanguage || "—"],
      ];

      const participantData: [string, string][] = [
        ["Participant Name", formData.participant?.participantName || "—"],
        ["Participant ID", formData.participant?.participantId || "—"],
        ["Age / Sex", `${formData.participant?.age || "—"} / ${formData.participant?.sex || "—"}`],
      ];
      if (!formData.participant?.isCompetent && formData.participant?.guardianName) {
        participantData.push(["Guardian Name", formData.participant.guardianName]);
        participantData.push(["Guardian Relationship", formData.participant.guardianRelationship || "—"]);
      }

      childrenElements.push(
        new Paragraph({
          children: [new TextRun({ text: "STUDY INFORMATION", bold: true, size: 20, color: "555555" })],
          spacing: { before: 200, after: 80 },
        }),
        buildDocxTable(studyData),
        new Paragraph({
          children: [new TextRun({ text: "PARTICIPANT INFORMATION", bold: true, size: 20, color: "555555" })],
          spacing: { before: 200, after: 80 },
        }),
        buildDocxTable(participantData)
      );
    }

    childrenElements.push(
      new Paragraph({
        border: {
          bottom: {
            color: "cccccc",
            style: BorderStyle.SINGLE,
            size: 6,
            space: 1,
          },
        },
        spacing: { before: 200, after: 200 },
        text: "",
      })
    );
  }

  // Add clauses markdown
  childrenElements.push(...markdownToDocxParagraphs(markdown));

  // Add closing line and footer
  childrenElements.push(
    new Paragraph({
      border: {
        bottom: {
          color: "cccccc",
          style: BorderStyle.SINGLE,
          size: 6,
          space: 1,
        },
      },
      spacing: { before: 240, after: 120 },
      text: "",
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: complianceText,
          size: 14,
          color: "aaaaaa",
          font: "Times New Roman",
        }),
      ],
    })
  );

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          run: { font: "Times New Roman", size: 22, color: "222222" },
          paragraph: { spacing: { line: 360 } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          run: { font: "Times New Roman", size: 26, bold: true, color: "0b0f1a" },
          paragraph: { spacing: { before: 360, after: 120 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          run: { font: "Times New Roman", size: 24, bold: true, color: "1a1a2e" },
          paragraph: { spacing: { before: 280, after: 80 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          run: { font: "Times New Roman", size: 22, bold: true, color: "333333" },
          paragraph: { spacing: { before: 200, after: 60 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${hospitalName || "Medical Institution"}  |  Consent ID: ${consentId}  |  Page `,
                    size: 16,
                    color: "888888",
                  }),
                  new PageNumberElement(),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: complianceText,
                    size: 14,
                    color: "aaaaaa",
                  }),
                ],
              }),
            ],
          }),
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
