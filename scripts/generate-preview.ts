import { generatePreview, parseGenerateArgs } from "./core/preview.js";

async function main() {
  const mode = process.argv.includes("--internal") ? "internal" : "client";
  const args = process.argv.slice(2).filter((arg) => arg !== "--internal");
  const options = parseGenerateArgs(args, mode);
  const result = await generatePreview(options);

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
  console.log(`${mode} preview written to: ${result.outputFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
