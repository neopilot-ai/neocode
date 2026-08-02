// neocode_change - new file
import { expect, test } from "bun:test"
import { cliCommand } from "../../src/cli/cmd/pr"

test("cliCommand uses the current script when argv[1] is a file path", () => {
  const result = cliCommand({
    execPath: "/usr/bin/node",
    argv: ["/usr/bin/node", "/tmp/neo.js", "pr", "1"],
    exists: (file) => file === "/tmp/neo.js",
  })

  expect(result).toEqual(["/usr/bin/node", "/tmp/neo.js"])
})

test("cliCommand falls back to execPath when argv[1] is a subcommand", () => {
  const result = cliCommand({
    execPath: "/usr/local/bin/neo",
    argv: ["/usr/local/bin/neo", "pr", "1"],
    exists: () => false,
  })

  expect(result).toEqual(["/usr/local/bin/neo"])
})

test("cliCommand ignores subcommand token even when it exists on disk", () => {
  const result = cliCommand({
    execPath: "/usr/local/bin/neo",
    argv: ["/usr/local/bin/neo", "pr", "1"],
    exists: (file) => file === "pr",
  })

  expect(result).toEqual(["/usr/local/bin/neo"])
})

test("cliCommand falls back to execPath when argv[1] is missing", () => {
  const result = cliCommand({
    execPath: "/usr/local/bin/neo",
    argv: ["/usr/local/bin/neo"],
    exists: () => false,
  })

  expect(result).toEqual(["/usr/local/bin/neo"])
})

test("cliCommand falls back to execPath for bun virtual script paths", () => {
  const unix = cliCommand({
    execPath: "/tmp/neo",
    argv: ["/tmp/neo", "/$bunfs/root/src/index.js", "pr", "1"],
    exists: () => true,
  })

  const win = cliCommand({
    execPath: "C:/tmp/neo.exe",
    argv: ["C:/tmp/neo.exe", "B:/~BUN/root/src/index.js", "pr", "1"],
    exists: () => true,
  })

  expect(unix).toEqual(["/tmp/neo"])
  expect(win).toEqual(["C:/tmp/neo.exe"])
})
