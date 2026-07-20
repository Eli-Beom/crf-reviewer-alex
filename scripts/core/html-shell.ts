/** HTML scaffold builder for internal review output */

import { buildNav, getPageDisplayLabel } from "./nav.js";
import { CSS }                from "./css.js";
import { JS_INTERNAL }        from "./js-internal.js";
import type { BuildHtmlOptions } from "./types.js";

const REVIEWER_VERSION = "v0.16";

export function buildHtml(opts: BuildHtmlOptions): string {
  const { study, studyInfo, pages, folders, domains } = opts;

  const navJson        = JSON.stringify(buildNav(folders, pages, domains));
  const scheduleJson   = JSON.stringify(buildSchedule(folders, pages, domains));
  const pagesJson      = JSON.stringify(pages);
  const domainsJson    = JSON.stringify(domains);
  const JS = JS_INTERNAL;

  const internalModals = "";

  const helpExtra = "";

  const topbarButtons = `
        <button id="btn-toggle-panel" class="tb-btn">검토 기록 <span id="comment-badge"></span></button>
        <button id="btn-export" class="tb-btn">의견 내보내기</button>
        <button id="btn-export-html" class="tb-btn">댓글 포함 HTML</button>
        <button id="btn-import" class="tb-btn">의견 가져오기</button>
        <input id="import-file" type="file" accept=".json" style="display:none"/>
        <button id="btn-help" class="tb-btn ghost">도움말</button>`;

  const panelTabs = `
    <div class="panel-tabs">
      <button id="tab-comments" class="panel-tab active">미완료 <span id="tab-badge-comments" class="panel-tab-badge"></span></button>
      <button id="tab-completed" class="panel-tab">완료 <span id="tab-badge-completed" class="panel-tab-badge"></span></button>
    </div>`;

  // ?? data constants injected ???????????????????????????????????????????????
  const embeddedReviewState = opts.reviewState
    ? `const EMBEDDED_REVIEW_STATE = ${JSON.stringify(opts.reviewState)};`
    : `const EMBEDDED_REVIEW_STATE = {};`;

  const dataConsts = `${embeddedReviewState}
const STUDY = ${JSON.stringify(study)};
const STUDY_INFO = ${JSON.stringify(studyInfo)};
const NAV    = ${navJson};
const SCHEDULE = ${scheduleJson};
const PAGES  = ${pagesJson};
const DOMAINS = ${domainsJson};`;

  const modeLabel = "internal";
  const versionLabel = REVIEWER_VERSION;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CRF Reviewer ${versionLabel} - ${study}</title>
<style>${CSS}</style>
</head>
<body>
<div id="app">

  <!-- Left nav -->
  <aside id="sidebar">
    <div id="sidebar-header">
      <div class="study-label">${study}</div>
      <div class="study-subtitle">CRF Reviewer ${versionLabel} <span style="font-size:10px;opacity:.6">${modeLabel}</span></div>
    </div>
    <nav id="nav"></nav>
  </aside>

  <!-- Center CRF body -->
  <div id="center">
    <div id="topbar">
      <span id="page-breadcrumb"></span>
      <div id="topbar-actions">
        ${topbarButtons}
      </div>
    </div>
    <div id="crf-body"></div>
  </div>

  <!-- Right comment panel -->
  <aside id="comment-panel">
    <div id="panel-header">
      <span id="panel-title">검토 기록</span>
      <button id="panel-close" title="닫기">x</button>
    </div>
    ${panelTabs}
    <div id="panel-list"></div>
  </aside>

</div>

<!-- Help modal -->
<div id="help-overlay">
  <div id="help-modal">
    <div id="help-header">
      <span>CRF Reviewer 사용법</span>
      <button id="help-close">x</button>
    </div>
    <div id="help-body">

      <div class="help-section">
        <div class="help-section-title">CRF 페이지 확인</div>
        <div class="help-step">
          <span class="step-num">1</span>
          <div>왼쪽 사이드바에서 방문과 페이지를 클릭하면 해당 CRF 화면이 표시됩니다.</div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">검토 의견 남기기</div>
        <div class="help-step">
          <span class="step-num">1</span>
          <div>각 항목 오른쪽의 댓글 버튼을 클릭합니다.</div>
        </div>
        <div class="help-step">
          <span class="step-num">2</span>
          <div>수정 요청 내용을 입력하고 저장을 클릭합니다.</div>
        </div>
        <div class="help-step">
          <span class="step-num">3</span>
          <div>등록된 의견은 오른쪽 검토 기록 패널에서 확인할 수 있습니다.</div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">의견 내보내기</div>
        <div class="help-step">
          <span class="step-num">1</span>
          <div>상단의 의견 내보내기 버튼을 클릭합니다.</div>
        </div>
        <div class="help-step">
          <span class="step-num">2</span>
          <div><code>comments-스터디명-날짜.json</code> 파일이 다운로드됩니다.</div>
        </div>
        <div class="help-step">
          <span class="step-num">3</span>
          <div>HTML 파일과 JSON 파일을 함께 전달하면 의견을 공유할 수 있습니다.</div>
        </div>
      </div>
${helpExtra}
      <div class="help-section">
        <div class="help-section-title">의견 가져오기</div>
        <div class="help-step">
          <span class="step-num">1</span>
          <div>받은 HTML 파일을 브라우저에서 엽니다.</div>
        </div>
        <div class="help-step">
          <span class="step-num">2</span>
          <div>상단의 의견 가져오기 버튼을 클릭합니다.</div>
        </div>
        <div class="help-step">
          <span class="step-num">3</span>
          <div>같이 받은 JSON 파일을 선택하면 의견이 화면에 반영됩니다.</div>
        </div>
      </div>

    </div>
  </div>
</div>
${internalModals}
<!-- Comment modal -->
<div id="modal-overlay">
  <div id="modal">
    <div id="modal-meta"></div>
    <textarea id="modal-textarea" placeholder="수정 요청 내용을 입력하세요." rows="5"></textarea>
    <div id="modal-actions">
      <button id="modal-delete" class="btn-danger">삭제</button>
      <div style="flex:1"></div>
      <button id="modal-cancel" class="btn-ghost">취소</button>
      <button id="modal-save" class="btn-primary">저장</button>
    </div>
  </div>
</div>

<script>
${dataConsts}
${JS}
</script>
</body>
</html>`;
}

function buildSchedule(
  folders: any[],
  pages: Record<string, any>,
  domains: Record<string, any>
) {
  const visits: { id: string; label: string }[] = [];
  const rowMap = new Map<string, { pageId: string; label: string; order: number; cells: boolean[] }>();
  let allVisitIndex: number | null = null;

  const ensureVisitColumn = (id: string, label: string) => {
    const visitIndex = visits.length;
    visits.push({ id, label });
    for (const row of rowMap.values()) row.cells.push(false);
    return visitIndex;
  };

  for (const folder of folders) {
    if (String(folder.type ?? "").startsWith("REPORT_")) continue;
    for (const visit of folder.visits ?? []) {
      const visitType = String(visit.visit?.type ?? visit.type ?? folder.type ?? "");
      const visitLabel =
        typeof visit.label === "string"
          ? visit.label
          : visit.label?.prefix
            ? `${visit.label.prefix}1`
            : `${folder.label} ${visit.id}`;

      const visitIndex =
        visitType === "ALL_VISIT"
          ? allVisitIndex ?? (allVisitIndex = ensureVisitColumn("ALL", "All"))
          : ensureVisitColumn(String(visit.id ?? visits.length), normalizeScheduleVisitLabel(visitLabel, visitType));

      for (const crf of visit.crfs ?? []) {
        const pageId = String(crf.page ?? "");
        if (!pageId || !pages[pageId]) continue;
        if (!rowMap.has(pageId)) {
          const priority = getScheduleRowOrder(pageId, pages, domains, rowMap.size);
          rowMap.set(pageId, {
            pageId,
            label: getPageDisplayLabel(pageId, pages, domains),
            order: Number.isFinite(priority) ? priority : rowMap.size,
            cells: Array(visits.length).fill(false),
          });
        }
        rowMap.get(pageId)!.cells[visitIndex] = true;
      }
    }
  }

  return { visits, rows: Array.from(rowMap.values()).sort((a, b) => a.order - b.order) };
}

function normalizeScheduleVisitLabel(label: string, visitType: string): string {
  if (visitType === "UNSCHEDULED_VISIT") {
    const match = label.match(/UV\d*/i);
    return match ? match[0].toUpperCase() : "UV1";
  }
  return label;
}

function getScheduleRowOrder(
  pageId: string,
  pages: Record<string, any>,
  domains: Record<string, any>,
  fallback: number
): number {
  if (pageId === "PROM" && Number.isFinite(Number(domains.CSS?.priority))) {
    return Number(domains.CSS.priority) + 0.5;
  }
  if (Number.isFinite(Number(domains[pageId]?.priority))) {
    return Number(domains[pageId].priority);
  }
  const domainId = String(pages[pageId]?.domain ?? "");
  if (Number.isFinite(Number(domains[domainId]?.priority))) {
    return Number(domains[domainId].priority);
  }
  return fallback;
}
