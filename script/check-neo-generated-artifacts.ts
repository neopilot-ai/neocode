#!/usr/bin/env bun
// neocode_change - new file

/**
 * Guards generated Neo config dependency artifacts.
 *
 * Neo loads project config from .neo/ and .neocode/ and installs
 * @neocode/plugin there at runtime. npm writes package.json, lockfiles,
 * .gitignore, and node_modules as generated local state. These paths must stay
 * untracked so background installs do not create recurring branch diffs.
 */

import { spawnSync } from "node:child_process"

const paths = [
  ".neo/.gitignore",
  ".neo/package.json",
  ".neo/package-lock.json",
  ".neo/pnpm-lock.yaml",
  ".neo/bun.lock",
  ".neo/yarn.lock",
  ".neo/node_modules",
  ".neocode/.gitignore",
  ".neocode/package.json",
  ".neocode/package-lock.json",
  ".neocode/pnpm-lock.yaml",
  ".neocode/bun.lock",
  ".neocode/yarn.lock",
  ".neocode/node_modules",
]

const git = spawnSync("git", ["ls-files", "-z", "--", ...paths], { encoding: "utf8" })

if (git.status !== 0) {
  console.error(git.stderr.trim() || "git ls-files failed")
  process.exit(1)
}

const bad = git.stdout.split("\0").filter(Boolean).sort()

if (bad.length === 0) {
  console.log("check-neo-generated-artifacts: ok")
  process.exit(0)
}

console.error("Generated Neo config dependency artifacts are tracked:")
for (const file of bad) console.error(`  ${file}`)
console.error("")
console.error("These files are created by runtime dependency installs in .neo/ and .neocode/.")
console.error("Remove them from git and keep them ignored.")
process.exit(1)
