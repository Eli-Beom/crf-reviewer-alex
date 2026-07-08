/**
 * Client-side JS for the **내부용(internal)** HTML.
 * Full features: comments + type switcher + suggestions + overrides panel.
 */

export const JS_INTERNAL = `
(function(){

// ── state ──────────────────────────────────────────────────────────────────
const LS_KEY          = 'crf-comments::'  + STUDY;
const LS_OVERRIDE_KEY = 'crf-overrides::' + STUDY;
const REVIEW_STATE = (typeof EMBEDDED_REVIEW_STATE !== 'undefined') ? EMBEDDED_REVIEW_STATE : {};

let comments = { ...(REVIEW_STATE.comments || {}) };
try { comments = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e){}
comments = { ...(REVIEW_STATE.comments || {}), ...comments };

let typeOverrides = { ...(REVIEW_STATE.typeOverrides || {}) };
try { typeOverrides = JSON.parse(localStorage.getItem(LS_OVERRIDE_KEY) || '{}'); } catch(e){}
typeOverrides = { ...(REVIEW_STATE.typeOverrides || {}), ...typeOverrides };

// ── CDASH/CDISC 표준 룰 ────────────────────────────────────────────────────
const CDISC_RULES = [
  { suffix:'DTC',    type:'DATE',     reason:'CDASH: *DTC = Date/Time Character (ISO 8601)' },
  { suffix:'DAT',    type:'DATE',     reason:'CDASH: *DAT = Date field' },
  { suffix:'CAT',    type:'DROPDOWN', reason:'CDASH: *CAT = Category (coded list)' },
  { suffix:'SCAT',   type:'DROPDOWN', reason:'CDASH: *SCAT = Subcategory (coded list)' },
  { suffix:'YN',     type:'RADIO',    reason:'CDASH: *YN = Yes/No indicator' },
  { suffix:'FL',     type:'RADIO',    reason:'CDASH: *FL = Flag (Y/N)' },
  { suffix:'ONGO',   type:'RADIO',    reason:'CDASH: *ONGO = Ongoing indicator (Y/N)' },
  { suffix:'ORRES',  type:'TEXT',     reason:'SDTM: *ORRES = Original Result (free text)' },
  { suffix:'STRESC', type:'TEXT',     reason:'SDTM: *STRESC = Standardized Result (char)' },
  { exact:'SEX',     type:'RADIO',    reason:'CDASH: SEX = Sex (M/F/U)' },
  { exact:'RACE',    type:'DROPDOWN', reason:'CDASH: RACE = Race (coded list)' },
  { exact:'ETHNIC',  type:'DROPDOWN', reason:'CDASH: ETHNIC = Ethnicity (coded list)' },
  { exact:'COUNTRY', type:'DROPDOWN', reason:'CDASH: COUNTRY = Country (ISO 3166)' },
];

function getCdiscRule(itemId) {
  const id = String(itemId || '').toUpperCase();
  for (const rule of CDISC_RULES) {
    if (rule.exact  && id === rule.exact)         return rule;
    if (rule.suffix && id.endsWith(rule.suffix))  return rule;
  }
  return null;
}

// ── type system ─────────────────────────────────────────────────────────────
const TYPE_ALTS = {
  'RADIO':     ['DROPDOWN'],
  'DROPDOWN':  ['RADIO'],
  'TEXT':      ['DATE', 'MULTILINE'],
  'DATE':      ['TEXT'],
  'MULTILINE': ['TEXT', 'DATE'],
};
const TYPE_LABELS = {
  'RADIO':     { name: 'RADIO',      desc: '라디오 버튼' },
  'DROPDOWN':  { name: 'DROPDOWN',   desc: '드롭다운 선택' },
  'TEXT':      { name: 'TEXT',       desc: '한 줄 텍스트' },
  'DATE':      { name: 'DATE',       desc: '날짜 선택' },
  'MULTILINE': { name: 'MULTILINE',  desc: '여러 줄 텍스트' },
};

function getEffectiveType(item) {
  if (!item) return 'UNKNOWN';
  if (item.type === 'SINGLE_SELECT') return item.layout === 'RADIO' ? 'RADIO' : 'DROPDOWN';
  if (item.type === 'TEXT') return (item.appearance === 'MULTILINE' || item.appearance === 'MULTI_LINE') ? 'MULTILINE' : 'TEXT';
  return item.type;
}

function renderControlForType(item, toType) {
  const codes = item.itemCode?.codes || [];
  switch (toType) {
    case 'RADIO': {
      const opts = codes.map(c=>'<div class="radio-opt"><div class="radio-dot"></div>'+esc(String(c.uiVal))+'</div>').join('');
      return '<div class="radio-group">'+opts+'</div>';
    }
    case 'DROPDOWN': {
      const opts = codes.map(c=>'<option>'+esc(String(c.uiVal))+'</option>').join('');
      return '<select class="mock-select"><option disabled selected>선택</option>'+opts+'</select>';
    }
    case 'TEXT': {
      const suffix = item.uiSuffix ? '<span class="mock-suffix">'+esc(item.uiSuffix)+'</span>' : '';
      const input = '<div class="mock-input">텍스트 입력</div>';
      return suffix ? '<span class="mock-input-wrap">'+input+suffix+'</span>' : input;
    }
    case 'DATE':      return '<div class="mock-input date">YYYY-MM-DD</div>';
    case 'MULTILINE': return '<div class="mock-input" style="height:54px;max-width:400px;align-items:flex-start;padding-top:6px;color:#9ca3af">텍스트 입력…</div>';
    default:          return renderControl(item);
  }
}

function getCodeDiff(origType, toType, item) {
  const fmt = item.format ? JSON.stringify(item.format) : null;
  const dir = item.direction ? '"' + item.direction + '"' : '"VERTICAL"';
  const from = [], to = [];

  if (origType === 'RADIO' && toType === 'DROPDOWN') {
    from.push('layout: "RADIO"');
    if (item.direction) from.push('direction: ' + dir);
    to.push('layout: "DROPDOWN"');
    if (item.direction) to.push('// direction 속성 제거');
  } else if (origType === 'DROPDOWN' && toType === 'RADIO') {
    from.push('layout: "DROPDOWN"');
    to.push('layout: "RADIO"');
    to.push('direction: "VERTICAL"');
  } else if (origType === 'TEXT' && toType === 'DATE') {
    from.push('type: "TEXT"');
    if (fmt) from.push('format: ' + fmt);
    to.push('type: "DATE"');
    to.push('format: "YYYY-MM-DD"');
    to.push('// typeable: true  (선택)');
  } else if (origType === 'DATE' && toType === 'TEXT') {
    from.push('type: "DATE"');
    if (fmt) from.push('format: ' + fmt);
    to.push('type: "TEXT"');
    to.push('format: { type: "TEXT", maxlen: 100 }');
  } else if (origType === 'TEXT' && toType === 'MULTILINE') {
    from.push('type: "TEXT"');
    if (fmt) from.push('format: ' + fmt);
    to.push('type: "TEXT"');
    to.push('appearance: "MULTILINE"');
    if (fmt) to.push('// format: ' + fmt + '  제거 가능');
  } else if (origType === 'MULTILINE' && toType === 'TEXT') {
    from.push('type: "TEXT"');
    from.push('appearance: "MULTILINE"');
    to.push('type: "TEXT"');
    to.push('// appearance 제거');
  } else if (origType === 'MULTILINE' && toType === 'DATE') {
    from.push('type: "TEXT"');
    from.push('appearance: "MULTILINE"');
    to.push('type: "DATE"');
    to.push('format: "YYYY-MM-DD"');
    to.push('// appearance 제거');
  } else if (origType === 'DATE' && toType === 'MULTILINE') {
    from.push('type: "DATE"');
    if (fmt) from.push('format: ' + fmt);
    to.push('type: "TEXT"');
    to.push('appearance: "MULTILINE"');
    to.push('// format 제거');
  }
  return { from, to };
}

function getTypeRecommendation(itemId, itemLabel, origType) {
  let raw = TYPE_STATS[itemId];
  let source = 'id';

  if (!raw || Object.values(raw).reduce((a,b)=>a+b,0) < 0.1) {
    const normLabel = String(itemLabel||'').trim().toLowerCase();
    if (normLabel && LABEL_STATS[normLabel]) {
      raw = LABEL_STATS[normLabel];
      source = 'label';
    }
  }

  if (!raw) return { recommended: null, stats: [], source: null };

  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total < 0.05) return { recommended: null, stats: [], source: null };

  const stats = Object.entries(raw)
    .map(([type, score]) => ({ type, score, pct: Math.round(score / total * 100) }))
    .sort((a, b) => b.score - a.score);

  const topAny = stats[0];
  const recommended = (topAny && topAny.pct >= 60 && topAny.type !== origType) ? topAny.type : null;

  return { recommended, stats, source };
}

function findItem(pageId, sectionId, itemId) {
  const page = PAGES[pageId];
  if (!page) return null;
  const sec = (page.sections||[]).find(s=>s.id===sectionId);
  if (!sec) return null;
  return (sec.items||[]).find(i=>i.id===itemId)||null;
}

function saveOverrides() { localStorage.setItem(LS_OVERRIDE_KEY, JSON.stringify(typeOverrides)); }

let currentPageId = null;
let panelOpen = true;
let pendingKey = null;
let activeTab = 'comments';

// ── boot ───────────────────────────────────────────────────────────────────
buildNav();
updateBadge();
updatePanel();

const firstNav = document.querySelector('.nav-crf');
if (firstNav) firstNav.click();

// ── nav ────────────────────────────────────────────────────────────────────
function buildNav() {
  const navEl = document.getElementById('nav');
  const scheduleBtn = el('div', 'nav-crf nav-schedule');
  scheduleBtn.dataset.pageId = '__schedule';
  scheduleBtn.innerHTML =
    '<span class="nav-page-id">SCH</span>' +
    '<span class="nav-domain">Schedule</span>' +
    '<span class="nav-comment-dot" style="display:none"></span>';
  scheduleBtn.addEventListener('click', () => selectSchedule(scheduleBtn));
  navEl.appendChild(scheduleBtn);
  NAV.forEach(visit => {
    const g = el('div', 'nav-visit-header', visit.visitLabel);
    navEl.appendChild(g);
    visit.pages.forEach(p => {
      const btn = el('div', 'nav-crf');
      btn.dataset.pageId = p.pageId;
      btn.innerHTML =
        '<span class="nav-page-id">'+esc(p.pageId)+'</span>' +
        '<span class="nav-domain">'+esc(p.domainLabel)+'</span>' +
        '<span class="nav-comment-dot" style="display:none"></span>';
      btn.addEventListener('click', () => selectPage(btn, visit.visitLabel, p));
      navEl.appendChild(btn);
    });
  });
  refreshNavDots();
}

function selectPage(btn, visitLabel, pageInfo) {
  document.querySelectorAll('.nav-crf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPageId = pageInfo.pageId;

  document.getElementById('page-breadcrumb').innerHTML =
    esc(visitLabel) +
    '<span style="margin:0 6px;color:#9ca3af">&#8250;</span>' +
    '<strong>' + esc(pageInfo.domainLabel) + ' (' + esc(pageInfo.pageId) + ')</strong>';

  const page = PAGES[pageInfo.pageId];
  document.getElementById('crf-body').innerHTML = page
    ? renderPage(page, pageInfo.pageId)
    : '<div class="empty-state"><div class="icon">&#128203;</div><p>페이지를 찾을 수 없습니다.</p></div>';

  applyHighlights();
}

function selectSchedule(btn) {
  document.querySelectorAll('.nav-crf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPageId = '__schedule';
  document.getElementById('page-breadcrumb').innerHTML =
    '<strong>Schedule</strong><span style="margin-left:6px;color:#9ca3af">folders.ts 방문/CRF 매트릭스 기준</span>';
  document.getElementById('crf-body').innerHTML = renderSchedule();
}

// ── render CRF ─────────────────────────────────────────────────────────────
function renderPage(page, pageId) {
  return (page.sections || []).map(sec => renderSection(sec, pageId)).join('');
}

function renderSection(sec, pageId) {
  const labelText = sec.label?.text || sec.id;
  const labelSize = sec.itemLabelSize || 'NORMAL';
  const items = (sec.items || []).map((item, idx) => renderItem(item, labelSize, pageId, sec.id, labelText, idx)).join('');
  return '<div class="crf-section">' +
    '<div class="section-header">'+esc(labelText)+'</div>' +
    items + '</div>';
}

function renderItem(item, labelSize, pageId, sectionId, sectionLabel, itemIndex) {
  if (item.type === 'DESCRIPTION') return renderDescription(item, pageId, sectionId, sectionLabel, itemIndex);
  if (item.type === 'TABLE')       return renderTable(item, pageId, sectionId, sectionLabel);
  if (item.type === 'APPENDABLE_TABLE') return renderAppendableTable(item, pageId, sectionId, sectionLabel);
  return renderFieldRow(item, labelSize, pageId, sectionId, sectionLabel);
}

function renderSchedule() {
  if (!SCHEDULE || !SCHEDULE.visits || !SCHEDULE.visits.length) return '';
  const head = '<tr><th></th>' + SCHEDULE.visits.map(v => '<th>'+esc(v.label)+'</th>').join('') + '</tr>';
  const rows = (SCHEDULE.rows || []).map(row =>
    '<tr><td>'+esc(row.label)+'</td>' +
    row.cells.map(has => '<td>'+(has ? '<span class="schedule-check">&#9633;</span>' : '')+'</td>').join('') +
    '</tr>'
  ).join('');
  return '<div class="schedule-section">' +
    '<div class="schedule-header">Schedule</div>' +
    '<div class="schedule-wrap"><table class="schedule-table"><thead>'+head+'</thead><tbody>'+rows+'</tbody></table></div>' +
  '</div>';
}

function renderFieldRow(item, labelSize, pageId, sectionId, sectionLabel) {
  const key = makeKey(pageId, sectionId, item.id || '');
  const hasComment = !!comments[key];
  const isCriteriaSection = pageId === 'IE' && (sectionId === 'IN' || sectionId === 'EX');
  const labelCls = isCriteriaSection ? 'item-label criteria' : (labelSize === 'DOUBLE' ? 'item-label double' : 'item-label');
  const rowCls = 'item-row' + (hasComment ? ' has-comment' : '');

  const origType = getEffectiveType(item);
  const override = typeOverrides[key];
  const dispType = override ? override.toType : origType;
  const alts = TYPE_ALTS[origType] || [];
  const typeBadgeHtml = alts.length > 0
    ? '<button class="type-badge type-'+dispType.toLowerCase()+(override?' override':'')+
        '" data-key="'+esc(key)+
        '" data-page="'+esc(pageId)+
        '" data-section="'+esc(sectionId)+
        '" data-item-id="'+esc(item.id||'')+
        '" data-orig-type="'+esc(origType)+
        '" onclick="openTypeModal(this)">'+esc(dispType)+' ▾</button>'
    : '';

  const controlHtml = override
    ? renderControlForType(item, override.toType)
    : renderControl(item);

  return '<div class="'+rowCls+'" data-key="'+esc(key)+'">' +
    '<div class="'+labelCls+'">' +
      '<div class="item-label-main">' +
        '<span class="item-label-text">'+esc(item.label || '')+'</span>' +
        (item.required ? '<span class="required-mark">*</span>' : '') +
        renderLabelDescriptions(item, 'inline') +
      '</div>' +
      renderItemId(item) +
    '</div>' +
    '<div class="item-control">'+controlHtml+'</div>' +
    typeBadgeHtml +
    '<button class="comment-btn'+(hasComment?' active':'')+
      '" data-key="'+esc(key)+
      '" data-page="'+esc(pageId)+
      '" data-section="'+esc(sectionId)+
      '" data-section-label="'+esc(sectionLabel)+
      '" data-id="'+esc(item.id||'')+
      '" data-label="'+esc(item.label||'')+
      '" onclick="openModal(this)">&#128172;</button>' +
  '</div>';
}

function renderControl(item) {
  switch (item.type) {
    case 'TEXT':          return renderText(item);
    case 'DATE':          return '<div class="mock-input date">YYYY-MM-DD</div>';
    case 'SINGLE_SELECT': return renderSelect(item);
    case 'CHECK':         return renderCheck(item);
    case 'DICTIONARY':    return '<div class="mock-input dict">사전 검색</div>';
    case 'SYS_VAL':       return '<div class="mock-input sys">'+esc(item.blankPlaceholder||item.reserved||'시스템 값')+'</div>';
    case 'SEQUENCE':      return '<span class="seq-cell">#</span>';
    case 'CONSTANT':      return '<span class="constant-val">'+esc(String(item.value??''))+'</span>'+renderLabelDescriptions(item);
    default:              return '<span style="color:#9ca3af;font-size:11px">['+esc(item.type)+']</span>';
  }
}

function renderItemId(item) {
  return item.id ? '<div class="item-id">'+esc(item.id)+'</div>' : '';
}

function labelDescriptionText(item) {
  const desc = item.labelDescriptions;
  if (!desc) return '';
  if (Array.isArray(desc)) {
    return desc.map(d => (typeof d === 'string' ? d : d?.text)).filter(Boolean).join(' ');
  }
  if (typeof desc === 'object') return desc.text || '';
  return String(desc);
}

function renderLabelDescriptions(item, mode) {
  const text = labelDescriptionText(item);
  if (!text) return '';
  if (mode === 'inline') return '<span class="label-desc inline">'+esc(text)+'</span>';
  return '<div class="label-desc">'+esc(text)+'</div>';
}

function renderLegacyLabelDescriptions(item) {
  const desc = item.labelDescriptions;
  if (!desc) return '';
  const text = Array.isArray(desc)
    ? desc.map(d => (typeof d === 'string' ? d : d?.text)).filter(Boolean).join(' ')
    : typeof desc === 'object'
      ? desc.text || ''
    : String(desc);
  return text ? '<div class="label-desc">'+esc(text)+'</div>' : '';
}

function renderText(item) {
  const fmt = item.format || {};
  const isML = item.appearance === 'MULTILINE' || item.appearance === 'MULTI_LINE';
  const isNum = fmt.interface === 'NUMBER';
  const suffix = item.uiSuffix ? '<span class="mock-suffix">'+esc(item.uiSuffix)+'</span>' : '';
  if (isML) return '<div class="mock-input" style="height:54px;max-width:400px;align-items:flex-start;padding-top:6px;color:#9ca3af">텍스트 입력…</div>';
  const input = '<div class="mock-input'+(isNum?' num':'')+'">'+( isNum?'0':'텍스트 입력')+'</div>';
  return suffix ? '<span class="mock-input-wrap">'+input+suffix+'</span>' : input;
}

function renderSelect(item) {
  const codes = item.itemCode?.codes || [];
  if (item.layout === 'RADIO') {
    const dirCls = item.direction === 'VERTICAL' ? 'radio-group' : 'radio-group h';
    const opts = codes.map(c=>'<div class="radio-opt"><div class="radio-dot"></div>'+esc(String(c.uiVal))+'</div>').join('');
    return '<div class="'+dirCls+'">'+opts+'</div>';
  }
  const opts = codes.map(c=>'<option>'+esc(String(c.uiVal))+'</option>').join('');
  return '<select class="mock-select"><option disabled selected>선택</option>'+opts+'</select>';
}

function renderCheck(item) {
  const codes = item.itemCode?.codes || [];
  const label = item.label || codes[0]?.uiVal || 'Check';
  return '<label class="mock-check"><span class="mock-check-box"></span><span>'+esc(label)+'</span></label>';
}

function renderDescription(item, pageId, sectionId, sectionLabel, itemIndex) {
  const descriptions = Array.isArray(item.description) ? item.description : [item.description].filter(Boolean);
  const text = descriptions.map(d=>esc(typeof d === 'string' ? d : d.text)).join(' ');
  const body = descriptions
    .map(d=>'<div class="desc-line">'+esc(typeof d === 'string' ? d : d.text)+'</div>')
    .join('');
  const id = item.id || ('DESCRIPTION__' + itemIndex);
  const key = makeKey(pageId, sectionId, id);
  const hasComment = !!comments[key];
  return '<div class="desc-row'+(hasComment?' has-comment':'')+'" data-key="'+esc(key)+'">' +
    '<div class="desc-box">'+body+'</div>' +
    '<button class="comment-btn'+(hasComment?' active':'')+
      '" data-key="'+esc(key)+
      '" data-page="'+esc(pageId)+
      '" data-section="'+esc(sectionId)+
      '" data-section-label="'+esc(sectionLabel)+
      '" data-id="'+esc(id)+
      '" data-label="'+esc(text.slice(0, 80) || 'DESCRIPTION')+
      '" onclick="openModal(this)">&#128172;</button>' +
  '</div>';
}

function renderTable(item, pageId, sectionId, sectionLabel) {
  const headers = item.headers || [];
  const rows = item.rows || [];
  const total = headers.reduce((s,h)=>s+(h.weight||1),0);

  const thead = '<thead><tr>' +
    headers.map(h=>'<th style="width:'+Math.round((h.weight||1)/total*100)+'%">'+esc(h.label)+'</th>').join('') +
    '<th style="width:36px"></th>' +
    '</tr></thead>';

  const tbody = '<tbody>' +
    rows.map((row, rowIdx) => {
      const firstCell = row[0] || {};
      const rowId = item.id + '__' + (firstCell.itemSeq != null ? firstCell.itemSeq : rowIdx);
      const key = makeKey(pageId, sectionId, rowId);
      const hasComment = !!comments[key];
      const rowLabel = (firstCell.type === 'CONSTANT' && firstCell.value)
        ? String(firstCell.value)
        : (rowIdx + 1) + '행';
      const cells = row.map(cell => {
        const isL = !cell.align || cell.type==='CONSTANT'||cell.type==='TEXT'||cell.type==='SEQUENCE';
        return '<td class="'+(isL?'l':'')+'">'+renderControl(cell)+'</td>';
      }).join('');
      const commentTd =
        '<td class="td-comment-btn">' +
          '<button class="comment-btn'+(hasComment?' active':'')+
            '" data-key="'+esc(key)+
            '" data-page="'+esc(pageId)+
            '" data-section="'+esc(sectionId)+
            '" data-section-label="'+esc(sectionLabel)+
            '" data-id="'+esc(rowId)+
            '" data-label="'+esc(item.id+' · '+rowLabel)+
            '" onclick="openModal(this)">&#128172;</button>' +
        '</td>';
      return '<tr class="'+(hasComment?'table-row-commented':'')+'" data-key="'+esc(key)+'">'+cells+commentTd+'</tr>';
    }).join('') + '</tbody>';

  return '<div class="table-wrap"><table class="crf-table">'+thead+tbody+'</table></div>';
}

function renderAppendableTable(item, pageId, sectionId, sectionLabel) {
  const cols = item.cols || [];
  if (!cols.length) return renderFieldRow(item, 'NORMAL', pageId, sectionId, sectionLabel);
  const key = makeKey(pageId, sectionId, item.id || 'APPENDABLE_TABLE');
  const hasComment = !!comments[key];
  const groups = buildAppendableGroups(cols, item.breaks);

  if (!groups) {
    const total = cols.reduce((s,c)=>s+(c.weight||1),0);
    const thead = '<thead><tr>' +
      cols.map(c=>'<th style="width:'+Math.round((c.weight||1)/total*100)+'%">'+esc(c.label || c.id || '')+'</th>').join('') +
      '<th style="width:36px"></th>' +
      '</tr></thead>';
    const cells = cols.map(col => {
      const cell = Object.assign({}, col);
      let control = '';
      if (cell.type === 'SEQUENCE') {
        control = '<span class="seq-cell">1</span>';
      } else {
        control = renderControl(cell);
      }
      const isL = !cell.align || cell.type==='TEXT' || cell.type==='DICTIONARY';
      return '<td class="'+(isL?'l':'')+'">'+control+'</td>';
    }).join('');
    const commentTd =
      '<td class="td-comment-btn">' +
        '<button class="comment-btn'+(hasComment?' active':'')+
          '" data-key="'+esc(key)+
          '" data-page="'+esc(pageId)+
          '" data-section="'+esc(sectionId)+
          '" data-section-label="'+esc(sectionLabel)+
          '" data-id="'+esc(item.id||'')+
          '" data-label="'+esc((item.id || 'APPENDABLE_TABLE')+' · 1행')+
          '" onclick="openModal(this)">&#128172;</button>' +
      '</td>';
    const tbody = '<tbody><tr class="'+(hasComment?'table-row-commented':'')+'" data-key="'+esc(key)+'">'+cells+commentTd+'</tr></tbody>';
    return '<div class="table-wrap appendable-wrap"><table class="crf-table appendable-table">'+thead+tbody+'</table></div>';
  }

  const depth = groups.reduce((max, group) => Math.max(max, group.length), 1);
  const total = groups.reduce((sum, group) => sum + Math.max(...group.map(col => col.weight || 1)), 0);
  const rowSpanAttrs = (rowIdx, groupLength) => {
    if (groupLength === 1) return ' rowspan="'+depth+'"';
    if (rowIdx === groupLength - 1 && groupLength < depth) return ' rowspan="'+(depth - rowIdx)+'"';
    return '';
  };

  const thead = '<thead>' +
    Array.from({ length: depth }, (_, rowIdx) => {
      const cells = groups.map(group => {
        if (rowIdx >= group.length) return '';
        const col = group[rowIdx];
        const width = rowIdx === 0
          ? ' style="width:'+Math.round(Math.max(...group.map(cell => cell.weight || 1)) / total * 100)+'%"'
          : '';
        return '<th'+width+rowSpanAttrs(rowIdx, group.length)+'>'+esc(col.label || col.id || '')+'</th>';
      }).join('');
      const commentTh = rowIdx === 0 ? '<th class="td-comment-btn" rowspan="'+depth+'"></th>' : '';
      return '<tr>'+cells+commentTh+'</tr>';
    }).join('') +
    '</thead>';

  const tbody = '<tbody>' +
    Array.from({ length: depth }, (_, rowIdx) => {
      const cells = groups.map(group => {
        if (rowIdx >= group.length) return '';
        const cell = Object.assign({}, group[rowIdx]);
        let control = '';
        if (cell.type === 'SEQUENCE') {
          control = '<span class="seq-cell">1</span>';
        } else {
          control = renderControl(cell);
        }
        const isL = !cell.align || cell.type==='TEXT' || cell.type==='DICTIONARY';
        return '<td class="'+(isL?'l':'')+'"'+rowSpanAttrs(rowIdx, group.length)+'>'+control+'</td>';
      }).join('');
      const commentTd = rowIdx === 0
        ? '<td class="td-comment-btn" rowspan="'+depth+'">' +
            '<button class="comment-btn'+(hasComment?' active':'')+
              '" data-key="'+esc(key)+
              '" data-page="'+esc(pageId)+
              '" data-section="'+esc(sectionId)+
              '" data-section-label="'+esc(sectionLabel)+
              '" data-id="'+esc(item.id||'')+
              '" data-label="'+esc((item.id || 'APPENDABLE_TABLE')+' · 1행')+
              '" onclick="openModal(this)">&#128172;</button>' +
          '</td>'
        : '';
      return '<tr class="'+(hasComment?'table-row-commented':'')+'" data-key="'+esc(key)+'">'+cells+commentTd+'</tr>';
    }).join('') +
    '</tbody>';
  return '<div class="table-wrap appendable-wrap"><table class="crf-table appendable-table">'+thead+tbody+'</table></div>';
}

function buildAppendableGroups(cols, breaks) {
  if (!Array.isArray(breaks) || !breaks.length) return null;
  const groups = [];
  let cursor = 0;
  for (const rawCount of breaks) {
    const count = Number(rawCount);
    if (!Number.isInteger(count) || count <= 0) return null;
    const group = cols.slice(cursor, cursor + count);
    if (group.length !== count) return null;
    groups.push(group);
    cursor += count;
  }
  return cursor === cols.length ? groups : null;
}

// ── highlights ─────────────────────────────────────────────────────────────
function applyHighlights() {
  document.querySelectorAll('.item-row[data-key]').forEach(row => {
    const k = row.dataset.key;
    const has = !!comments[k];
    row.classList.toggle('has-comment', has);
    const btn = row.querySelector('.comment-btn');
    if (btn) btn.classList.toggle('active', has);
  });
  document.querySelectorAll('tr[data-key]').forEach(row => {
    const k = row.dataset.key;
    const has = !!comments[k];
    row.classList.toggle('table-row-commented', has);
    const btn = row.querySelector('.comment-btn');
    if (btn) btn.classList.toggle('active', has);
  });
  document.querySelectorAll('.desc-row[data-key]').forEach(row => {
    const k = row.dataset.key;
    const has = !!comments[k];
    row.classList.toggle('has-comment', has);
    const btn = row.querySelector('.comment-btn');
    if (btn) btn.classList.toggle('active', has);
  });
}

// ── comment modal ──────────────────────────────────────────────────────────
const overlay   = document.getElementById('modal-overlay');
const textarea  = document.getElementById('modal-textarea');
const metaEl    = document.getElementById('modal-meta');
const deleteBtn = document.getElementById('modal-delete');

window.openModal = function(btn) {
  pendingKey = btn.dataset.key;
  const existing = comments[pendingKey];
  textarea.value = existing ? existing.text : '';
  deleteBtn.style.display = existing ? 'block' : 'none';
  metaEl.innerHTML =
    '<strong>'+esc(btn.dataset.label||btn.dataset.id)+'</strong>' +
    ' <span style="font-family:monospace">'+esc(btn.dataset.id)+'</span>' +
    ' · ' + esc(btn.dataset.sectionLabel);
  overlay.classList.add('open');
  textarea.focus();
};

document.getElementById('modal-save').addEventListener('click', () => {
  const text = textarea.value.trim();
  if (!text) { deleteComment(); return; }
  const btn = findCommentBtn(pendingKey);
  const existing = comments[pendingKey] || {};
  comments[pendingKey] = {
    pageId:       btn?.dataset.page || existing.pageId || '',
    sectionId:    btn?.dataset.section || existing.sectionId || '',
    sectionLabel: btn?.dataset.sectionLabel || existing.sectionLabel || '',
    itemId:       btn?.dataset.id || existing.itemId || '',
    itemLabel:    btn?.dataset.label || existing.itemLabel || '',
    text,
    updatedAt:    new Date().toISOString(),
    completed:    !!existing.completed,
    completedAt:  existing.completedAt || null,
  };
  save();
  overlay.classList.remove('open');
  applyHighlights();
  updateBadge();
  updatePanel();
  refreshNavDots();
});

document.getElementById('modal-delete').addEventListener('click', () => deleteComment());
document.getElementById('modal-cancel').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => { if(e.target===overlay) overlay.classList.remove('open'); });

function deleteComment() {
  delete comments[pendingKey];
  save();
  overlay.classList.remove('open');
  applyHighlights();
  updateBadge();
  updatePanel();
  refreshNavDots();
}

// ── panel ──────────────────────────────────────────────────────────────────
const panel = document.getElementById('comment-panel');

document.getElementById('btn-toggle-panel').addEventListener('click', () => {
  panelOpen = !panelOpen;
  panel.classList.toggle('hidden', !panelOpen);
});
document.getElementById('panel-close').addEventListener('click', () => {
  panelOpen = false;
  panel.classList.add('hidden');
});
document.getElementById('panel-list').addEventListener('click', (event) => {
  const actionBtn = event.target.closest('.pi-action');
  if (actionBtn) {
    event.preventDefault();
    event.stopPropagation();
    const inline = actionBtn.getAttribute('onclick') || '';
    const inlineKey = (inline.match(/(?:markCommentCompleted|editFromPanel)\\((["'])(.*?)\\1/) || [])[2];
    const key = actionBtn.dataset.commentKey || inlineKey;
    if (!key) return;
    if (actionBtn.dataset.action === 'complete' || inline.includes('markCommentCompleted')) {
      const nextCompleted = actionBtn.dataset.completed
        ? actionBtn.dataset.completed === 'true'
        : inline.includes(', true');
      markCommentCompleted(key, nextCompleted);
      return;
    }
    if (actionBtn.dataset.action === 'edit' || inline.includes('editFromPanel')) {
      editFromPanel(key);
      return;
    }
    return;
  }
  const item = event.target.closest('.panel-item[data-comment-key]');
  if (!item) return;
  navigateFromPanel(item.dataset.commentKey);
});

function updatePanel() {
  updateBadge();
  if (activeTab === 'comments') renderCommentsTab();
  else if (activeTab === 'completed') renderCompletedTab();
  else renderOverridesTab();
}

window.switchTab = function(tab) {
  activeTab = tab;
  document.getElementById('tab-comments').classList.toggle('active', tab === 'comments');
  document.getElementById('tab-completed')?.classList.toggle('active', tab === 'completed');
  document.getElementById('tab-overrides').classList.toggle('active', tab === 'overrides');
  updatePanel();
};

function renderCommentsTab() {
  renderCommentList(false);
}

function renderCompletedTab() {
  renderCommentList(true);
}

function renderCommentList(completed) {
  const listEl = document.getElementById('panel-list');
  const keys = Object.keys(comments).filter(k => !!comments[k].completed === completed);
  if (!keys.length) {
    listEl.innerHTML = completed
      ? '<div class="panel-empty"><div class="ei">&#10003;</div>완료된 댓글이 없습니다.</div>'
      : '<div class="panel-empty"><div class="ei">&#128172;</div>등록된 댓글이 없습니다.</div>';
    return;
  }
  const grouped = {};
  keys.forEach(k => {
    const c = comments[k];
    if (!grouped[c.pageId]) grouped[c.pageId] = [];
    grouped[c.pageId].push({ key: k, ...c });
  });
  listEl.innerHTML = Object.keys(grouped).map(pageId => {
    const items = grouped[pageId];
    const domainLabel = (DOMAINS[pageId]?.label || pageId);
    const rows = items.map(c =>
      '<div class="panel-item'+(completed ? ' completed-item' : '')+'" data-comment-key="'+esc(c.key)+'">' +
        '<div class="panel-item-meta">' +
          '<span class="pi-page">'+esc(c.pageId)+'</span>' +
          '<span class="pi-id">'+esc(c.itemId)+'</span>' +
        '</div>' +
        '<div class="pi-label">'+esc(c.itemLabel)+'</div>' +
        '<div class="pi-text">'+esc(c.text)+'</div>' +
        '<div class="pi-footer">' +
          (completed
            ? '<button class="pi-action pi-complete" data-action="complete" data-completed="false" data-comment-key="'+esc(c.key)+'">&#46104;&#46028;&#47532;&#44592;</button>'
            : '<button class="pi-action pi-complete" data-action="complete" data-completed="true" data-comment-key="'+esc(c.key)+'">&#50756;&#47308;</button>') +
          '<button class="pi-action pi-edit" data-action="edit" data-comment-key="'+esc(c.key)+'">&#49688;&#51221;</button>' +
        '</div>' +
      '</div>'
    ).join('');
    return '<div class="panel-group">' +
      '<div class="panel-group-title">'+esc(pageId)+' · '+esc(domainLabel)+'</div>' +
      rows + '</div>';
  }).join('');
}

window.markCommentCompleted = function(key, completed) {
  const c = comments[key];
  if (!c) return;
  c.completed = completed;
  c.completedAt = completed ? new Date().toISOString() : null;
  save();
  updatePanel();
  applyHighlights();
  refreshNavDots();
};

function renderOverridesTab() {
  const listEl = document.getElementById('panel-list');
  const keys = Object.keys(typeOverrides);
  if (!keys.length) {
    listEl.innerHTML = '<div class="panel-empty"><div class="ei">&#128256;</div>타입 변경 사항이 없습니다.</div>';
    return;
  }
  const grouped = {};
  keys.forEach(k => {
    const [pageId] = k.split('::');
    if (!grouped[pageId]) grouped[pageId] = [];
    grouped[pageId].push(k);
  });
  listEl.innerHTML = Object.keys(grouped).map(pageId => {
    const domainLabel = (DOMAINS[pageId]?.label || pageId);
    const rows = grouped[pageId].map(k => {
      const [pid, sectionId, itemId] = k.split('::');
      const ov = typeOverrides[k];
      const item = findItem(pid, sectionId, itemId);
      const label = item?.label || itemId;
      return '<div class="panel-item override-item">' +
        '<div class="panel-item-meta">' +
          '<span class="pi-page">'+esc(pid)+'</span>' +
          '<span class="pi-id">'+esc(itemId)+'</span>' +
        '</div>' +
        '<div class="pi-label">'+esc(label)+'</div>' +
        '<div class="pi-type-change">' +
          '<span class="pi-type-from">'+esc(ov.origType)+'</span>' +
          '<span class="pi-arrow">-></span>' +
          '<span class="pi-type-to">'+esc(ov.toType)+'</span>' +
        '</div>' +
        '<div class="pi-footer">' +
          '<button class="pi-edit" onclick="editOverrideFromPanel('+JSON.stringify(k)+')">수정</button>' +
          ' <button class="pi-edit" style="color:var(--red)" onclick="deleteOverrideFromPanel('+JSON.stringify(k)+')">되돌리기</button>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="panel-group">' +
      '<div class="panel-group-title">'+esc(pageId)+' · '+esc(domainLabel)+'</div>' +
      rows + '</div>';
  }).join('');
}

window.navigateFromPanel = function(key) {
  const c = comments[key];
  if (!c) return;
  if (c.pageId !== currentPageId) {
    const navBtn = document.querySelector('.nav-crf[data-page-id="'+c.pageId+'"]');
    if (navBtn) navBtn.click();
    setTimeout(() => navigateFromPanel(key), 80);
    return;
  }
  flashCommentTarget(key);
};

window.editFromPanel = function(key) {
  const c = comments[key];
  if (!c) return;
  if (c && c.pageId !== currentPageId) {
    const navBtn = document.querySelector('.nav-crf[data-page-id="'+c.pageId+'"]');
    if (navBtn) navBtn.click();
    setTimeout(() => editFromPanel(key), 80);
    return;
  }
  const btn = findCommentBtn(key);
  if (btn) {
    const target = flashCommentTarget(key);
    if (!target) {
      btn.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    setTimeout(() => openModal(btn), 180);
    return;
  }
  pendingKey = key;
  textarea.value = c.text || '';
  deleteBtn.style.display = 'block';
  metaEl.innerHTML =
    '<strong>'+esc(c.itemLabel||c.itemId||'댓글')+'</strong>' +
    ' <span style="font-family:monospace">'+esc(c.itemId||'')+'</span>' +
    ' · ' + esc(c.sectionLabel||'');
  overlay.classList.add('open');
  textarea.focus();
};

window.editOverrideFromPanel = function(key) {
  const [pageId] = key.split('::');
  if (pageId !== currentPageId) {
    const navBtn = document.querySelector('.nav-crf[data-page-id="'+pageId+'"]');
    if (navBtn) navBtn.click();
    setTimeout(() => editOverrideFromPanel(key), 80);
    return;
  }
  const badge = Array.from(document.querySelectorAll('.type-badge')).find(b => b.dataset.key === key);
  if (badge) { badge.scrollIntoView({ behavior:'smooth', block:'center' }); openTypeModal(badge); }
};

window.deleteOverrideFromPanel = function(key) {
  delete typeOverrides[key];
  saveOverrides();
  const [pageId, , itemId] = key.split('::');
  if (pageId === currentPageId) {
    const row = Array.from(document.querySelectorAll('.item-row[data-key]')).find(r => r.dataset.key === key);
    if (row) {
      const badge = row.querySelector('.type-badge');
      if (badge) {
        const origType = badge.dataset.origType;
        const item = findItem(pageId, key.split('::')[1], itemId);
        if (item) row.querySelector('.item-control').innerHTML = renderControl(item);
        badge.textContent = origType + ' ▾';
        badge.className = 'type-badge type-' + origType.toLowerCase();
      }
    }
  }
  updateBadge();
  updatePanel();
  refreshNavDots();
};

// ── badge ──────────────────────────────────────────────────────────────────
function updateBadge() {
  const openComments = Object.values(comments).filter(c => !c.completed).length;
  const completedComments = Object.values(comments).filter(c => !!c.completed).length;
  const nc = openComments + completedComments;
  const no = Object.keys(typeOverrides).length;
  const total = nc + no;
  document.getElementById('comment-badge').textContent = total > 0 ? String(total) : '';
  const cb = document.getElementById('tab-badge-comments');
  const db = document.getElementById('tab-badge-completed');
  const ob = document.getElementById('tab-badge-overrides');
  if (cb) cb.textContent = String(openComments);
  if (db) db.textContent = String(completedComments);
  if (ob) ob.textContent = String(no);
}

function refreshNavDots() {
  const pagesWithComments  = new Set(Object.values(comments).map(c => c.pageId));
  const pagesWithOverrides = new Set(Object.keys(typeOverrides).map(k => k.split('::')[0]));
  document.querySelectorAll('.nav-crf').forEach(btn => {
    const pid = btn.dataset.pageId;
    const dot = btn.querySelector('.nav-comment-dot');
    if (dot) dot.style.display = pagesWithComments.has(pid) ? 'block' : 'none';
    let odot = btn.querySelector('.nav-override-dot');
    if (pagesWithOverrides.has(pid)) {
      if (!odot) {
        odot = document.createElement('span');
        odot.className = 'nav-override-dot';
        btn.appendChild(odot);
      }
    } else {
      if (odot) odot.remove();
    }
  });
}

// ── type switcher ──────────────────────────────────────────────────────────
const typeOverlay = document.getElementById('type-overlay');
let _typeBtn = null;

window.openTypeModal = function(btn) {
  _typeBtn = btn;
  const key       = btn.dataset.key;
  const pageId    = btn.dataset.page;
  const sectionId = btn.dataset.section;
  const itemId    = btn.dataset.itemId;
  const origType  = btn.dataset.origType;
  const item      = findItem(pageId, sectionId, itemId);
  if (!item) return;

  const override    = typeOverrides[key];
  const currentType = override ? override.toType : origType;
  const alts        = TYPE_ALTS[origType] || [];
  const allTypes    = [origType, ...alts];

  document.getElementById('type-modal-meta').innerHTML =
    '<strong>'+esc(item.label||itemId)+'</strong>' +
    ' <span style="font-family:monospace;font-size:11px">'+esc(itemId)+'</span>';

  const listEl = document.getElementById('type-option-list');
  const cdiscRule = getCdiscRule(itemId);
  const rec = getTypeRecommendation(itemId, item.label, origType);
  const finalRec = cdiscRule ? cdiscRule.type : rec.recommended;

  listEl.innerHTML = allTypes.map(t => {
    const info = TYPE_LABELS[t] || { name: t, desc: '' };
    const isCurrent = t === currentType;
    const isCdisc = cdiscRule && cdiscRule.type === t && t !== origType;
    const isRec   = !isCdisc && rec.recommended === t;

    let statsHtml = '';
    if (rec.source) {
      const entry = rec.stats.find(s => s.type === t);
      const srcNote = rec.source === 'label' ? ' (항목명 기준)' : '';
      if (entry) {
        statsHtml =
          '<div class="type-stat">' +
            '<div class="type-stat-bar"><div class="type-stat-fill" style="width:'+entry.pct+'%"></div></div>' +
            '<span class="type-stat-label">유사 과제 사용률 '+entry.pct+'%'+srcNote+'</span>' +
          '</div>';
      } else {
        statsHtml = '<div class="type-stat"><span class="type-stat-label" style="color:#9ca3af">유사 과제 미사용'+srcNote+'</span></div>';
      }
    }

    let diffHtml = '';
    if (!isCurrent) {
      const diff = getCodeDiff(origType, t, item);
      const fromLines = diff.from.map(l => '<span class="diff-line minus">- ' + esc(l) + '</span>').join('');
      const toLines   = diff.to  .map(l => '<span class="diff-line plus" >+ ' + esc(l) + '</span>').join('');
      if (diff.from.length || diff.to.length) {
        diffHtml =
          '<div class="type-diff">' +
            '<div class="diff-file">' + esc(itemId) + ' 항목 변경 내용</div>' +
            fromLines + toLines +
          '</div>';
      }
    }

    return '<div class="type-option'+(isCurrent?' current':'')+(isCdisc||isRec?' recommended':'')+
      '" onclick="'+(isCurrent ? '' : 'selectType('+JSON.stringify(t)+')')+'">' +
      '<div class="type-option-header">' +
        '<span class="type-option-name">'+esc(info.name)+'</span>' +
        (isCurrent ? '<span class="opt-current-mark">현재</span>'    : '') +
        (isCdisc   ? '<span class="opt-cdisc-mark">CDASH 표준</span>' : '') +
        (isRec     ? '<span class="opt-rec-mark">추천</span>'         : '') +
      '</div>' +
      (isCdisc && cdiscRule ? '<div class="type-option-desc" style="color:#92400e;font-size:10px">'+esc(cdiscRule.reason)+'</div>' : '') +
      '<div class="type-option-desc">'+esc(info.desc)+'</div>' +
      statsHtml +
      diffHtml +
    '</div>';
  }).join('');

  typeOverlay.classList.add('open');
};

window.selectType = function(toType) {
  if (!_typeBtn) return;
  const key       = _typeBtn.dataset.key;
  const pageId    = _typeBtn.dataset.page;
  const sectionId = _typeBtn.dataset.section;
  const itemId    = _typeBtn.dataset.itemId;
  const origType  = _typeBtn.dataset.origType;
  const item      = findItem(pageId, sectionId, itemId);
  if (!item) return;

  if (toType === origType) {
    delete typeOverrides[key];
  } else {
    typeOverrides[key] = { origType, toType };
  }
  saveOverrides();

  const row = Array.from(document.querySelectorAll('.item-row[data-key]')).find(r=>r.dataset.key===key);
  if (row) {
    row.querySelector('.item-control').innerHTML = renderControlForType(item, toType);
    const badge = row.querySelector('.type-badge');
    if (badge) {
      badge.textContent = toType + ' ▾';
      badge.className = 'type-badge type-' + toType.toLowerCase() + (toType !== origType ? ' override' : '');
    }
  }

  updateBadge();
  refreshNavDots();
  if (activeTab === 'overrides') renderOverridesTab();

  typeOverlay.classList.remove('open');
  showToast(toType === origType
    ? '원래 타입으로 되돌렸습니다.'
    : esc(origType) + ' -> ' + esc(toType) + ' 로 변경했습니다.');
};

document.getElementById('type-modal-reset').addEventListener('click', () => {
  if (!_typeBtn) return;
  selectType(_typeBtn.dataset.origType);
  typeOverlay.classList.remove('open');
});
document.getElementById('type-modal-cancel').addEventListener('click', () => typeOverlay.classList.remove('open'));
document.getElementById('type-modal-close').addEventListener('click',  () => typeOverlay.classList.remove('open'));
typeOverlay.addEventListener('click', e => { if (e.target===typeOverlay) typeOverlay.classList.remove('open'); });

// ── suggestions ────────────────────────────────────────────────────────────
const suggOverlay = document.getElementById('sugg-overlay');
let _suggestions = [];

document.getElementById('btn-suggest').addEventListener('click', () => {
  _suggestions = scanPageSuggestions(currentPageId);
  renderSuggestions(_suggestions);
  suggOverlay.classList.add('open');
});

function scanPageSuggestions(pageId) {
  const page = PAGES[pageId];
  if (!page) return [];
  const results = [];

  for (const sec of page.sections || []) {
    for (const item of sec.items || []) {
      if (!item.id) continue;
      const origType = getEffectiveType(item);
      if (!TYPE_ALTS[origType]) continue;
      const key = makeKey(pageId, sec.id, item.id);
      const alreadyChanged = typeOverrides[key];

      const cdiscRule = getCdiscRule(item.id);
      if (cdiscRule && cdiscRule.type !== origType && TYPE_ALTS[origType]?.includes(cdiscRule.type)) {
        results.push({ key, pageId, sectionId: sec.id, item, origType,
          toType: cdiscRule.type, reason: cdiscRule.reason, source: 'cdisc',
          applied: alreadyChanged?.toType === cdiscRule.type });
        continue;
      }

      const rec = getTypeRecommendation(item.id, item.label, origType);
      if (rec.recommended && TYPE_ALTS[origType]?.includes(rec.recommended)) {
        const entry = rec.stats.find(s => s.type === rec.recommended);
        results.push({ key, pageId, sectionId: sec.id, item, origType,
          toType: rec.recommended,
          reason: '유사 과제 사용률 ' + (entry?.pct||0) + '% (' + (rec.source==='label'?'항목명 기준':'ID 기준') + ')',
          source: 'stat',
          applied: alreadyChanged?.toType === rec.recommended });
      }
    }
  }
  return results;
}

function renderSuggestions(list) {
  const body = document.getElementById('sugg-body');
  const cnt  = document.getElementById('sugg-count');
  document.getElementById('sugg-title').textContent =
    '✨ 타입 추천 스캔 — ' + (currentPageId || '');

  if (!list.length) {
    body.innerHTML = '<div style="color:var(--g3);font-size:13px;padding:20px 0;text-align:center">이 페이지에는 추천 변경 사항이 없습니다.</div>';
    cnt.textContent = '';
    return;
  }

  const pending = list.filter(s => !s.applied).length;
  cnt.textContent = '총 ' + list.length + '건 · 미적용 ' + pending + '건';

  body.innerHTML = list.map((s, idx) =>
    '<div class="sugg-item" data-idx="'+idx+'">' +
      '<div class="sugg-info">' +
        '<div class="sugg-label">'+esc(s.item.label||s.item.id)+'</div>' +
        '<div class="sugg-id">'+esc(s.item.id)+'</div>' +
        '<div class="sugg-change">' +
          '<span class="sugg-from">'+esc(s.origType)+'</span>' +
          '<span class="sugg-arrow">-></span>' +
          '<span class="sugg-to">'+esc(s.toType)+'</span>' +
        '</div>' +
        '<div class="sugg-reason">'+esc(s.reason)+'</div>' +
      '</div>' +
      '<span class="sugg-source '+s.source+'">'+( s.source==='cdisc' ? 'CDASH 표준' : '통계 추천' )+'</span>' +
      '<button class="sugg-apply'+(s.applied?' done':'')+'" onclick="applySuggestion('+idx+')">' +
        (s.applied ? '적용됨' : '적용') +
      '</button>' +
    '</div>'
  ).join('');
}

window.applySuggestion = function(idx) {
  const s = _suggestions[idx];
  if (!s || s.applied) return;
  typeOverrides[s.key] = { origType: s.origType, toType: s.toType };
  saveOverrides();
  s.applied = true;
  const row = Array.from(document.querySelectorAll('.item-row[data-key]')).find(r=>r.dataset.key===s.key);
  if (row) {
    row.querySelector('.item-control').innerHTML = renderControlForType(s.item, s.toType);
    const badge = row.querySelector('.type-badge');
    if (badge) {
      badge.textContent = s.toType + ' ▾';
      badge.className = 'type-badge type-' + s.toType.toLowerCase() + ' override';
    }
  }
  updateBadge(); refreshNavDots();
  if (activeTab === 'overrides') renderOverridesTab();
  const btn = document.querySelector('.sugg-item[data-idx="'+idx+'"] .sugg-apply');
  if (btn) { btn.textContent = '적용됨'; btn.classList.add('done'); }
  const pending2 = _suggestions.filter(s=>!s.applied).length;
  document.getElementById('sugg-count').textContent =
    '총 ' + _suggestions.length + '건 · 미적용 ' + pending2 + '건';
};

window.applyAllSuggestions = function() {
  _suggestions.forEach((s, idx) => { if (!s.applied) applySuggestion(idx); });
};

// ── help ──────────────────────────────────────────────────────────────────
const helpOverlay = document.getElementById('help-overlay');
document.getElementById('btn-help').addEventListener('click', () => helpOverlay.classList.add('open'));
document.getElementById('help-close').addEventListener('click', () => helpOverlay.classList.remove('open'));
helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.classList.remove('open'); });

// ── export / import ────────────────────────────────────────────────────────
document.getElementById('btn-export').addEventListener('click', () => {
  const payload = { study: STUDY, exportedAt: new Date().toISOString(), comments, typeOverrides };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'comments-' + STUDY + '-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      const imported = data.comments || data;
      Object.assign(comments, imported);
      if (data.typeOverrides) Object.assign(typeOverrides, data.typeOverrides);
      save();
      saveOverrides();
      applyHighlights();
      updateBadge();
      updatePanel();
      refreshNavDots();
      const activeBtn = document.querySelector('.nav-crf.active');
      if (activeBtn) activeBtn.click();
      alert('댓글 ' + Object.keys(imported).length + '개를 가져왔습니다.');
    } catch(err) { alert('파일을 읽을 수 없습니다: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ── toast ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    document.body.appendChild(t);
  }
  t.innerHTML = msg;
  t.className = 'toast show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── utils ──────────────────────────────────────────────────────────────────
function save() { localStorage.setItem(LS_KEY, JSON.stringify(comments)); }

function makeKey(pageId, sectionId, itemId) {
  return pageId + '::' + sectionId + '::' + itemId;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function findCommentBtn(key) {
  return Array.from(document.querySelectorAll('.comment-btn')).find(b => b.dataset.key === key) || null;
}

function findCommentTarget(key) {
  const btn = findCommentBtn(key);
  if (btn) return btn.closest('[data-key]') || btn;
  return Array.from(document.querySelectorAll('[data-key]')).find(el => el.dataset.key === key) || null;
}

function flashCommentTarget(key) {
  const target = findCommentTarget(key);
  if (!target) return null;
  target.scrollIntoView({ behavior:'smooth', block:'center' });
  target.classList.remove('comment-flash');
  void target.offsetWidth;
  target.classList.add('comment-flash');
  setTimeout(() => target.classList.remove('comment-flash'), 1600);
  return target;
}

})();
`;
