import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const demoData = read("lib/demo-data.ts");
const appShell = read("components/app-shell.tsx");
const demoPreview = read("components/demo-preview.tsx");
const judgeCopy = `${demoData}\n${appShell}\n${demoPreview}`;

const requiredPhrases = [
  "Most hackathons stop at ranking. Veil Scout turns ranking into continuous builder discovery and milestone-based incubation.",
  "大多数黑客松止步于排名。Veil Scout 把排名转化为持续的 builder 发现与里程碑孵化。",
  "Implemented",
  "Demo-grade",
  "Roadmap",
  "Trusted P0 oracle",
  "Sponsor units",
  'title: "Discover"',
  'title: "Compare"',
  'title: "Verify"',
  'title: "Settle"',
  'title: "Incubate"',
  'title: "Release"',
  'title: "发现"',
  'title: "比较"',
  'title: "验证"',
  'title: "结算"',
  'title: "孵化"',
  'title: "释放"',
];

for (const phrase of requiredPhrases) {
  assert.ok(judgeCopy.includes(phrase), `Missing judge-facing phrase: ${phrase}`);
}

assert.ok(!appShell.includes("HTX Demo Net"), "Default network copy must not imply an HTX network integration");
assert.ok(!/>\s*live\s*</i.test(appShell), "Route health badge must describe the actual data source, not generic live status");

console.log("Judge-facing copy checks passed.");
