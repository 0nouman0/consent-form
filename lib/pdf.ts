export async function downloadConsentPDF({
  consentId,
}: {
  markdown?: string;
  consentId: string;
  hospitalName?: string;
  timestamp?: string;
  isResearch?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData?: any;
}) {
  // Import html2pdf.js dynamically (client-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import("html2pdf.js" as any)).default;

  // Grab the live-rendered consent document element
  const element = document.getElementById("consent-document-body");
  if (!element) {
    console.error("Could not find #consent-document-body to export as PDF");
    return;
  }

  // Clone so we can apply print-only styles without affecting the UI
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove any print-hide elements from the PDF clone
  clone.querySelectorAll(".print-hide").forEach((el) => el.remove());

  // Apply a clean white background and balanced single-page print styles to the clone
  clone.style.cssText = `
    background: #ffffff !important;
    color: #0f172a !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Bengali", "Noto Sans Gujarati", "Noto Sans Gurmukhi", "Noto Sans Oriya", "Noto Sans Arabic";
    font-size: 8.5pt;
    line-height: 1.35;
    width: 100%;
  `;

  // Balanced professional spacing and styling for strict single-page fit
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    h1 { display: none !important; }
    h2 { font-size: 9pt !important; margin: 4.5pt 0 2pt !important; background: #f1f5f9 !important; padding: 2pt 4pt !important; border-left: 3pt solid #1e293b !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-weight: bold !important; text-transform: uppercase !important; }
    h3 { font-size: 8.5pt !important; margin: 2.5pt 0 1.5pt !important; font-weight: bold !important; }
    p  { font-size: 8.5pt !important; line-height: 1.35 !important; margin: 0 0 3pt !important; }
    ul, ol { font-size: 8.5pt !important; margin: 0 0 3pt 12pt !important; padding: 0 !important; }
    li { margin: 0 0 1pt !important; line-height: 1.35 !important; }
    hr { margin: 3pt 0 !important; border-color: #cbd5e1 !important; }
    table { font-size: 8pt !important; width: 100% !important; border-collapse: collapse !important; margin: 3pt 0 !important; }
    th { font-size: 8pt !important; padding: 2.5pt 4pt !important; border: 1px solid #cbd5e1 !important; background: #f1f5f9 !important; font-weight: bold !important; text-transform: uppercase !important; }
    td { font-size: 8pt !important; padding: 3pt 4pt !important; border: 1px solid #cbd5e1 !important; vertical-align: top !important; line-height: 1.35 !important; }
  `;
  clone.prepend(styleEl);

  // Wrap in a container sized exactly to A4 proportions at 96 DPI
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "width:794px;padding:12px 18px;box-sizing:border-box;background:#ffffff;";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const options = {
    margin: [6, 8, 6, 8], // mm: top, left, bottom, right
    filename: `consent-${consentId}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: { mode: ["avoid-all", "css"] },
  };

  try {
    await html2pdf().set(options).from(wrapper).save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
