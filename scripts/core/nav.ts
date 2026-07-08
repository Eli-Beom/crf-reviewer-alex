/** buildNav: folders + pages + domains → NavEntry[] */

import type { NavEntry, NavPage } from "./types.js";

export function buildNav(
  folders: any[],
  pages: Record<string, any>,
  domains: Record<string, any>
): NavEntry[] {
  const entries: NavEntry[] = [];

  for (const folder of folders) {
    for (const visit of folder.visits ?? []) {
      const visitLabel =
        typeof visit.label === "string"
          ? visit.label
          : `${folder.label} ${visit.id}`;
      const visitCode = typeof visit.code === "number" ? visit.code : undefined;
      const visitType = typeof folder.type === "string" ? folder.type : undefined;
      const crfs: NavPage[] = [];
      for (const crf of visit.crfs ?? []) {
        const pageId: string = crf.page;
        if (!pages[pageId]) continue;
        crfs.push({ pageId, domainLabel: getPageDisplayLabel(pageId, pages, domains) });
      }
      if (crfs.length) entries.push({ visitLabel, visitCode, visitType, pages: crfs });
    }
  }
  return entries;
}

export function getPageDisplayLabel(
  pageId: string,
  pages: Record<string, any>,
  domains: Record<string, any>
): string {
  const page = pages[pageId];
  const firstSectionLabel = normalizeLabel(page?.sections?.[0]?.label);
  if (firstSectionLabel) return firstSectionLabel;

  const domain = domains[pageId] ?? domains[page?.domain];
  return normalizeLabel(domain?.label) || pageId;
}

function normalizeLabel(label: any): string | null {
  if (typeof label === "string" && label.trim()) return label;
  if (typeof label?.text === "string" && label.text.trim()) return label.text;
  return null;
}
