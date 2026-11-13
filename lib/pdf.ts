// PDF export now lives in consent-export.ts (shared layout engine). Re-exported so existing imports keep working.
export { downloadConsentPDF, printConsent } from "./consent-export";
export type { ExportParams } from "./consent-export";
