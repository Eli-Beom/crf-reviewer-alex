import { generatePreview, parseGenerateArgs } from "./core/preview.js";

async function main() {
  const options = parseGenerateArgs(process.argv.slice(2), "internal");
  const result = await generatePreview(options);

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
  console.log(`Internal preview written to: ${result.outputFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
