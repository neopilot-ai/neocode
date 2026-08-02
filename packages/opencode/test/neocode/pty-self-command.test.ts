import { describe, expect, test } from "bun:test"
import { NeoPtySelfCommand } from "../../src/neocode/pty/self-command"

describe("pty self-command", () => {
  test("does not forward bundled bun entrypoints", () => {
    const proc = {
      argv: ["/tmp/neo", "/$bunfs/root/src/index.js"],
      execArgv: ["--user-agent=neo/test", "--use-system-ca", "--"],
      execPath: "/tmp/neo",
      cwd: "/tmp",
    }

    const cmd = NeoPtySelfCommand.command(proc)
    expect(cmd).toStrictEqual({ command: "/tmp/neo", args: [] })
    expect(NeoPtySelfCommand.resolve({ command: "neo", cwd: "/tmp/project" }, cmd)).toStrictEqual({
      command: "/tmp/neo",
      args: [],
      cwd: "/tmp/project",
    })
    expect(
      NeoPtySelfCommand.command({
        ...proc,
        argv: ["C:/tmp/neo.exe", "B:/~BUN/root/src/index.js"],
      }).args,
    ).toStrictEqual([])
    expect(
      NeoPtySelfCommand.command({
        ...proc,
        argv: ["C:/tmp/neo.exe", "b:\\~BUN\\root\\src\\index.js"],
      }).args,
    ).toStrictEqual([])
  })

  test("forwards source entrypoints", () => {
    const cmd = NeoPtySelfCommand.command({
      argv: ["/tmp/bun", "/tmp/neo/src/index.ts"],
      execArgv: ["--conditions=browser", "--cwd", "packages/opencode"],
      execPath: "/tmp/bun",
      cwd: "/tmp/neo",
    })
    expect(cmd).toStrictEqual({
      command: "/tmp/bun",
      args: ["--conditions=browser", "/tmp/neo/src/index.ts"],
      cwd: "/tmp/neo",
    })
    expect(NeoPtySelfCommand.resolve({ command: "neo", cwd: "/tmp/project" }, cmd)).toStrictEqual({
      command: "/tmp/bun",
      args: ["--conditions=browser", "/tmp/neo/src/index.ts", "/tmp/project"],
      cwd: "/tmp/neo",
    })
  })
})
