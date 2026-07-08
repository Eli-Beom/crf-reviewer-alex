/**
 * CRF Word Document Generator
 * Usage: npx tsx scripts/generate-docx.ts <study-dir-name> [output.docx]
 * Example: npx tsx scripts/generate-docx.ts SAMPLE_STUDY
 */

import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
} from "docx";

const studyDir = process.argv[2];
if (!studyDir) {
  console.error("Usage: npx tsx scripts/generate-docx.ts <study-dir-name> [output.docx]");
  process.exit(1);
}

const CRF_BASE = process.env.CRF_BASE;
if (!CRF_BASE) {
  console.error("CRF_BASE is required. Set it to the directory containing CRF study folders.");
  process.exit(1);
}
const studyPath = path.resolve(CRF_BASE, studyDir);
if (!fs.existsSync(studyPath)) {
  console.error(`Study directory not found: ${studyPath}`);
  process.exit(1);
}

const outputFile = process.argv[3] ?? path.join(studyPath, `preview-${studyDir}.docx`);

// ─── constants ───────────────────────────────────────────────────────────────

// A4, 25mm margins → content width = 210 - 25*2 = 160mm = ~9072 DXA
const PAGE_W   = 11906;
const PAGE_H   = 16838;
const MARGIN   = 1418; // ~25mm
const CONTENT_W = PAGE_W - MARGIN * 2; // 9070

const GRAY_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" };
const BORDERS = { top: GRAY_BORDER, bottom: GRAY_BORDER, left: GRAY_BORDER, right: GRAY_BORDER };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const pageMod   = await import(pathToFileURL(path.join(studyPath, "page.ts")).href);
  const folderMod = await import(pathToFileURL(path.join(studyPath, "folders.ts")).href);
  const domainMod = await import(pathToFileURL(path.join(studyPath, "domain.ts")).href);

  const CRF_PAGES: Record<string, any>  = pageMod.CRF_PAGES;
  const FOLDERS: any[]                  = folderMod.FOLDERS;
  const CRF_DOMAINS: Record<string, any> = domainMod.CRF_DOMAINS;

  const doc = buildDoc(studyDir, CRF_PAGES, FOLDERS, CRF_DOMAINS);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outputFile, buf);
  console.log(`✅  Word document written to: ${outputFile}`);
}

// ─── document builder ────────────────────────────────────────────────────────

function buildDoc(
  study: string,
  pages: Record<string, any>,
  folders: any[],
  domains: Record<string, any>
): Document {
  const sections: any[] = [];

  // collect visit→pages in order (deduplicate page renders)
  const rendered = new Set<string>();
  const visitMap: { visitLabel: string; pageId: string }[] = [];

  for (const folder of folders) {
    for (const visit of folder.visits ?? []) {
      const visitLabel = typeof visit.label === "string"
        ? visit.label
        : `${folder.label} ${visit.id}`;
      for (const crf of visit.crfs ?? []) {
        if (pages[crf.page]) visitMap.push({ visitLabel, pageId: crf.page });
      }
    }
  }

  // title page
  sections.push(makeTitleSection(study, visitMap, domains));

  // one section per unique page (page break between)
  const seen = new Set<string>();
  for (const { visitLabel, pageId } of visitMap) {
    if (seen.has(pageId)) continue;
    seen.add(pageId);
    const page  = pages[pageId];
    const label = domains[pageId]?.label ?? pageId;
    sections.push(makePageSection(pageId, label, page, study));
  }

  return new Document({
    styles: {
      default: {
        document: { run: { font: "Malgun Gothic", size: 20 } }, // 10pt
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Malgun Gothic", color: "1E293B" },
          paragraph: {
            spacing: { before: 320, after: 160 },
            outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1D4ED8", space: 4 } },
          },
        },
        {
          id: "Heading2", name: "Heading 2",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Malgun Gothic", color: "374151" },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 20, bold: true, font: "Malgun Gothic", color: "6B7280" },
          paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 },
        },
      ],
    },
    sections,
  });
}

// ─── title section ────────────────────────────────────────────────────────────

function makeTitleSection(study: string, visitMap: { visitLabel: string; pageId: string }[], domains: Record<string, any>) {
  const children: any[] = [
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 },
      children: [new TextRun({ text: "CRF 검토 문서", font: "Malgun Gothic", size: 52, bold: true, color: "1E293B" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: study, font: "Malgun Gothic", size: 28, color: "1D4ED8", bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 1600 },
      children: [new TextRun({ text: new Date().toLocaleDateString("ko-KR"), font: "Malgun Gothic", size: 22, color: "9CA3AF" })],
    }),

    // TOC-like page list table
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("CRF 페이지 목록")],
    }),
    makePageListTable(visitMap, domains),

    new Paragraph({ children: [new PageBreak()] }),
  ];

  return {
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: { default: makeHeader(study) },
    footers: { default: makeFooter() },
    children,
  };
}

function makePageListTable(visitMap: { visitLabel: string; pageId: string }[], domains: Record<string, any>) {
  // group by visitLabel
  const groups: Record<string, string[]> = {};
  const order: string[] = [];
  for (const { visitLabel, pageId } of visitMap) {
    if (!groups[visitLabel]) { groups[visitLabel] = []; order.push(visitLabel); }
    if (!groups[visitLabel].includes(pageId)) groups[visitLabel].push(pageId);
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("방문", 3500),
      headerCell("페이지", 1200),
      headerCell("도메인", 4370),
    ],
  });

  const rows = [headerRow];
  for (const visitLabel of order) {
    const pageIds = groups[visitLabel];
    pageIds.forEach((pageId, i) => {
      rows.push(new TableRow({
        children: [
          bodyCell(i === 0 ? visitLabel : "", 3500, i === 0 ? "F8FAFC" : "FFFFFF"),
          bodyCell(pageId, 1200, "FFFFFF", true),
          bodyCell(domains[pageId]?.label ?? pageId, 4370),
        ],
      }));
    });
  }

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [3500, 1200, 4370],
    rows,
  });
}

// ─── page section ─────────────────────────────────────────────────────────────

function makePageSection(pageId: string, domainLabel: string, page: any, study: string) {
  const children: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(`${pageId}  ${domainLabel}`)],
    }),
  ];

  for (const section of page.sections ?? []) {
    children.push(...renderSection(section, pageId));
  }

  return {
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: { default: makeHeader(study) },
    footers: { default: makeFooter() },
    children,
  };
}

function renderSection(section: any, pageId: string): any[] {
  const labelText = section.label?.text || section.id;
  const labelSize = section.itemLabelSize || "NORMAL";

  const out: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(labelText)],
    }),
  ];

  // items
  const fieldItems = section.items?.filter((i: any) => i.type !== "DESCRIPTION" && i.type !== "TABLE") ?? [];
  const tableItems = section.items?.filter((i: any) => i.type === "TABLE") ?? [];
  const descItems  = section.items?.filter((i: any) => i.type === "DESCRIPTION") ?? [];

  // description boxes first
  for (const item of descItems) {
    out.push(renderDescription(item));
  }

  // fields as a table
  if (fieldItems.length > 0) {
    out.push(renderFieldsTable(fieldItems, labelSize));
  }

  // embedded tables
  for (const item of tableItems) {
    out.push(new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [new TextRun({ text: item.id || "표", bold: true, size: 20, color: "374151" })],
    }));
    out.push(renderEmbeddedTable(item));
  }

  out.push(spacer(120));
  return out;
}

// ─── fields table ─────────────────────────────────────────────────────────────
// Renders all regular items in a 3-col layout: Label | ID | Control

function renderFieldsTable(items: any[], labelSize: string): Table {
  const labelW = labelSize === "DOUBLE" ? 4000 : 3000;
  const idW    = 1400;
  const ctrlW  = CONTENT_W - labelW - idW;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("항목명", labelW),
      headerCell("항목 ID", idW),
      headerCell("입력 형태", ctrlW),
    ],
  });

  const rows = [headerRow, ...items.map(item => makeFieldRow(item, labelW, idW, ctrlW))];

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [labelW, idW, ctrlW],
    rows,
  });
}

function makeFieldRow(item: any, labelW: number, idW: number, ctrlW: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: BORDERS,
        width: { size: labelW, type: WidthType.DXA },
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: item.label || "", font: "Malgun Gothic", size: 20 }),
              ...(item.required ? [new TextRun({ text: " *", color: "DC2626", bold: true })] : []),
            ],
          }),
        ],
      }),
      new TableCell({
        borders: BORDERS,
        width: { size: idW, type: WidthType.DXA },
        margins: CELL_MARGINS,
        shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            children: [new TextRun({ text: item.id || "", font: "Courier New", size: 18, color: "6B7280" })],
          }),
        ],
      }),
      new TableCell({
        borders: BORDERS,
        width: { size: ctrlW, type: WidthType.DXA },
        margins: CELL_MARGINS,
        children: renderControlCell(item),
      }),
    ],
  });
}

function renderControlCell(item: any): Paragraph[] {
  switch (item.type) {
    case "TEXT": {
      const fmt = item.format || {};
      const isNum = fmt.interface === "NUMBER";
      const suffix = item.uiSuffix ? ` (${item.uiSuffix})` : "";
      const hint = isNum ? `숫자 입력${suffix}` : `텍스트 입력${suffix}`;
      return [p(hint, "9CA3AF")];
    }
    case "DATE":
      return [p("날짜 (YYYY-MM-DD)", "9CA3AF")];
    case "SYS_VAL":
      return [p(item.blankPlaceholder || item.reserved || "시스템 자동 입력", "9CA3AF", true)];
    case "SEQUENCE":
      return [p("#  자동 번호", "9CA3AF")];
    case "CONSTANT":
      return [p(String(item.value ?? ""), "374151")];
    case "SINGLE_SELECT": {
      const codes = item.itemCode?.codes || [];
      const layout = item.layout || "DROPDOWN";
      if (layout === "RADIO") {
        return codes.map((c: any) =>
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({ text: "○  ", color: "9CA3AF", size: 20 }),
              new TextRun({ text: String(c.uiVal), size: 20 }),
            ],
          })
        );
      }
      // DROPDOWN
      return [
        new Paragraph({
          children: [
            new TextRun({ text: "▼  드롭다운  ", color: "9CA3AF", size: 18 }),
            new TextRun({ text: codes.map((c: any) => c.uiVal).join(" / "), size: 18, color: "374151" }),
          ],
        }),
      ];
    }
    default:
      return [p(`[${item.type}]`, "9CA3AF")];
  }
}

// ─── embedded TABLE type ───────────────────────────────────────────────────────

function renderEmbeddedTable(item: any): Table {
  const headers: any[] = item.headers || [];
  const rows: any[][]  = item.rows || [];
  const total = headers.reduce((s: number, h: any) => s + (h.weight || 1), 0);
  const colWidths = headers.map((h: any) => Math.round((h.weight || 1) / total * CONTENT_W));

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h: any, i: number) => headerCell(h.label, colWidths[i])),
  });

  const bodyRows = rows.map(row =>
    new TableRow({
      children: row.map((cell: any, i: number) => {
        const [content] = renderControlCell(cell);
        return new TableCell({
          borders: BORDERS,
          width: { size: colWidths[i] || 1000, type: WidthType.DXA },
          margins: CELL_MARGINS,
          children: [content || new Paragraph({ children: [] })],
        });
      }),
    })
  );

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows],
  });
}

// ─── description ──────────────────────────────────────────────────────────────

function renderDescription(item: any): Table {
  const text = (item.description || []).map((d: any) => d.text).join(" ");
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "1D4ED8" },
            },
            shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
            margins: CELL_MARGINS,
            width: { size: CONTENT_W, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text, font: "Malgun Gothic", size: 18, color: "1E40AF" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ─── header / footer ──────────────────────────────────────────────────────────

function makeHeader(study: string) {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 4 } },
        children: [
          new TextRun({ text: study, font: "Malgun Gothic", size: 16, color: "9CA3AF" }),
          new TextRun({ text: "\tCRF 검토 문서", font: "Malgun Gothic", size: 16, color: "9CA3AF" }),
        ],
        tabStops: [{ type: "right" as any, position: CONTENT_W }],
      }),
    ],
  });
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 4 } },
        children: [
          new TextRun({ text: "- ", font: "Malgun Gothic", size: 16, color: "9CA3AF" }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Malgun Gothic", size: 16, color: "9CA3AF" }),
          new TextRun({ text: " -", font: "Malgun Gothic", size: 16, color: "9CA3AF" }),
        ],
      }),
    ],
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "1E293B", type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, font: "Malgun Gothic", size: 18, bold: true, color: "F1F5F9" })],
      }),
    ],
  });
}

function bodyCell(text: string, width: number, fill = "FFFFFF", mono = false): TableCell {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        children: [new TextRun({ text, font: mono ? "Courier New" : "Malgun Gothic", size: 18, bold: mono })],
      }),
    ],
  });
}

function p(text: string, color = "111827", italic = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Malgun Gothic", size: 20, color, italics: italic })],
  });
}

function spacer(before = 0): Paragraph {
  return new Paragraph({ spacing: { before }, children: [] });
}

// ─── run ─────────────────────────────────────────────────────────────────────

main().catch(e => { console.error(e); process.exit(1); });
