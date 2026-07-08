import * as cp from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as http from "http";
import * as os from "os";
import * as path from "path";
import { resolveCrfBase, resolveStudyPath } from "./preview.js";

interface WatchOptions {
  study: string;
  crfBase: string;
  port: number;
  openBrowser: boolean;
}

export function parseWatchArgs(argv: string[]): WatchOptions {
  const args = [...argv];
  const openBrowser = !removeFlag(args, "--no-open");
  const crfBase = path.resolve(popOption(args, "--crf-base") ?? resolveCrfBase());
  const portFromFlag = popOption(args, "--port");
  const study = args[0];

  if (!study) {
    throw new Error(
      "Usage: npm run watch -- <study-dir-name> [port] [--no-open] [--crf-base <path>]"
    );
  }

  const positionalPort = args.find((arg, index) => index > 0 && /^\d+$/.test(arg));
  const port = Number(portFromFlag ?? positionalPort ?? 3456);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${port}`);
  }

  return { study, crfBase, port, openBrowser };
}

export async function startWatch(options: WatchOptions): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const studyPath = resolveStudyPath(options.crfBase, options.study);
  if (!fs.existsSync(studyPath)) {
    throw new Error(`Study not found: ${studyPath}`);
  }

  const state = {
    htmlFile: path.join(os.tmpdir(), `crf-watch-${options.study}.html`),
    building: false,
    pending: false,
    lastError: "",
    lastHtmlHash: "",
    hasBuiltOnce: false,
    version: 0,
  };

  const rebuild = () => {
    if (state.building) {
      state.pending = true;
      return;
    }

    state.building = true;
    state.lastError = "";
    const startedAt = Date.now();
    process.stdout.write(`\nBuilding ${options.study}... `);

    const proc = spawnGenerator(options, state.htmlFile);
    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (error) => {
      state.building = false;
      state.lastError = error.message;
      console.error(`failed\n${error.message}`);
      if (state.pending) {
        state.pending = false;
        rebuild();
      }
    });

    proc.on("close", (code) => {
      state.building = false;
      if (code === 0) {
        console.log(`done in ${Date.now() - startedAt}ms`);
        const nextHash = hashFile(state.htmlFile);
        if (!state.hasBuiltOnce) {
          state.hasBuiltOnce = true;
          state.lastHtmlHash = nextHash;
          state.version += 1;
          console.log("Initial build ready.");
        } else if (nextHash && nextHash !== state.lastHtmlHash) {
          state.lastHtmlHash = nextHash;
          state.version += 1;
          console.log("HTML updated. Browser reload is manual.");
        } else {
          console.log("No HTML change.");
        }
      } else {
        state.lastError = stderr.trim() || `generator exited with ${code}`;
        console.error(`failed\n${state.lastError}`);
      }
      if (state.pending) {
        state.pending = false;
        rebuild();
      }
    });
  };

  const server = http.createServer((req, res) => {
    if (req.url === "/__status") {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          version: state.version,
          building: state.building,
          error: state.lastError,
        })
      );
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(readHtml(state.htmlFile, state.lastError, state.version));
  });

  const port = await listen(server, options.port);
  const url = `http://localhost:${port}`;
  console.log(`\nCRF watch server: ${url}`);
  const reviewerScriptsPath = path.join(projectRoot, "scripts");

  console.log(`Watching CRF: ${studyPath}`);
  console.log(`Watching reviewer: ${reviewerScriptsPath}`);
  console.log("Save a CRF or reviewer .ts file to rebuild. Reload from the top-center badge when ready.\n");

  if (options.openBrowser) {
    openUrl(url);
  }

  let debounce: ReturnType<typeof setTimeout> | undefined;
  const sourceHashes = new Map<string, string>();
  seedSourceHashes(studyPath, sourceHashes);
  seedSourceHashes(reviewerScriptsPath, sourceHashes);
  const scheduleRebuild = (label: string) => {
    console.log(`Changed: ${label}`);
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = undefined;
      rebuild();
    }, 250);
  };

  fs.watch(studyPath, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith(".ts")) return;
    const file = filename.toString();
    const fullPath = path.join(studyPath, file);
    if (!hasRealContentChange(fullPath, sourceHashes)) return;
    scheduleRebuild(path.join(options.study, file));
  });

  fs.watch(reviewerScriptsPath, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith(".ts")) return;
    const file = filename.toString();
    const fullPath = path.join(reviewerScriptsPath, file);
    if (!hasRealContentChange(fullPath, sourceHashes)) return;
    scheduleRebuild(path.join("crf-reviewer", "scripts", file));
  });

  rebuild();
}

function hashFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

function seedSourceHashes(rootPath: string, sourceHashes: Map<string, string>): void {
  for (const filePath of listTsFiles(rootPath)) {
    sourceHashes.set(filePath, hashFile(filePath));
  }
}

function listTsFiles(rootPath: string): string[] {
  const result: string[] = [];
  if (!fs.existsSync(rootPath)) return result;
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    const fullPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      result.push(...listTsFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      result.push(fullPath);
    }
  }
  return result;
}

function hasRealContentChange(filePath: string, sourceHashes: Map<string, string>): boolean {
  try {
    const nextHash = hashFile(filePath);
    const previousHash = sourceHashes.get(filePath);
    sourceHashes.set(filePath, nextHash);
    return previousHash !== nextHash;
  } catch {
    return true;
  }
}

function spawnGenerator(options: WatchOptions, outputFile: string): cp.ChildProcess {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const tsxCli = path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const scriptPath = path.join(projectRoot, "scripts", "generate-preview.ts");
  const args = [
    tsxCli,
    scriptPath,
    options.study,
    outputFile,
    "--crf-base",
    options.crfBase,
  ];

  return cp.spawn(process.execPath, args, {
    cwd: projectRoot,
    stdio: ["ignore", "ignore", "pipe"],
  });
}

function readHtml(htmlFile: string, lastError: string, version: number): string {
  const body = fs.existsSync(htmlFile)
    ? fs.readFileSync(htmlFile, "utf-8")
    : placeholderHtml(lastError || "First build is running...");

  const snippet = `<script>
(function(){
  var initialVersion = ${JSON.stringify(version)};
  var badge = document.createElement('button');
  badge.type = 'button';
  badge.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;font:12px/28px monospace;padding:0 14px;border:0;border-radius:14px;z-index:99999;opacity:.95;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.22)';
  badge.textContent = 'watch';
  badge.title = 'Click to reload the latest preview';
  badge.onclick = function(){ location.reload(); };
  document.body.appendChild(badge);
  function setBadge(text, color){
    badge.textContent = text;
    badge.style.background = color;
  }
  function checkStatus(){
    fetch('/__status', { cache: 'no-store' })
      .then(function(response){ return response.json(); })
      .then(function(status){
        if (status.error) {
          setBadge('build failed', '#dc2626');
          badge.title = status.error;
          return;
        }
        badge.title = 'Click to reload the latest preview';
        if (status.building) {
          setBadge('building...', '#ca8a04');
          return;
        }
        if (status.version > initialVersion) {
          setBadge('updated - click', '#dc2626');
          return;
        }
        setBadge('watch', '#16a34a');
      })
      .catch(function(){
        setBadge('watch offline', '#6b7280');
      });
  }
  window.setTimeout(checkStatus, 500);
  window.setInterval(checkStatus, 1500);
})();
</script>`;

  return body.includes("</body>")
    ? body.replace("</body>", `${snippet}\n</body>`)
    : `${body}\n${snippet}`;
}

function placeholderHtml(message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>CRF Watch</title></head><body style="font:14px sans-serif;padding:24px"><pre>${escapeHtml(message)}</pre></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function listen(server: http.Server, preferredPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number, attemptsLeft: number) => {
      server.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
          tryPort(port + 1, attemptsLeft - 1);
          return;
        }
        reject(error);
      });
      server.listen(port, "127.0.0.1", () => resolve(port));
    };
    tryPort(preferredPort, 20);
  });
}

function openUrl(url: string): void {
  if (process.platform === "win32") {
    cp.spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    return;
  }

  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  cp.spawn(opener, [url], {
    detached: true,
    stdio: "ignore",
  }).unref();
}

function removeFlag(args: string[], flag: string): boolean {
  const index = args.indexOf(flag);
  if (index < 0) return false;
  args.splice(index, 1);
  return true;
}

function popOption(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  args.splice(index, 2);
  return value;
}
