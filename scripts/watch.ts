import { parseWatchArgs, startWatch } from "./core/live-watch.js";

async function main() {
  const options = parseWatchArgs(process.argv.slice(2));
  await startWatch(options);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
