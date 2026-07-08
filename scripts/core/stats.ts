/** Cross-study type statistics (Jaccard-weighted) */

import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import type { TypeStatResult } from "./types.js";

// mirrors JS getEffectiveType
export function effectiveType(item: any): string {
  if (!item) return "UNKNOWN";
  if (item.type === "SINGLE_SELECT")
    return item.layout === "RADIO" ? "RADIO" : "DROPDOWN";
  if (item.type === "TEXT")
    return item.appearance === "MULTILINE" || item.appearance === "MULTI_LINE"
      ? "MULTILINE"
      : "TEXT";
  return item.type ?? "UNKNOWN";
}

export function extractItems(
  pages: Record<string, any>
): Array<{ id: string; label: string; type: string }> {
  const result: Array<{ id: string; label: string; type: string }> = [];
  for (const page of Object.values(pages)) {
    for (const sec of page.sections ?? []) {
      for (const item of sec.items ?? []) {
        if (!item.id) continue;
        result.push({
          id: item.id,
          label: String(item.label ?? "").trim().toLowerCase(),
          type: effectiveType(item),
        });
      }
    }
  }
  return result;
}

export function jaccardSim(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export async function buildTypeStats(
  crfBase: string,
  studyDir: string,
  currentPages: Record<string, any>
): Promise<TypeStatResult> {
  const stats: Record<string, Record<string, number>> = {};
  const labelStats: Record<string, Record<string, number>> = {};

  const currentItems = extractItems(currentPages);
  const currentIds = new Set(currentItems.map((i) => i.id));

  let scanned = 0,
    skipped = 0;

  const studyDirs = fs
    .readdirSync(crfBase, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== studyDir)
    .map((e) => e.name);

  for (const dir of studyDirs) {
    const pageFile = path.join(crfBase, dir, "page.ts");
    if (!fs.existsSync(pageFile)) {
      skipped++;
      continue;
    }
    try {
      const mod = await import(pathToFileURL(pageFile).href);
      const pages: Record<string, any> = mod.CRF_PAGES ?? {};

      const items = extractItems(pages);
      if (!items.length) {
        skipped++;
        continue;
      }

      const otherIds = new Set(items.map((i) => i.id));
      const sim = jaccardSim(currentIds, otherIds);
      if (sim === 0) {
        skipped++;
        continue;
      }

      const seenId = new Set<string>();
      const seenLabel = new Set<string>();
      for (const { id, label, type } of items) {
        if (!seenId.has(id)) {
          seenId.add(id);
          if (!stats[id]) stats[id] = {};
          stats[id][type] = (stats[id][type] ?? 0) + sim;
        }
        if (label && !seenLabel.has(label)) {
          seenLabel.add(label);
          if (!labelStats[label]) labelStats[label] = {};
          labelStats[label][type] = (labelStats[label][type] ?? 0) + sim;
        }
      }
      scanned++;
    } catch {
      skipped++;
    }
  }

  console.log(`📊  Type stats: scanned ${scanned} studies, skipped ${skipped}`);
  return { stats, labelStats };
}
