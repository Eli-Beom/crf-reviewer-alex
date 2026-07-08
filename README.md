# CRF Reviewer

CRF Reviewer is a TypeScript-based review utility that turns CRF study definitions into navigable HTML previews and review documents.

It was built to make CRF setup review faster and more traceable: instead of checking large TypeScript CRF definitions file by file, reviewers can inspect pages, visits, item labels, input controls, table structures, comments, and completion status in a single generated artifact.

## Background

This project came out of practical EDC/CRF setup work. CRF drafts often need repeated review cycles across page structure, visit placement, item wording, controlled terminology, required fields, and sponsor-facing comments. Reviewing those details directly in source files is slow and easy to lose track of, especially when a draft changes over multiple iterations.

CRF Reviewer was created as a small internal productivity tool to:

- render CRF definitions into readable HTML previews
- provide separate client-facing and internal review modes
- support item-level comments and completion tracking
- export/import review comments as JSON
- generate a Word document version for offline or formal review
- help compare CRF page structure without relying only on screenshots

The local project files indicate the tool work started around early June 2026. The public GitHub repository was created separately on July 8, 2026 as a sanitized portfolio version.

## Features

- HTML preview generation from TypeScript CRF study folders
- Client mode for lightweight review and comments
- Internal mode with additional review aids and type inspection
- Comment panel with open/completed status
- JSON export/import for review state
- Optional DOCX generation
- Live watch workflow for rebuilding previews during development

## Repository Scope

This public repository is a sanitized version of the tool. It does not include proprietary study data, real protocol content, subject data, sponsor materials, or internal company documentation.

Generated outputs and local review artifacts are intentionally excluded from version control.

## Requirements

- Node.js
- npm
- A CRF source directory available locally

Install dependencies:

```bash
npm install
```

## Usage

Set `CRF_BASE` to the directory that contains CRF study folders.

```bash
export CRF_BASE=/path/to/crf/studies
```

Generate a client-facing preview:

```bash
npm run client -- SAMPLE_STUDY --out ./output/preview-client.html
```

Generate an internal preview:

```bash
npm run internal -- SAMPLE_STUDY --out ./output/preview-internal.html
```

Generate a Word document:

```bash
npm run docx -- SAMPLE_STUDY ./output/preview.docx
```

Watch and rebuild during development:

```bash
npm run watch -- SAMPLE_STUDY --out ./output/preview.html
```

## Project Structure

```text
scripts/
  generate-client.ts      Client-facing HTML generator
  generate-internal.ts    Internal HTML generator
  generate-preview.ts     Shared preview entrypoint
  generate-docx.ts        Word document generator
  watch.ts                Watch/rebuild entrypoint
  core/                   Shared rendering, preview, navigation, and browser logic

docs/
  index.html              Public documentation landing page
```

## Notes

This project is intentionally framework-light. Most output is generated as static HTML so it can be shared, opened, and reviewed without running a server.
