import assert from "node:assert";
import fs from "node:fs";

const source = fs.readFileSync("src/App.jsx", "utf8");
const modalSource = fs.readFileSync("src/components/ConfirmModal.jsx", "utf8");

assert.match(source, /fetch\(`\$\{API_BASE_URL\}\/api\/research-sources`\)/);
assert.match(source, /type="checkbox"/);
assert.match(source, /JSON\.stringify\(selectedSourceIds\)/);
assert.match(source, /method: "DELETE"/);
assert.match(source, /method: "POST"/);
assert.match(source, /setSourcePendingDeletion\(source\)/);
assert.match(source, /title="Remove Platform\?"/);
assert.match(source, /sourcePendingDeletion\?\.name/);
assert.match(source, /onConfirm=\{confirmDeleteResearchSource\}/);
assert.match(source, /Please select at least one research source\./);
assert.match(source, /data\.sources \|\| \[\]/);
assert.doesNotMatch(source, /window\.confirm|\bconfirm\s*\(/);
assert.doesNotMatch(source, /Platform Type|Domain-restricted web|X search/);
assert.doesNotMatch(source, /newSource\.type/);
assert.match(modalSource, /role="dialog"/);
assert.match(modalSource, /event\.key === "Escape"/);
assert.match(modalSource, /event\.target === event\.currentTarget/);
assert.match(modalSource, /Cancel/);
assert.doesNotMatch(
  source,
  /const\s+researchSources\s*=\s*\[/,
  "Research source options must not be hardcoded in the frontend."
);

console.log("PASS: Research sources are API-driven, multi-selectable, addable, deletable, and required.");
