import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CustomQuerySummary } from "../src/CustomQuerySummary.js";

const markup = renderToStaticMarkup(
  React.createElement(CustomQuerySummary, {
    summary: {
      companiesProcessed: 1,
      questionsAnswered: 2,
      score: { value: 10, max: 10 },
    },
  })
);

const noScoreMarkup = renderToStaticMarkup(
  React.createElement(CustomQuerySummary, {
    summary: {
      companiesProcessed: 1,
      questionsAnswered: 2,
      score: null,
    },
  })
);

assert.match(markup, /Custom screening completed successfully/);
assert.match(markup, /Companies processed/);
assert.match(markup, /Questions answered/);
assert.match(markup, /10 \/ 10/);
assert.doesNotMatch(markup, /Does the company provide services/);
assert.doesNotMatch(markup, /evidence_description/);
assert.doesNotMatch(markup, /https:\/\//);
assert.doesNotMatch(noScoreMarkup, />Score</);

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(testDirectory, "../src/App.jsx"), "utf8");

assert.match(appSource, /Download Results/);
assert.match(appSource, /Download Evidence/);
assert.match(appSource, /\/api\/download\/custom-results/);
assert.match(appSource, /\/api\/download\/custom-evidence/);
assert.match(appSource, /screened-companies\.csv/);
assert.match(appSource, /failed-companies\.csv/);
assert.match(appSource, /screeningResult\.files\?\.failed/);
assert.match(
  appSource,
  /screeningResult\.mode === "custom_query" && screeningResult\.success/
);

console.log("Custom query summary tests passed.");
