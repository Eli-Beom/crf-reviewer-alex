# eCRF Reviewer

CRF Reviewer is a TypeScript-based review utility that turns CRF study definitions into navigable HTML previews and review documents.

It was built to make CRF setup review faster and more traceable. Reviewers can inspect pages, visits, item labels, input controls, table structures, comments, and completion status in a single generated artifact before going through a full EDC extraction flow.

## Background

This project came out of practical EDC/CRF setup work. In the previous workflow, CRF definitions had to be converted into payloads and then extracted as e-CRFs before reviewers could inspect the actual screen-like output. That made early review slow, especially when the goal was to check page structure, visit placement, item wording, controlled terminology, required fields, and table layouts during active setup.

The e-CRF output was useful as a final review artifact, but it was not ideal for iterative review. Comments were hard to manage across versions, item-level feedback was difficult to track, and it was easy to lose which issues were still open or already resolved after several rounds of changes.

CRF Reviewer addresses that gap by generating a lightweight review view directly from CRF source definitions. It gives reviewers a faster way to inspect the draft, leave item-level comments, track completion, and share review state without waiting for the full payload-to-e-CRF extraction cycle every time.

CRF Reviewer was created as a small internal productivity tool to:

- render CRF definitions into readable HTML previews
- provide an internal review mode
- support item-level comments and completion tracking
- export/import review comments as JSON
- generate a Word document version for offline or formal review
- help compare CRF page structure without relying only on screenshots


## Features

- HTML preview generation from TypeScript CRF study folders
- Internal mode with review aids and type inspection
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
