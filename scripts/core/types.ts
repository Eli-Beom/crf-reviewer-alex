export interface NavPage {
  pageId: string;
  domainLabel: string;
}

export interface NavEntry {
  visitLabel: string;
  visitCode?: number;
  visitType?: string;
  pages: NavPage[];
}

export interface TypeStatResult {
  stats: Record<string, Record<string, number>>;
  labelStats: Record<string, Record<string, number>>;
}

export type PreviewMode = "internal";

export interface BuildHtmlOptions {
  study: string;
  studyInfo: StudyInfo;
  pages: Record<string, any>;
  folders: any[];
  domains: Record<string, any>;
  typeStats?: TypeStatResult;
  mode: PreviewMode;
  reviewState?: Record<string, any>;
}

export interface StudyInfo {
  protocolNo: string;
  title: string;
  phase: string;
  coverDescriptions: Array<{ label: string; text: string }>;
  headerItems: any[];
}

export interface GeneratePreviewOptions {
  study: string;
  crfBase: string;
  outputFile: string;
  mode: PreviewMode;
  includeStats: boolean;
  commentsFile?: string;
}

export interface GeneratePreviewResult {
  outputFile: string;
  warnings: string[];
}
