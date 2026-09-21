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

  // Apply a clean white background and compact print styles to the clone
  clone.style.cssText = `
    background: #ffffff !important;
    color: #111111 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    font-family: 'Noto Sans', 'Noto Sans Kannada', serif;
    font-size: 9pt;
    line-height: 1.4;
    width: 100%;
  `;

  // Collapse spacing on headings and paragraphs for single-page fit
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    h1 { font-size: 13pt !important; margin: 4pt 0 3pt !important; padding-bottom: 2pt !important; }
    h2 { font-size: 11pt !important; margin: 4pt 0 2pt !important; }
    h3 { font-size: 10pt !important; margin: 3pt 0 1pt !important; }
    p  { font-size: 9pt !important; line-height: 1.35 !important; margin: 0 0 3pt !important; }
    ul, ol { font-size: 9pt !important; margin: 0 0 3pt 14pt !important; padding: 0 !important; }
    li { margin: 0 0 1pt !important; line-height: 1.35 !important; }
    hr { margin: 4pt 0 !important; }
    table { font-size: 8pt !important; width: 100% !important; border-collapse: collapse !important; }
    td, th { padding: 2pt 4pt !important; }
  `;
  clone.prepend(styleEl);

  // Wrap in a container so html2pdf gets clean dimensions
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "width:794px;padding:24px 32px;box-sizing:border-box;background:#fff;";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const options = {
    margin: [10, 12, 10, 12], // mm: top, left, bottom, right
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
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    await html2pdf().set(options).from(wrapper).save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
