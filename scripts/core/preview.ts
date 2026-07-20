import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { buildHtml } from "./html-shell.js";
import { buildTypeStats } from "./stats.js";
import type {
  GeneratePreviewOptions,
  GeneratePreviewResult,
  PreviewMode,
  TypeStatResult,
} from "./types.js";

export function resolveCrfBase(): string {
  const crfBase = process.env.CRF_BASE;
  if (!crfBase) {
    throw new Error("CRF_BASE is required. Set it to the directory containing CRF study folders.");
  }
  return path.resolve(crfBase);
}

export function resolveStudyPath(crfBase: string, study: string): string {
  return path.resolve(crfBase, study);
}

export function defaultOutputFile(
  studyPath: string,
  study: string,
  mode: PreviewMode
): string {
  const prefix = "preview";
  return path.join(studyPath, `${prefix}-${study}.html`);
}

export function parseGenerateArgs(
  argv: string[],
  mode: PreviewMode
): GeneratePreviewOptions {
  const args = [...argv];
  const noStats = removeFlag(args, "--no-stats");
  const crfBase = path.resolve(popOption(args, "--crf-base") ?? resolveCrfBase());
  const outputFromFlag = popOption(args, "--out");
  const commentsFile = popOption(args, "--comments");
  const study = args[0];

  if (!study) {
    throw new Error(
      `Usage: npx tsx scripts/generate-${mode}.ts <study-dir-name> [output.html] [--out <output.html>] [--crf-base <path>] [--no-stats]`
    );
  }

  const studyPath = resolveStudyPath(crfBase, study);
  const outputFile = path.resolve(
    outputFromFlag ?? args[1] ?? defaultOutputFile(studyPath, study, mode)
  );

  return {
    study,
    crfBase,
    outputFile,
    mode,
    includeStats: mode === "internal" && !noStats,
    commentsFile,
  };
}

export async function generatePreview(
  options: GeneratePreviewOptions
): Promise<GeneratePreviewResult> {
  const studyPath = resolveStudyPath(options.crfBase, options.study);
  if (!fs.existsSync(studyPath)) {
    throw new Error(`Study directory not found: ${studyPath}`);
  }

  const { pages, folders, domains, studyInfo } = await loadStudyModules(studyPath);
  const typeStats: TypeStatResult | undefined =
    options.mode === "internal" && options.includeStats
      ? await buildTypeStats(options.crfBase, options.study, pages)
      : undefined;

  const commentsFile = options.commentsFile ?? findLatestCommentsFile(options.study);
  let reviewState: Record<string, any> | undefined;
  if (commentsFile && fs.existsSync(commentsFile)) {
    const raw = fs.readFileSync(commentsFile, "utf-8");
    reviewState = JSON.parse(raw);
  }

  const warnings = inspectVisitPlacement(folders);
  const html = buildHtml({
    study: options.study,
    studyInfo,
    pages,
    folders,
    domains,
    typeStats,
    mode: options.mode,
    reviewState,
  });

  fs.mkdirSync(path.dirname(options.outputFile), { recursive: true });
  fs.writeFileSync(options.outputFile, html, "utf-8");
  return { outputFile: options.outputFile, warnings };
}

function findLatestCommentsFile(study: string): string | undefined {
  const outputDir = path.resolve(__dirname, "..", "..", "output");
  if (!fs.existsSync(outputDir)) return undefined;

  const candidates = fs
    .readdirSync(outputDir)
    .filter((name) => name.startsWith(`comments-${study}-`) && name.endsWith(".json"))
    .map((name) => path.join(outputDir, name));

  let latestPath: string | undefined;
  let latestExportedAt = -Infinity;

  for (const filePath of candidates) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      const exportedAt = parsed?.exportedAt ? Date.parse(parsed.exportedAt) : NaN;
      const score = Number.isFinite(exportedAt) ? exportedAt : fs.statSync(filePath).mtimeMs;
      if (score > latestExportedAt) {
        latestExportedAt = score;
        latestPath = filePath;
      }
    } catch {
      continue;
    }
  }

  return latestPath;
}

async function loadStudyModules(studyPath: string): Promise<{
  pages: Record<string, any>;
  folders: any[];
  domains: Record<string, any>;
  studyInfo: {
    protocolNo: string;
    title: string;
    phase: string;
    coverDescriptions: Array<{ label: string; text: string }>;
    headerItems: any[];
  };
}> {
  const foldersFile = fs.existsSync(path.join(studyPath, "folders.ts"))
    ? "folders.ts"
    : "folder.ts";

  const [pageMod, folderMod, domainMod, studyMod] = await Promise.all([
    import(pathToFileURL(path.join(studyPath, "page.ts")).href),
    import(pathToFileURL(path.join(studyPath, foldersFile)).href),
    import(pathToFileURL(path.join(studyPath, "domain.ts")).href),
    import(pathToFileURL(path.join(studyPath, "index.ts")).href),
  ]);

  const studySpec = findStudySpec(studyMod);
  const meta = studySpec?.meta ?? {};
  const blankCrfs = studySpec?.options?.blankCrfs ?? {};
  const title = meta.title?.ko || meta.title?.en || "";

  return {
    pages: pageMod.CRF_PAGES as Record<string, any>,
    folders: folderMod.FOLDERS as any[],
    domains: domainMod.CRF_DOMAINS as Record<string, any>,
    studyInfo: {
      protocolNo: String(meta.protocolNo ?? path.basename(studyPath)),
      title: String(title),
      phase: String(meta.phaseDisp ?? ""),
      coverDescriptions: (blankCrfs.cover?.descriptions ?? []) as Array<{
        label: string;
        text: string;
      }>,
      headerItems: (blankCrfs.header?.items ?? []) as any[],
    },
  };
}

function findStudySpec(studyMod: Record<string, any>): any {
  for (const [key, value] of Object.entries(studyMod)) {
    if (key.startsWith("STUDY_") && value?.meta && value?.pages) return value;
  }
  return null;
}

export function inspectVisitPlacement(folders: any[]): string[] {
  const normalVisits = folders
    .filter((folder) => folder.type === "NORMAL_VISIT")
    .flatMap((folder) => folder.visits ?? [])
    .filter(
      (visit) =>
        !(
          (visit.crfs ?? []).some((crf: any) => crf.page === "EN") ||
          visit.reservedFor === "ENROLL"
        )
    );

  if (!normalVisits.length) return [];

  const warnings: string[] = [];
  const firstVisit = normalVisits[0];
  const lastVisit = normalVisits[normalVisits.length - 1];

  for (const visit of normalVisits) {
    const pages = new Set((visit.crfs ?? []).map((crf: any) => crf.page));
    if (visit !== firstVisit && pages.has("IE")) {
      warnings.push(
        `IE is placed in ${visit.id}. It is usually expected only in screening or the first visit.`
      );
    }
    if (visit !== lastVisit && pages.has("DA")) {
      warnings.push(
        `DA is placed in ${visit.id}. It is usually expected only in the end or last visit.`
      );
    }
  }

  return warnings;
}

function removeFlag(args: string[], flag: string): boolean {
  const index = args.indexOf(flag);
  if (index < 0) return false;
  args.splice(index, 1);
  return true;
}

function popOption(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  args.splice(index, 2);
  return value;
}
