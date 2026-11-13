"use client";

import { useEffect } from "react";

/**
 * Makes every data table readable on a phone without rewriting each page.
 *
 * On narrow screens (see globals.css) a table marked `data-stack` is shown as a list of cards: the header
 * row is hidden and each cell shows its column name beside its value. This component supplies the missing
 * piece, copying each column's header text onto the cells of that column as `data-label`.
 * It re-runs whenever rows change (filtering, searching, tab switches).
 */
export default function ResponsiveTables() {
  useEffect(() => {
    const label = () => {
      document.querySelectorAll<HTMLTableElement>("main table").forEach((table) => {
        if (table.hasAttribute("data-no-stack")) return;
        const headRow = table.querySelector("thead tr") ?? table.querySelector("tr");
        if (!headRow) return;
        const names = Array.from(headRow.children).map((th) => (th.textContent ?? "").replace(/\s+/g, " ").trim());
        table.setAttribute("data-stack", "");
        table.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((tr) => {
          let col = 0;
          Array.from(tr.children).forEach((td) => {
            const cell = td as HTMLElement;
            const span = Number(cell.getAttribute("colspan") || 1);
            if (span > 1) {
              cell.setAttribute("data-label", "");
              cell.setAttribute("data-wide", "");
            } else {
              const text = names[col] ?? "";
              if (cell.getAttribute("data-label") !== text) cell.setAttribute("data-label", text);
            }
            col += span;
          });
        });
      });
    };

    label();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(label, 40);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
