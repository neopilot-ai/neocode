// neocode_change - new file
import { test, expect } from "bun:test"
import path from "path"

test("bin/neo parses", async () => {
  const file = Bun.file(path.join(import.meta.dir, "..", "..", "bin", "neo"))
  const code = (await file.text()).replace(/^#![^\n]*\n/, "")
  expect(() => new Function(code)).not.toThrow()
})
