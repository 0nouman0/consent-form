/**
 * Browser-side exports (print + PDF) built on the shared layout engine.
 * Neither depends on what happens to be on screen, so they work from the generate page AND from History.
 */
import { buildConsentMeta, footerLabel, type ConsentMeta } from "./consent-layout";
import { PAGE_MM, buildPrintDocument, buildUnits, consentCss, escapeHtml } from "./consent-html";

export interface ExportParams {
  markdown: string;
  consentId: string;
  hospitalName?: string;
  timestamp?: string;
  isResearch?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData?: any;
  /** Language of the copy being exported (drives right-to-left layout). */
  language?: string;
}

const MM_TO_PX = 96 / 25.4;

function metaFor(p: ExportParams): ConsentMeta {
  return buildConsentMeta({
    formData: p.formData,
    isResearch: p.isResearch,
    consentId: p.consentId,
    hospitalName: p.hospitalName,
    timestamp: p.timestamp,
    language: p.language,
  });
}

/* ───────────────────────────── print ───────────────────────────── */

export async function printConsent(p: ExportParams): Promise<void> {
  const html = buildPrintDocument(metaFor(p), p.markdown);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // A real A4-sized frame placed off-screen: zero-size or display:none frames print blank in some browsers.
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    throw new Error("Could not open the print view");
  }
  doc.open();
  doc.write(html);
  doc.close();

  try {
    await (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  } catch { /* fonts API unavailable */ }
  await new Promise((r) => setTimeout(r, 150));

  const cleanup = () => { if (document.body.contains(iframe)) document.body.removeChild(iframe); };
  win.addEventListener("afterprint", () => setTimeout(cleanup, 500));
  setTimeout(cleanup, 120_000); // safety net if afterprint never fires
  win.focus();
  win.print();
}

/* ───────────────────────────── PDF ───────────────────────────── */

/**
 * Real multi-page A4 PDF: units are measured, assigned to pages without splitting any of them, each page
 * gets a footer (Consent ID, patient, "Page X of Y"), and every page is rendered with the browser's own
 * text engine so Indian-language scripts shape correctly.
 */
export async function downloadConsentPDF(p: ExportParams): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const meta = metaFor(p);
  const units = buildUnits(meta, p.markdown);

  const contentWidthMm = PAGE_MM.width - 2 * PAGE_MM.side;
  const capacityPx = (PAGE_MM.height - PAGE_MM.top - PAGE_MM.bottom) * MM_TO_PX;

  const host = document.createElement("div");
  host.style.cssText = "position:absolute;left:-10000px;top:0;background:#fff;";
  host.innerHTML = `<style>${consentCss()}</style>`;

  // 1) measure every unit at the real content width
  const measure = document.createElement("div");
  measure.className = "cg";
  measure.style.width = `${contentWidthMm}mm`;
  measure.innerHTML = units.join("");
  host.appendChild(measure);
  document.body.appendChild(host);

  try {
    try { await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready; } catch { /* ignore */ }

    const els = Array.from(measure.children) as HTMLElement[];
    const pages: HTMLElement[][] = [[]];
    let used = 0;
    for (const el of els) {
      const h = el.getBoundingClientRect().height;
      if (used + h > capacityPx && pages[pages.length - 1].length > 0) {
        pages.push([]);
        used = 0;
      }
      pages[pages.length - 1].push(el);
      used += h;
    }

    // 2) build one fixed-size A4 element per page, with its footer
    const pageEls = pages.map((group, idx) => {
      const page = document.createElement("div");
      page.style.cssText =
        `position:relative;overflow:hidden;background:#fff;width:${PAGE_MM.width}mm;height:${PAGE_MM.height}mm;` +
        `padding:${PAGE_MM.top}mm ${PAGE_MM.side}mm 0 ${PAGE_MM.side}mm;`;
      const body = document.createElement("div");
      body.className = "cg";
      body.innerHTML = group.map((g) => g.outerHTML).join("");
      page.appendChild(body);

      const foot = document.createElement("div");
      foot.className = "cg";
      foot.style.cssText =
        `position:absolute;left:${PAGE_MM.side}mm;right:${PAGE_MM.side}mm;bottom:${Math.max(6, PAGE_MM.bottom - 9)}mm;` +
        "display:flex;justify-content:space-between;gap:12pt;font-size:8pt;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4pt;line-height:1.3;";
      foot.innerHTML = `<span>${escapeHtml(footerLabel(meta))}</span><span style="white-space:nowrap">Page ${idx + 1} of ${pages.length}</span>`;
      page.appendChild(foot);
      return page;
    });

    const stage = document.createElement("div");
    stage.style.cssText = "position:absolute;left:-10000px;top:0;";
    stage.innerHTML = `<style>${consentCss()}</style>`;
    pageEls.forEach((el) => stage.appendChild(el));
    document.body.appendChild(stage);

    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      pdf.setProperties({ title: `Consent Form ${meta.consentId}`, subject: meta.title, creator: "ConsentGen" });

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2.5,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });
        if (i > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.93), "JPEG", 0, 0, PAGE_MM.width, PAGE_MM.height, undefined, "FAST");
      }
      pdf.save(`consent-${p.consentId}.pdf`);
    } finally {
      document.body.removeChild(stage);
    }
  } finally {
    document.body.removeChild(host);
  }
}
