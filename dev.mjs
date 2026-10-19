#!/usr/bin/env node
// Starts both Next.js servers concurrently with a single `npm run dev`
// Auto-frees ports 3000 and 3001 before starting.

import { spawn, execSync } from "child_process";

const cyan   = (s) => `\x1b[36m[app]   \x1b[0m${s}`;
const yellow = (s) => `\x1b[33m[luffy] \x1b[0m${s}`;
const gray   = (s) => `\x1b[90m${s}\x1b[0m`;

const isWin = process.platform === "win32";

// Kill any process listening on a given port
function freePort(port) {
  try {
    if (isWin) {
      const out = execSync(
        `netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: ["pipe","pipe","ignore"] }
      );
      const pids = [...new Set(
        out.split("\n")
          .filter(l => l.includes("LISTENING"))
          .map(l => l.trim().split(/\s+/).pop())
          .filter(Boolean)
      )];
      pids.forEach(pid => {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" }); } catch {}
      });
      if (pids.length) console.log(gray(`  freed port ${port} (PID ${pids.join(",")})`));
    }
  } catch {}
}

function run(color, script, cwd) {
  const child = spawn(isWin ? "cmd" : "sh", isWin ? ["/c", script] : ["-c", script], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (d) =>
    d.toString().split("\n").filter(Boolean).forEach((l) => console.log(color(l)))
  );
  child.stderr.on("data", (d) =>
    d.toString().split("\n").filter(Boolean).forEach((l) => console.error(color(l)))
  );
  child.on("exit", (code) => {
    console.log(color(`process exited with code ${code}`));
    process.exit(code ?? 1);
  });
  return child;
}

import { fileURLToPath } from "url";
import path from "path";

// Free ports first
freePort(3000);
freePort(3001);

const root = fileURLToPath(new URL(".", import.meta.url));
const admin = path.join(root, "consent-gen-admin");

function killTree(child) {
  if (!child || !child.pid) return;
  try {
    if (isWin) {
      execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  } catch {}
}

const app   = run(cyan,   "npx next dev",                     root);
const luffy = run(yellow, "npx next dev --webpack -p 3001",   admin);

const cleanup = () => {
  killTree(app);
  killTree(luffy);
  process.exit(0);
};

process.on("SIGINT",  cleanup);
process.on("SIGTERM", cleanup);


