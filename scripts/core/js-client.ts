/**
 * Client-side JS for the **怨좉컼?ъ슜(client)** HTML.
 * Features: comment/annotation only. No type switcher, no suggestions.
 */

export const JS_CLIENT = `
(function(){

// ?? state ??????????????????????????????????????????????????????????????????
const LS_KEY = 'crf-comments::' + STUDY;
const LS_VIEW_KEY = 'crf-view::' + STUDY;
const REVIEW_STATE = (typeof EMBEDDED_REVIEW_STATE !== 'undefined') ? EMBEDDED_REVIEW_STATE : {};

let comments = { ...(REVIEW_STATE.comments || {}) };
try { comments = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e){}
comments = { ...(REVIEW_STATE.comments || {}), ...comments };

let currentPageId = null;
let currentVisitLabel = '';
let panelOpen = true;
let pendingKey = null;
let activeTab = 'comments';

// ?? boot ??????????????????????????????????????????????????????????????????
buildNav();
updateBadge();
updatePanel();
restoreSelectedNav();

// ?? nav ??????????????????????????????????????????????????????????????????
function buildNav() {
  const navEl = document.getElementById('nav');
  const coverBtn = el('div', 'nav-crf nav-cover');
  coverBtn.dataset.pageId = '__cover';
  coverBtn.innerHTML =
    '<span class="nav-page-id">CVR</span>' +
    '<span class="nav-domain">Cover</span>' +
    '<span class="nav-comment-dot" style="display:none"></span>';
  coverBtn.addEventListener('click', () => selectCover(coverBtn));
  navEl.appendChild(coverBtn);

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
      btn.dataset.visitLabel = visit.visitLabel;
      btn.dataset.visitCode = visit.visitCode == null ? '' : String(visit.visitCode);
      btn.dataset.visitType = visit.visitType || '';
      btn.dataset.pageId = p.pageId;
      btn.innerHTML =
        '<span class="nav-page-id">'+esc(p.pageId)+'</span>' +
        '<span class="nav-domain">'+esc(p.domainLabel)+'</span>' +
        '<span class="nav-comment-dot" style="display:none"></span>';
      btn.addEventListener('click', () => selectPage(btn, visit.visitLabel, visit.visitCode, visit.visitType, p));
      navEl.appendChild(btn);
    });
  });
  refreshNavDots();
}

function selectPage(btn, visitLabel, visitCode, visitType, pageInfo) {
  document.querySelectorAll('.nav-crf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPageId = pageInfo.pageId;
  currentVisitLabel = visitLabel || '';
  saveSelectedNav(currentVisitLabel, currentPageId);

  document.getElementById('page-breadcrumb').innerHTML =
    esc(visitLabel) +
    '<span style="margin:0 6px;color:#9ca3af">&#8250;</span>' +
    '<strong>' + esc(pageInfo.domainLabel) + ' (' + esc(pageInfo.pageId) + ')</strong>';

  const page = PAGES[pageInfo.pageId];
  document.getElementById('crf-body').innerHTML = page
    ? renderPage(page, pageInfo.pageId, visitLabel, visitCode, visitType, pageInfo.domainLabel)
    : '<div class="empty-state"><div class="icon">&#128203;</div><p>?섏씠吏瑜?李얠쓣 ???놁뒿?덈떎.</p></div>';

  applyHighlights();
}

function selectSchedule(btn) {
  document.querySelectorAll('.nav-crf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPageId = '__schedule';
  currentVisitLabel = '';
  saveSelectedNav('', currentPageId);
  document.getElementById('page-breadcrumb').innerHTML =
    '<strong>Schedule</strong><span style="margin-left:6px;color:#9ca3af">folders.ts 諛⑸Ц/CRF 留ㅽ듃由?뒪 湲곗?</span>';
  document.getElementById('crf-body').innerHTML = renderSchedule();
}

function selectCover(btn) {
  document.querySelectorAll('.nav-crf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPageId = '__cover';
  currentVisitLabel = '';
  saveSelectedNav('', currentPageId);
  document.getElementById('page-breadcrumb').innerHTML = '<strong>Cover</strong>';
  document.getElementById('crf-body').innerHTML = renderCover();
}

// ?? render CRF ????????????????????????????????????????????????????????????
function renderPage(page, pageId, visitLabel, visitCode, visitType, domainLabel) {
  const pageTitle = domainLabel || DOMAINS[page.domain]?.label || DOMAINS[pageId]?.label || pageId;
  const meta = renderCrfHeader(visitLabel || '', pageTitle);
  const sections = page.sections || [];
  return meta + sections.map(sec => renderSection(sec, pageId, page.domain, sections.length, visitLabel || '', visitCode, visitType)).join('');
}

function renderCover() {
  const info = STUDY_INFO || {};
  const protocol = info.protocolNo || STUDY;
  const rows = getCoverRows(info);
  return '<div class="cover-page">' +
    '<div class="cover-title">' +
      '<h1>'+esc(protocol)+'</h1>' +
      '<h2>Annotated CRFs</h2>' +
    '</div>' +
    '<div class="cover-spacer"></div>' +
    '<table class="cover-table">' +
      '<tbody>' +
        rows.map((row, idx) => {
          const gap = idx > 0 && String(row.label).toLowerCase() === 'sponsor'
            ? '<tr class="cover-gap"><th></th><td></td></tr>'
            : '';
          return gap + '<tr><th>'+esc(row.label)+'</th><td>'+esc(row.text || '')+'</td></tr>';
        }).join('') +
      '</tbody>' +
    '</table>' +
  '</div>';
}

function getCoverRows(info) {
  const configured = (info.coverDescriptions || []).filter(row => row && row.label);
  if (configured.length) return configured;
  return [
    { label: 'Protocol No.', text: info.protocolNo || STUDY },
    { label: 'Study Title', text: info.title || '' },
    { label: 'Phase', text: info.phase || '' },
  ];
}

function renderCrfHeader(visitLabel, pageTitle) {
  const headerItems = (STUDY_INFO && STUDY_INFO.headerItems && STUDY_INFO.headerItems.length)
    ? STUDY_INFO.headerItems
    : [
      { label: { reserved: 'VISIT' }, value: { reserved: 'DOMAIN' }, weight: 2 },
      { label: 'Protocol', value: { reserved: 'PROTOCOL' }, weight: 2 },
      { label: 'Screening No.', value: { reserved: 'SUBJECT_NO' }, weight: 2 },
      { label: 'Sign', value: { reserved: 'SIGN' }, weight: 2 },
    ];
  const total = headerItems.reduce((sum, item) => sum + (item.weight || 1), 0);
  return '<div class="crf-meta">' +
    '<table class="crf-meta-table">' +
      '<thead><tr>' +
        headerItems.map(item => '<th style="width:'+((item.weight || 1) / total * 100).toFixed(3)+'%">'+esc(resolveHeaderCell(item.label, visitLabel, pageTitle))+'</th>').join('') +
      '</tr></thead>' +
      '<tbody><tr>' +
        headerItems.map(item => '<td>'+esc(resolveHeaderCell(item.value, visitLabel, pageTitle))+'</td>').join('') +
      '</tr></tbody>' +
    '</table>' +
  '</div>';
}

function resolveHeaderCell(cell, visitLabel, pageTitle) {
  if (cell == null) return '';
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell);
  const reserved = cell.reserved;
  if (!reserved) return cell.text || cell.label || '';
  switch (reserved) {
    case 'VISIT': return visitLabel || '';
    case 'DOMAIN': return pageTitle || '';
    case 'PROTOCOL': return STUDY_INFO?.protocolNo || STUDY;
    case 'SITE':
    case 'SITE_NAME':
    case 'SITE_CODE':
    case 'SUBJECT_NO':
    case 'NAME':
    case 'SIGN':
    case 'SECOND_SIGN':
      return '';
    default:
      return '';
  }
}

function renderSection(sec, pageId, pageDomain, sectionCount, visitLabel, visitCode, visitType) {
  if (!isVisibleInVisit(sec.visibility, visitCode, visitType)) return '';
  const rawLabel = sec.label?.text || sec.label || sec.id;
  const labelText = formatSectionLabel(pageId, pageDomain, sec.id, rawLabel, sectionCount);
  const labelSize = sec.itemLabelSize || 'NORMAL';
  const items = (sec.items || []).map((item, idx) => renderItem(item, labelSize, pageId, sec.id, labelText, idx, visitLabel, visitCode, visitType)).join('');
  return '<div class="crf-section">' +
    '<div class="section-header">'+esc(labelText)+'</div>' +
    items + '</div>';
}

function formatSectionLabel(pageId, pageDomain, sectionId, label, sectionCount) {
  const text = String(label || '').trim();
  if (!text) return pageId;
  return text;
}

function renderItem(item, labelSize, pageId, sectionId, sectionLabel, itemIndex, visitLabel, visitCode, visitType) {
  if (!isVisibleInVisit(item.visibility, visitCode, visitType)) return '';
  if (item.type === 'DESCRIPTION') return renderDescription(item, pageId, sectionId, sectionLabel, itemIndex, visitLabel);
  if (item.type === 'TABLE')       return renderTable(item, pageId, sectionId, sectionLabel, visitLabel);
  if (item.type === 'APPENDABLE_TABLE') return renderAppendableTable(item, pageId, sectionId, sectionLabel, visitLabel);
  return renderFieldRow(item, labelSize, pageId, sectionId, sectionLabel, visitLabel, visitCode, visitType);
}

function isVisibleInVisit(visibility, visitCode, visitType) {
  if (!visibility) return true;
  const rules = Array.isArray(visibility) ? visibility : [visibility];
  return rules.every(rule => evaluateVisibilityRule(rule, visitCode, visitType));
}

function evaluateVisibilityRule(rule, visitCode, visitType) {
  if (!rule) return true;
  const children = rule.expr || rule.conditions || rule.rules;
  if (rule.operator === 'AND') return (children || []).every(child => evaluateVisibilityRule(child, visitCode, visitType));
  if (rule.operator === 'OR') return (children || []).some(child => evaluateVisibilityRule(child, visitCode, visitType));

  if (rule.type === 'NORMAL_VISIT') {
    if (visitType && visitType !== 'NORMAL_VISIT') return false;
    return compareVisitCode(visitCode, rule);
  }
  if (rule.type === 'UNSCHEDULED_VISIT') {
    if (visitType && visitType !== 'UNSCHEDULED_VISIT') return false;
    return compareVisitCode(visitCode, rule);
  }
  if (rule.type === 'VISIT_CODE') return compareVisitCode(visitCode, rule);

  return true;
}

function compareVisitCode(visitCode, rule) {
  if (typeof visitCode !== 'number') return true;
  const right = rule.operand ?? rule.value;
  const operator = rule.condition || rule.operator || '=';
  if (Array.isArray(right)) {
    const includes = right.includes(visitCode);
    return operator === '!=' || operator === 'not in' ? !includes : includes;
  }
  if (typeof right !== 'number') return true;
  if (operator === '=') return visitCode === right;
  if (operator === '!=') return visitCode !== right;
  if (operator === '>') return visitCode > right;
  if (operator === '>=') return visitCode >= right;
  if (operator === '<') return visitCode < right;
  if (operator === '<=') return visitCode <= right;
  return true;
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

function renderFieldRow(item, labelSize, pageId, sectionId, sectionLabel, visitLabel, visitCode, visitType) {
  const key = makeKey(visitLabel, pageId, sectionId, item.id || '');
  const hasComment = !!comments[key];
  const isCriteriaSection = pageId === 'IE' && (sectionId === 'IN' || sectionId === 'EX');
  const labelCls = isCriteriaSection ? 'item-label criteria' : (labelSize === 'DOUBLE' ? 'item-label double' : 'item-label');
  const rowCls = 'item-row' + (hasComment ? ' has-comment' : '');

  return '<div class="'+rowCls+'" data-key="'+esc(key)+'">' +
    '<div class="'+labelCls+'">' +
      '<div class="item-label-main">' +
        '<span class="item-label-text">'+esc(item.label || '')+'</span>' +
        (item.required ? '<span class="required-mark">*</span>' : '') +
        renderLabelDescriptions(item, 'inline') +
      '</div>' +
      renderItemId(item) +
    '</div>' +
    '<div class="item-control">'+renderControl(item, visitCode, visitType)+'</div>' +
    '<button class="comment-btn'+(hasComment?' active':'')+
      '" data-key="'+esc(key)+
      '" data-visit="'+esc(visitLabel)+
      '" data-page="'+esc(pageId)+
      '" data-section="'+esc(sectionId)+
      '" data-section-label="'+esc(sectionLabel)+
      '" data-id="'+esc(item.id||'')+
      '" data-label="'+esc(item.label||'')+
      '" onclick="openModal(this)">&#128172;</button>' +
  '</div>';
}

function renderControl(item, visitCode, visitType) {
  let control = '';
  switch (item.type) {
    case 'TEXT':          control = renderText(item); break;
    case 'DATE':          control = '<div class="mock-input date">YYYY-MM-DD</div>'; break;
    case 'SINGLE_SELECT': control = renderSelect(item); break;
    case 'CHECK':         control = renderCheck(item); break;
    case 'DICTIONARY':    control = '<div class="mock-input dict">사전 검색</div>'; break;
    case 'AUTO_TEXT':     control = '<div class="mock-input sys">'+esc(item.labelDescriptions || '자동계산')+'</div>'; break;
    case 'SYS_VAL':       control = '<div class="mock-input sys">'+esc(item.blankPlaceholder||item.reserved||'시스템 값')+'</div>'; break;
    case 'SEQUENCE':      control = '<span class="seq-cell">#</span>'; break;
    case 'CONSTANT':      control = '<span class="constant-val">'+esc(String(item.value??''))+'</span>'+renderLabelDescriptions(item); break;
    default:              control = '<span style="color:#9ca3af;font-size:11px">['+esc(item.type)+']</span>';
  }
  return control + renderChildren(item, visitCode, visitType);
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
  if (isML) return '<div class="mock-input" style="height:54px;max-width:400px;align-items:flex-start;padding-top:6px;color:#9ca3af">텍스트 입력</div>';
  const input = '<div class="mock-input'+(isNum?' num':'')+'">'+( isNum?'0':'텍스트 입력')+'</div>';
  return suffix ? '<span class="mock-input-wrap">'+input+suffix+'</span>' : input;
}

function renderChildren(item, visitCode, visitType) {
  const children = item.children?.items || [];
  const visibleChildren = children.filter(child => isVisibleInVisit(child.visibility, visitCode, visitType));
  if (!visibleChildren.length) return '';
  const horizontal = item.children?.displayDirection === 'HORIZONTAL' || item.children?.direction === 'HORIZONTAL';
  const cls = horizontal ? ' child-controls-h' : '';
  return '<div class="child-controls'+cls+'">' +
    visibleChildren.map(child => '<span class="child-control">'+renderControl(child, visitCode, visitType)+'</span>').join('') +
  '</div>';
}

function renderCheck(item) {
  const codes = item.itemCode?.codes || [];
  const label = item.label || codes[0]?.uiVal || 'Check';
  return '<label class="mock-check"><span class="mock-check-box"></span><span>'+esc(label)+'</span></label>';
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

function renderDescription(item, pageId, sectionId, sectionLabel, itemIndex, visitLabel) {
  const descriptions = Array.isArray(item.description) ? item.description : [item.description].filter(Boolean);
  const text = descriptions.map(d=>esc(typeof d === 'string' ? d : d.text)).join(' ');
  const body = descriptions
    .map(d=>'<div class="desc-line">'+esc(typeof d === 'string' ? d : d.text)+'</div>')
    .join('');
  const id = item.id || ('DESCRIPTION__' + itemIndex);
  const key = makeKey(visitLabel, pageId, sectionId, id);
  const hasComment = !!comments[key];
  return '<div class="desc-row'+(hasComment?' has-comment':'')+'" data-key="'+esc(key)+'">' +
    '<div class="desc-box">'+body+'</div>' +
    '<button class="comment-btn'+(hasComment?' active':'')+
      '" data-key="'+esc(key)+
      '" data-visit="'+esc(visitLabel)+
      '" data-page="'+esc(pageId)+
      '" data-section="'+esc(sectionId)+
      '" data-section-label="'+esc(sectionLabel)+
      '" data-id="'+esc(id)+
      '" data-label="'+esc(text.slice(0, 80) || 'DESCRIPTION')+
      '" onclick="openModal(this)">&#128172;</button>' +
  '</div>';
}

function renderTable(item, pageId, sectionId, sectionLabel, visitLabel) {
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
      const key = makeKey(visitLabel, pageId, sectionId, rowId);
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
            '" data-visit="'+esc(visitLabel)+
            '" data-page="'+esc(pageId)+
            '" data-section="'+esc(sectionId)+
            '" data-section-label="'+esc(sectionLabel)+
            '" data-id="'+esc(rowId)+
            '" data-label="'+esc(item.id+' 쨌 '+rowLabel)+
            '" onclick="openModal(this)">&#128172;</button>' +
        '</td>';
      return '<tr class="'+(hasComment?'table-row-commented':'')+'" data-key="'+esc(key)+'">'+cells+commentTd+'</tr>';
    }).join('') + '</tbody>';

  return '<div class="table-wrap"><table class="crf-table">'+thead+tbody+'</table></div>';
}

function renderAppendableTable(item, pageId, sectionId, sectionLabel, visitLabel) {
  const cols = item.cols || [];
  if (!cols.length) return renderFieldRow(item, 'NORMAL', pageId, sectionId, sectionLabel, visitLabel);
  const key = makeKey(visitLabel, pageId, sectionId, item.id || 'APPENDABLE_TABLE');
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
          '" data-visit="'+esc(visitLabel)+
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
              '" data-visit="'+esc(visitLabel)+
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

// ?? highlights ????????????????????????????????????????????????????????????
function commentForKey(rowKey) {
  if (comments[rowKey]) return comments[rowKey];
  const parts = rowKey.split('::');
  if (parts.length === 4) return comments[parts.slice(1).join('::')] || null;
  return null;
}
function hasCommentForKey(rowKey) { return !!(commentForKey(rowKey)); }

function applyHighlights() {
  document.querySelectorAll('.item-row[data-key]').forEach(row => {
    const k = row.dataset.key;
    const has = hasCommentForKey(k);
    row.classList.toggle('has-comment', has);
    const btn = row.querySelector('.comment-btn');
    if (btn) btn.classList.toggle('active', has);
  });
  document.querySelectorAll('tr[data-key]').forEach(row => {
    const k = row.dataset.key;
    const has = hasCommentForKey(k);
    row.classList.toggle('table-row-commented', has);
    const btn = row.querySelector('.comment-btn');
    if (btn) btn.classList.toggle('active', has);
  });
  document.querySelectorAll('.desc-row[data-key]').forEach(row => {
    const k = row.dataset.key;
    const has = hasCommentForKey(k);
    row.classList.toggle('has-comment', has);
    const btn = row.querySelector('.comment-btn');
    if (btn) btn.classList.toggle('active', has);
  });
}

// ?? comment modal ?????????????????????????????????????????????????????????
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
    ' · ' + esc(btn.dataset.visit || '') +
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
    visitLabel:   btn?.dataset.visit || existing.visitLabel || '',
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

// ?? panel ?????????????????????????????????????????????????????????????????
const panel = document.getElementById('comment-panel');

document.getElementById('btn-toggle-panel').addEventListener('click', () => {
  panelOpen = !panelOpen;
  panel.classList.toggle('hidden', !panelOpen);
});
document.getElementById('panel-close').addEventListener('click', () => {
  panelOpen = false;
  panel.classList.add('hidden');
});
document.getElementById('tab-comments').addEventListener('click', () => switchTab('comments'));
document.getElementById('tab-completed').addEventListener('click', () => switchTab('completed'));
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
    if (actionBtn.dataset.action === 'reply') {
      editReplyFromPanel(key);
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
  else renderCompletedTab();
}

window.switchTab = function(tab) {
  activeTab = tab;
  document.getElementById('tab-comments').classList.toggle('active', tab === 'comments');
  document.getElementById('tab-completed')?.classList.toggle('active', tab === 'completed');
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
          (c.visitLabel ? '<span class="pi-visit">'+esc(c.visitLabel)+'</span>' : '') +
          '<span class="pi-id">'+esc(c.itemId)+'</span>' +
        '</div>' +
        '<div class="pi-label">'+esc(c.itemLabel)+'</div>' +
        '<div class="pi-text">'+esc(c.text)+'</div>' +
        (c.replyText ? '<div class="pi-reply"><div class="pi-reply-label">회신</div>'+esc(c.replyText)+'</div>' : '') +
        '<div class="pi-footer">' +
          (completed
            ? '<button class="pi-action pi-complete" data-action="complete" data-completed="false" data-comment-key="'+esc(c.key)+'">되돌리기</button>'
            : '<button class="pi-action pi-complete" data-action="complete" data-completed="true" data-comment-key="'+esc(c.key)+'">완료</button>') +
          '<button class="pi-action pi-reply-action" data-action="reply" data-comment-key="'+esc(c.key)+'">회신</button>' +
          '<button class="pi-action pi-edit" data-action="edit" data-comment-key="'+esc(c.key)+'">수정</button>' +
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

window.editReplyFromPanel = function(key) {
  const c = comments[key];
  if (!c) return;
  const reply = prompt('회신 내용을 입력하세요.', c.replyText || '검토완료');
  if (reply === null) return;
  c.replyText = reply.trim();
  c.repliedAt = c.replyText ? new Date().toISOString() : null;
  save();
  updatePanel();
  applyHighlights();
  refreshNavDots();
};

window.navigateFromPanel = function(key) {
  const c = comments[key];
  if (!c) return;
  const visitMatch = !c.visitLabel || c.visitLabel === currentVisitLabel;
  if (c.pageId !== currentPageId || !visitMatch) {
    const navBtn = findNavButton(c.pageId, c.visitLabel);
    if (navBtn) navBtn.click();
    setTimeout(() => navigateFromPanel(key), 80);
    return;
  }
  flashCommentTarget(key);
};

window.editFromPanel = function(key) {
  const c = comments[key];
  if (!c) return;
  const visitMatch2 = !c.visitLabel || c.visitLabel === currentVisitLabel;
  if (c && (c.pageId !== currentPageId || !visitMatch2)) {
    const navBtn = findNavButton(c.pageId, c.visitLabel);
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
    '<strong>'+esc(c.itemLabel||c.itemId||'?볤?')+'</strong>' +
    ' <span style="font-family:monospace">'+esc(c.itemId||'')+'</span>' +
    ' 쨌 ' + esc(c.sectionLabel||'');
  overlay.classList.add('open');
  textarea.focus();
};

// ?? badge ?????????????????????????????????????????????????????????????????
function updateBadge() {
  const openComments = Object.values(comments).filter(c => !c.completed).length;
  const completedComments = Object.values(comments).filter(c => !!c.completed).length;
  const nc = openComments + completedComments;
  document.getElementById('comment-badge').textContent = nc > 0 ? String(nc) : '';
  const cb = document.getElementById('tab-badge-comments');
  const db = document.getElementById('tab-badge-completed');
  if (cb) cb.textContent = String(openComments);
  if (db) db.textContent = String(completedComments);
}

function refreshNavDots() {
  const pagesWithComments = new Set(Object.values(comments).map(c => navCommentKey(c.visitLabel || '', c.pageId)));
  document.querySelectorAll('.nav-crf').forEach(btn => {
    const pid = btn.dataset.pageId;
    const visit = btn.dataset.visitLabel || '';
    const dot = btn.querySelector('.nav-comment-dot');
    if (dot) dot.style.display = pagesWithComments.has(navCommentKey(visit, pid)) ? 'block' : 'none';
  });
}

// ?? export / import ???????????????????????????????????????????????????????
document.getElementById('btn-export').addEventListener('click', () => {
  const payload = { study: STUDY, exportedAt: new Date().toISOString(), comments };
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
      save();
      applyHighlights();
      updateBadge();
      updatePanel();
      refreshNavDots();
      const activeBtn = document.querySelector('.nav-crf.active');
      if (activeBtn) activeBtn.click();
      alert('?볤? ' + Object.keys(imported).length + '媛쒕? 媛?몄솕?듬땲??');
    } catch(err) { alert('?뚯씪???쎌쓣 ???놁뒿?덈떎: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ?? help ??????????????????????????????????????????????????????????????????
const helpOverlay = document.getElementById('help-overlay');
document.getElementById('btn-help').addEventListener('click', () => helpOverlay.classList.add('open'));
document.getElementById('help-close').addEventListener('click', () => helpOverlay.classList.remove('open'));
helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.classList.remove('open'); });

// ?? utils ?????????????????????????????????????????????????????????????????
function save() { localStorage.setItem(LS_KEY, JSON.stringify(comments)); }

function makeKey(visitLabel, pageId, sectionId, itemId) {
  return (visitLabel || '') + '::' + pageId + '::' + sectionId + '::' + itemId;
}

function navCommentKey(visitLabel, pageId) {
  return (visitLabel || '') + '::' + pageId;
}

function findNavButton(pageId, visitLabel) {
  const visit = visitLabel || '';
  return Array.from(document.querySelectorAll('.nav-crf[data-page-id="'+pageId+'"]'))
    .find(btn => (btn.dataset.visitLabel || '') === visit)
    || document.querySelector('.nav-crf[data-page-id="'+pageId+'"]');
}

function saveSelectedNav(visitLabel, pageId) {
  try {
    localStorage.setItem(LS_VIEW_KEY, JSON.stringify({ visitLabel, pageId }));
  } catch(e) {}
}

function restoreSelectedNav() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(LS_VIEW_KEY) || 'null');
  } catch(e) {}
  const savedBtn = saved && saved.pageId
    ? findNavButton(saved.pageId, saved.visitLabel || '')
    : null;
  const firstPageBtn = document.querySelector('.nav-crf:not(.nav-schedule)');
  const fallback = savedBtn || firstPageBtn || document.querySelector('.nav-crf');
  if (fallback) fallback.click();
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
  const direct = Array.from(document.querySelectorAll('.comment-btn')).find(b => b.dataset.key === key);
  if (direct) return direct;
  if (key.split('::').length === 3) {
    return Array.from(document.querySelectorAll('.comment-btn')).find(b => b.dataset.key && b.dataset.key.endsWith('::' + key)) || null;
  }
  return null;
}

function findCommentTarget(key) {
  const btn = findCommentBtn(key);
  if (btn) return btn.closest('[data-key]') || btn;
  const direct = Array.from(document.querySelectorAll('[data-key]')).find(el => el.dataset.key === key);
  if (direct) return direct;
  if (key.split('::').length === 3) {
    return Array.from(document.querySelectorAll('[data-key]')).find(el => el.dataset.key && el.dataset.key.endsWith('::' + key)) || null;
  }
  return null;
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
