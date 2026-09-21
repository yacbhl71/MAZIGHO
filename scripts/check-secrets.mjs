import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = process.cwd();
const trackedFiles = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "buffer" })
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter(file => !file.startsWith("node_modules/") && !file.startsWith("dist/") && !file.startsWith("server-dist/"));

const credentialPatterns = [
  ["Stripe secret key", /\bsk_(?:live|test)_[A-Za-z0-9]{12,}\b/g],
  ["Stripe webhook secret", /\bwhsec_[A-Za-z0-9]{12,}\b/g],
  ["Brevo API key", /\bxkeysib-[A-Za-z0-9-]{24,}\b/g],
  ["GitHub personal token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{12,}\b/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["Private key block", /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/g],
];

const findings = [];
for (const file of trackedFiles) {
  let text;
  try {
    text = readFileSync(`${root}/${file}`, "utf8");
  } catch {
    continue;
  }

  for (const [kind, pattern] of credentialPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      findings.push({
        file,
        line: text.slice(0, match.index).split("\n").length,
        kind,
      });
    }
  }
}

if (findings.length === 0) {
  console.log(`Secret scan passed: ${trackedFiles.length} tracked files checked.`);
  process.exit(0);
}

console.error("Secret scan failed. Rotate exposed credentials and remove them from the tracked file.");
for (const finding of findings) {
  // Do not print the matched value: CI logs must not reproduce a secret.
  console.error(`- ${finding.file}:${finding.line} (${finding.kind})`);
}
process.exit(1);
