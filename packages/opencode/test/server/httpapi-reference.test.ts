import { afterEach, describe, expect, test } from "bun:test"
import path from "path"
import { Server } from "../../src/server/server"
import { Global } from "@opencode-ai/core/global"
import { resetDatabase } from "../fixture/db"
import { disposeAllInstances, tmpdir } from "../fixture/fixture"

afterEach(async () => {
  await disposeAllInstances()
  await resetDatabase()
})

describe("reference HttpApi", () => {
  test("lists usable references resolved in the server workspace", async () => {
    await using tmp = await tmpdir({
      config: {
        formatter: false,
        lsp: false,
        references: {
          docs: "./docs",
          effect: { repository: "Effect-TS/effect", branch: "main" },
          bad: "not-a-repo",
        },
      },
    })

    const response = await Server.Default().app.request("/api/reference", {
      headers: { "x-neo-directory": tmp.path },
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({ location: { directory: tmp.path } })
    expect(body.data).toEqual([
      {
        name: "docs",
        path: path.join(tmp.path, "docs"),
        description: null,
        hidden: null,
        source: {
          type: "local",
          path: path.join(tmp.path, "docs"),
          description: null,
          hidden: null,
        },
      },
      {
        name: "effect",
        path: path.join(Global.Path.repos, "github.com", "Effect-TS", "effect"),
        description: null,
        hidden: null,
        source: {
          type: "git",
          repository: "Effect-TS/effect",
          branch: "main",
          description: null,
          hidden: null,
        },
      },
    ])
  })

  // neocode_change start - reference reads must reconcile config changes after instance disposal.
  test("refreshes references after project config updates", async () => {
    await using tmp = await tmpdir({
      config: {
        formatter: false,
        lsp: false,
        references: { docs: "./docs" },
      },
    })
    const headers = { "content-type": "application/json", "x-neo-directory": tmp.path }

    const initial = await Server.Default().app.request("/api/reference", { headers })
    expect(initial.status).toBe(200)
    expect((await initial.json()).data[0].path).toBe(path.join(tmp.path, "docs"))

    const updated = await Server.Default().app.request("/config", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        formatter: false,
        lsp: false,
        references: { docs: { path: "./updated", description: "Updated documentation" } },
      }),
    })
    expect(updated.status).toBe(200)

    const refreshed = await Server.Default().app.request("/api/reference", { headers })
    expect(refreshed.status).toBe(200)
    expect((await refreshed.json()).data[0]).toMatchObject({
      name: "docs",
      path: path.join(tmp.path, "updated"),
      description: "Updated documentation",
    })
  })
  // neocode_change end

  // neocode_change start - direct clients must observe effective Neo config before Agent initialization.
  test("lists NEO_CONFIG_CONTENT references with metadata on the first request", async () => {
    const previous = process.env.NEO_CONFIG_CONTENT
    process.env.NEO_CONFIG_CONTENT = JSON.stringify({
      references: {
        private: {
          path: "./private-docs",
          description: "Private documentation",
          hidden: true,
        },
      },
    })

    try {
      await using tmp = await tmpdir({ config: { formatter: false, lsp: false } })
      const response = await Server.Default().app.request("/api/reference", {
        headers: { "x-neo-directory": tmp.path },
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toEqual([
        {
          name: "private",
          path: path.join(tmp.path, "private-docs"),
          description: "Private documentation",
          hidden: true,
          source: {
            type: "local",
            path: path.join(tmp.path, "private-docs"),
            description: "Private documentation",
            hidden: true,
          },
        },
      ])
    } finally {
      if (previous === undefined) delete process.env.NEO_CONFIG_CONTENT
      else process.env.NEO_CONFIG_CONTENT = previous
    }
  })
  // neocode_change end
})
