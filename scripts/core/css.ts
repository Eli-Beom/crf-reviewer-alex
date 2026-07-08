/** Shared CSS for both client and internal HTML output */

export const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --sw: 256px;    /* sidebar width */
  --pw: 300px;    /* panel width */
  --blue: #0078d4;
  --g1:#f3f4f6; --g2:#e5e7eb; --g3:#9ca3af; --g4:#6b7280; --g5:#374151;
  --text:#111827; --border:#d1d5db;
  --red:#dc2626; --yellow-bg:#fefce8; --yellow-border:#fde047;
  --comment-dot:#f59e0b;
  font-family:'Segoe UI',-apple-system,sans-serif;
  font-size:13px;
  color:var(--text);
}

body{height:100vh;overflow:hidden;background:var(--g1)}
#app{display:flex;height:100vh}

/* Sidebar */
#sidebar{
  width:var(--sw);min-width:var(--sw);
  background:#1e293b;color:#e2e8f0;
  display:flex;flex-direction:column;overflow:hidden;
  flex-shrink:0;
}
#sidebar-header{padding:14px 16px;border-bottom:1px solid #334155;background:#0f172a}
.study-label{font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.5px;text-transform:uppercase}
.study-subtitle{font-size:13px;font-weight:600;color:#f1f5f9;margin-top:2px}

#nav{flex:1;overflow-y:auto;padding:6px 0}
#nav::-webkit-scrollbar{width:4px}
#nav::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}

.nav-visit-header{
  padding:5px 14px;font-size:10px;font-weight:700;
  color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-top:6px;
}
.nav-crf{
  display:flex;align-items:center;
  padding:6px 10px 6px 18px;cursor:pointer;gap:6px;
  transition:background .12s;position:relative;
}
.nav-crf:hover{background:#334155}
.nav-crf.active{background:#1d4ed8}
.nav-page-id{font-size:11px;font-weight:700;color:#cbd5e1;min-width:38px}
.nav-crf.active .nav-page-id{color:#fff}
.nav-domain{font-size:11px;color:#94a3b8;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-crf.active .nav-domain{color:#93c5fd}
.nav-comment-dot{
  width:7px;height:7px;border-radius:50%;
  background:var(--comment-dot);flex-shrink:0;
}

/* Center */
#center{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

#topbar{
  background:#fff;border-bottom:1px solid var(--border);
  padding:0 20px;height:44px;
  display:flex;align-items:center;gap:12px;flex-shrink:0;
}
#page-breadcrumb{font-size:12px;color:var(--g4);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#page-breadcrumb strong{color:var(--text);font-weight:600}
#topbar-actions{display:flex;align-items:center;gap:6px}

.tb-btn{
  height:28px;padding:0 10px;border-radius:4px;border:1px solid var(--border);
  background:#fff;font-size:11px;color:var(--g5);cursor:pointer;white-space:nowrap;
  transition:background .12s;
}
.tb-btn:hover{background:var(--g1)}
.tb-btn.ghost{border-color:transparent;background:transparent}
.tb-btn.ghost:hover{background:var(--g1)}

#comment-badge{
  display:inline-block;background:var(--comment-dot);color:#fff;
  font-size:10px;font-weight:700;padding:0 5px;border-radius:10px;margin-left:3px;
  vertical-align:middle;
}
#comment-badge:empty{display:none}

#crf-body{flex:1;overflow-y:auto;padding:18px 22px 40px}
#crf-body::-webkit-scrollbar{width:6px}
#crf-body::-webkit-scrollbar-thumb{background:var(--g2);border-radius:3px}

/* CRF page header */
.crf-meta{
  background:#fff;
  margin-bottom:14px;
}
.crf-meta-table{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  border:2px solid #1f2937;
  font-size:13px;
}
.crf-meta-table th,
.crf-meta-table td{
  border:1px solid #1f2937;
  padding:8px 10px;
  height:34px;
  text-align:center;
  vertical-align:middle;
}
.crf-meta-table th{
  background:#f3f4f6;
  font-weight:700;
  color:#111827;
}
.crf-meta-table td:first-child{
  text-align:left;
}

/* CRF cover */
.cover-page{
  background:#fff;
  min-height:980px;
  padding:28px 38px 48px;
  color:#111827;
  display:flex;
  flex-direction:column;
}
.cover-title{
  text-align:center;
  padding-top:4px;
}
.cover-title h1{
  margin:0;
  font-size:30px;
  line-height:1.1;
  font-weight:800;
  letter-spacing:0;
}
.cover-title h2{
  margin:8px 0 0;
  font-size:24px;
  line-height:1.2;
  font-weight:700;
  letter-spacing:0;
}
.cover-spacer{flex:1;min-height:520px}
.cover-table{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  border:1px solid #111827;
  font-size:12px;
}
.cover-table th,
.cover-table td{
  border:1px solid #111827;
  padding:8px 12px;
  line-height:1.45;
  vertical-align:middle;
}
.cover-table th{
  width:110px;
  text-align:left;
  font-weight:700;
  background:#f9fafb;
}
.cover-table tr.cover-gap th,
.cover-table tr.cover-gap td{
  border-left:0;
  border-right:0;
  height:16px;
  padding:0;
  background:#fff;
}

/* CRF sections */
.crf-section{
  background:#fff;border:1px solid var(--border);
  border-radius:6px;margin-bottom:14px;overflow:hidden;
}
.section-header{
  background:#f8fafc;border-bottom:1px solid var(--border);
  padding:9px 16px;font-size:13px;font-weight:600;color:var(--g5);
}

.item-row{
  display:flex;align-items:flex-start;
  padding:7px 12px 7px 16px;border-bottom:1px solid var(--g2);
  min-height:38px;transition:background .15s;
}
.item-row:last-child{border-bottom:none}
.item-row.has-comment{background:var(--yellow-bg);border-left:3px solid var(--yellow-border)}
.item-row.has-comment .item-label{padding-left:0}

.item-label{
  width:210px;min-width:210px;padding-right:12px;padding-top:5px;
  font-size:12.5px;color:var(--g5);line-height:1.4;
}
.item-label.double{width:310px;min-width:310px}
.item-label.criteria{width:560px;min-width:560px}
.item-label-main{display:block}
.item-label-text{vertical-align:baseline}
.item-id{
  display:block;
  width:max-content;
  max-width:100%;
  margin-top:2px;
  padding:1px 5px;
  border-radius:3px;
  background:#eff6ff;
  color:#2563eb;
  font-size:10px;
  line-height:1.35;
  font-family:Consolas,'SFMono-Regular',monospace;
  font-weight:600;
  word-break:break-all;
}
.required-mark{color:var(--red);margin-left:2px}
.label-desc{font-size:10px;color:var(--g3);margin-top:2px}
.label-desc.inline{
  display:inline;
  margin-top:0;
  margin-left:4px;
  color:#6b7280;
  font-size:12px;
  vertical-align:baseline;
}

.item-control{flex:1;display:flex;align-items:center;gap:6px;flex-wrap:wrap}

/* comment bubble btn */
.comment-btn{
  width:24px;height:24px;border:none;background:transparent;
  cursor:pointer;font-size:14px;opacity:.35;
  transition:opacity .15s;flex-shrink:0;align-self:center;
  border-radius:4px;display:flex;align-items:center;justify-content:center;
}
.comment-btn:hover{opacity:.9;background:var(--g1)}
.comment-btn.active{opacity:1;color:var(--comment-dot)}

/* mock form controls */
.mock-input{
  height:28px;border:1px solid var(--border);border-radius:4px;
  padding:0 8px;font-size:12px;color:var(--g4);background:#fff;
  min-width:130px;max-width:250px;width:100%;
  cursor:default;display:flex;align-items:center;
}
.mock-input.date{max-width:150px}
.mock-input.num{max-width:110px}
.mock-input.sys{background:var(--g1);color:var(--g3);max-width:190px}
.mock-input.dict{max-width:220px;color:var(--g4);background:#fff}
.mock-input-wrap{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;max-width:100%}
.mock-input-wrap .mock-input{margin:0}
.mock-suffix{display:inline-flex;align-items:center;font-size:12px;color:var(--g4)}
.child-controls{display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap}
.child-controls-h{display:inline-flex;margin-top:0;margin-left:8px}
.child-control{display:inline-flex;align-items:center}
.mock-check{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--g5);white-space:nowrap;cursor:default}
.mock-check-box{width:13px;height:13px;border:1px solid var(--g3);border-radius:2px;background:#fff;display:inline-block;flex-shrink:0}

.radio-group{display:flex;flex-direction:column;gap:3px;padding-top:3px}
.radio-group.h{flex-direction:row;flex-wrap:wrap;gap:10px}
.radio-opt{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--g5);cursor:default}
.radio-dot{width:13px;height:13px;border-radius:50%;border:2px solid var(--g3);background:#fff;flex-shrink:0}

.mock-select{
  height:28px;border:1px solid var(--border);border-radius:4px;
  padding:0 22px 0 8px;font-size:12px;color:var(--g4);background:#fff;
  min-width:130px;max-width:210px;cursor:default;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239ca3af'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 7px center;
}

.desc-box{
  margin:8px 16px;padding:9px 13px;
  background:#f0f7ff;border-left:3px solid var(--blue);
  border-radius:0 4px 4px 0;font-size:12px;color:#1e40af;line-height:1.6;
}
.desc-row{
  display:flex;align-items:center;gap:8px;
  padding:0 12px 0 0;border-bottom:1px solid var(--g2);
}
.desc-row:last-child{border-bottom:none}
.desc-row .desc-box{flex:1}
.desc-line + .desc-line{margin-top:4px}
.desc-row.has-comment{background:var(--yellow-bg);border-left:3px solid var(--yellow-border)}
.desc-row.has-comment .desc-box{margin-left:13px;background:#fffbeb;border-left-color:var(--comment-dot);color:#92400e}

.schedule-section{
  background:#fff;border:1px solid var(--border);
  border-radius:6px;margin-bottom:14px;overflow:hidden;
}
.schedule-header{
  background:#e5e7eb;border-bottom:1px solid #111827;
  padding:8px 12px;font-weight:700;color:#111827;
}
.schedule-wrap{overflow-x:auto}
.schedule-table{width:100%;border-collapse:collapse;font-size:12px;min-width:760px}
.schedule-table th,.schedule-table td{
  border:1px solid #111827;padding:6px 7px;text-align:center;vertical-align:middle;
}
.schedule-table th{background:#f3f4f6;font-weight:700}
.schedule-table th:first-child,.schedule-table td:first-child{
  text-align:left;min-width:180px;background:#fff;font-weight:500;
}
.schedule-check{font-size:15px;color:#374151;line-height:1}

.crf-table{width:100%;border-collapse:collapse;font-size:12px}
.crf-table th{
  background:#f1f5f9;border:1px solid var(--border);
  padding:6px 9px;text-align:center;font-weight:600;color:var(--g5);font-size:11px;
}
.crf-table td{
  border:1px solid var(--border);padding:5px 7px;
  vertical-align:middle;text-align:center;
}
.crf-table td.l{text-align:left}
.constant-val{font-size:12px;color:var(--g5)}
.seq-cell{font-size:12px;font-weight:600;color:var(--g4)}
.table-wrap{padding:12px 16px;overflow-x:auto}
.appendable-wrap{padding-top:0}
.appendable-table .mock-input,
.appendable-table .mock-select{min-width:90px;max-width:100%}
.td-comment-btn{width:36px;text-align:center;border:1px solid var(--border)}
.table-row-commented td{background:var(--yellow-bg)!important}
.table-row-commented .td-comment-btn{background:#fef9c3!important}

.empty-state{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;height:60vh;color:var(--g3);gap:8px;
}
.empty-state .icon{font-size:40px}

/* Comment Panel */
#comment-panel{
  width:var(--pw);min-width:var(--pw);
  background:#fff;border-left:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;
  flex-shrink:0;transition:width .2s,min-width .2s;
}
#comment-panel.hidden{width:0;min-width:0;border-left:none;overflow:hidden}

#panel-header{
  padding:10px 14px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;background:#f8fafc;flex-shrink:0;
}
#panel-title{font-size:13px;font-weight:600;color:var(--g5);flex:1}
#panel-close{border:none;background:transparent;cursor:pointer;font-size:16px;color:var(--g3);padding:2px 4px}
#panel-close:hover{color:var(--text)}

#panel-list{flex:1;overflow-y:auto;padding:10px}
#panel-list::-webkit-scrollbar{width:4px}
#panel-list::-webkit-scrollbar-thumb{background:var(--g2);border-radius:2px}

.panel-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:200px;color:var(--g3);font-size:12px;gap:6px;
}
.panel-empty .ei{font-size:28px}

.panel-group{margin-bottom:14px}
.panel-group-title{
  font-size:10px;font-weight:700;color:var(--g3);
  text-transform:uppercase;letter-spacing:.5px;
  padding:4px 0;border-bottom:1px solid var(--g2);margin-bottom:6px;
}
.panel-tabs{display:flex;border-bottom:1px solid var(--border);flex-shrink:0}
.panel-tab{
  flex:1;padding:7px 0;font-size:11px;font-weight:600;
  border:none;background:transparent;cursor:pointer;
  color:var(--g4);border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:color .15s;
}
.panel-tab.active{color:var(--blue);border-bottom-color:var(--blue)}
.panel-tab-badge{
  display:inline-block;background:var(--g2);color:var(--g5);
  font-size:9px;font-weight:700;padding:0 4px;border-radius:8px;margin-left:3px;
  vertical-align:middle;
}
.panel-tab.active .panel-tab-badge{background:var(--blue);color:#fff}

.panel-item{
  background:var(--yellow-bg);border:1px solid var(--yellow-border);
  border-radius:5px;padding:8px 10px;margin-bottom:6px;
  cursor:pointer;
  transition:background .12s, border-color .12s;
}
.panel-item:hover{background:#fffbeb;border-color:#f59e0b}
.panel-item.completed-item{
  background:#f8fafc;border-color:#cbd5e1;
}
.panel-item.completed-item:hover{background:#f1f5f9;border-color:#94a3b8}
.panel-item.override-item{
  background:#eff6ff;border:1px solid #bfdbfe;
  cursor:default;
}
.panel-item.override-item:hover{background:#eff6ff;border-color:#bfdbfe}
.comment-flash{
  outline:2px solid var(--comment-dot);
  outline-offset:-2px;
  box-shadow:0 0 0 4px rgba(245,158,11,.18);
  background:#fff3bf!important;
  transition:background .25s ease, box-shadow .25s ease, outline-color .25s ease;
}
.panel-item-meta{
  display:flex;align-items:center;gap:6px;margin-bottom:4px;
}
.pi-page{
  background:#1d4ed8;color:#fff;font-size:9px;font-weight:700;
  padding:1px 5px;border-radius:3px;
}
.pi-visit{
  background:#e0f2fe;color:#0369a1;font-size:9px;font-weight:700;
  padding:1px 5px;border-radius:3px;
}
.pi-id{font-size:10px;font-family:monospace;color:var(--g4)}
.pi-label{font-size:11px;color:var(--g5);font-weight:500}
.pi-text{font-size:12px;color:var(--text);line-height:1.5;white-space:pre-wrap;word-break:break-all}
.pi-reply{
  margin-top:7px;padding:7px 8px;border-left:3px solid #22c55e;
  background:#f0fdf4;color:#166534;border-radius:4px;
  font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-all;
}
.pi-reply-label{
  font-size:10px;font-weight:700;color:#047857;margin-bottom:2px;
}
.pi-type-change{
  display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;
}
.pi-type-from{
  background:#dbeafe;color:#1d4ed8;border-radius:3px;padding:1px 6px;font-size:11px;
}
.pi-type-to{
  background:#dcfce7;color:#166534;border-radius:3px;padding:1px 6px;font-size:11px;
}
.pi-arrow{color:var(--g3);font-size:11px}
.pi-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:6px}
.pi-action{
  font-size:10px;color:var(--blue);cursor:pointer;
  border:none;background:transparent;padding:0;text-decoration:underline;
}
.pi-complete{color:#047857}
.completed-item .pi-complete{color:#b45309}
.nav-override-dot{
  width:7px;height:7px;border-radius:2px;
  background:#3b82f6;flex-shrink:0;
}


/* Help Modal */
#help-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.45);
  display:none;align-items:center;justify-content:center;z-index:2000;
}
#help-overlay.open{display:flex}
#help-modal{
  background:#fff;border-radius:10px;width:520px;max-height:80vh;
  box-shadow:0 20px 60px rgba(0,0,0,.25);
  display:flex;flex-direction:column;overflow:hidden;
}
#help-header{
  padding:16px 20px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  background:#f8fafc;flex-shrink:0;
}
#help-header span{font-size:15px;font-weight:700;color:var(--g5)}
#help-close{border:none;background:transparent;cursor:pointer;font-size:18px;color:var(--g3)}
#help-close:hover{color:var(--text)}
#help-body{overflow-y:auto;padding:20px}
#help-body::-webkit-scrollbar{width:4px}
#help-body::-webkit-scrollbar-thumb{background:var(--g2);border-radius:2px}

.help-section{margin-bottom:20px}
.help-section:last-child{margin-bottom:0}
.help-section-title{
  font-size:13px;font-weight:700;color:var(--text);
  margin-bottom:10px;padding-bottom:6px;
  border-bottom:2px solid var(--blue);
  display:inline-block;
}
.help-step{
  display:flex;align-items:flex-start;gap:10px;
  margin-bottom:8px;
}
.step-num{
  width:20px;height:20px;border-radius:50%;
  background:var(--blue);color:#fff;
  font-size:11px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;margin-top:1px;
}
.help-step div{font-size:13px;color:var(--g5);line-height:1.6}
.help-step b{color:var(--text)}
.help-step code{
  background:var(--g1);border:1px solid var(--border);
  border-radius:3px;padding:1px 5px;font-size:11px;font-family:monospace;color:var(--g5);
}
.yellow-chip{
  background:#fef9c3;border:1px solid #fde047;
  border-radius:3px;padding:1px 6px;font-size:11px;
}

/* Modal */
#modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.45);
  display:none;align-items:center;justify-content:center;z-index:1000;
}
#modal-overlay.open{display:flex}
#modal{
  background:#fff;border-radius:8px;padding:20px;width:420px;
  box-shadow:0 20px 60px rgba(0,0,0,.25);
}
#modal-meta{
  font-size:11px;color:var(--g4);margin-bottom:10px;
  padding-bottom:8px;border-bottom:1px solid var(--g2);
}
#modal-meta strong{color:var(--text);font-size:12px}
#modal-textarea{
  width:100%;border:1px solid var(--border);border-radius:5px;
  padding:10px;font-size:13px;font-family:inherit;resize:vertical;
  outline:none;transition:border .15s;
}
#modal-textarea:focus{border-color:var(--blue)}
#modal-actions{display:flex;align-items:center;gap:8px;margin-top:12px}
.btn-primary{
  padding:6px 16px;border-radius:5px;border:none;
  background:var(--blue);color:#fff;font-size:13px;cursor:pointer;
}
.btn-primary:hover{background:#005fa3}
.btn-ghost{
  padding:6px 12px;border-radius:5px;border:1px solid var(--border);
  background:#fff;font-size:13px;cursor:pointer;color:var(--g5);
}
.btn-ghost:hover{background:var(--g1)}
.btn-danger{
  padding:6px 12px;border-radius:5px;border:1px solid #fecaca;
  background:#fff;font-size:13px;cursor:pointer;color:var(--red);
}
.btn-danger:hover{background:#fef2f2}

/* Toast */
.toast{
  position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(16px);
  background:#1e293b;color:#f1f5f9;
  padding:9px 20px;border-radius:20px;font-size:12px;
  opacity:0;transition:opacity .22s,transform .22s;
  pointer-events:none;z-index:9999;white-space:nowrap;
  box-shadow:0 4px 16px rgba(0,0,0,.3);
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

`;


