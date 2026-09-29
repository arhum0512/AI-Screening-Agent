import { spawnSync } from "node:child_process";

for (const file of [
  "tests/customQueryResults.test.js",
  "tests/researchSources.test.js"
]) {
  const result = spawnSync(process.execPath, [file], { stdio: "inherit" });

  if (result.status !== 0) {
    process.exitCode = 1;
    break;
  }
}