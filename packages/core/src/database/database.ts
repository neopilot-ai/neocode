export * as Database from "./database"

import { EffectDrizzleSqlite } from "@opencode-ai/effect-drizzle-sqlite"
import { layer as sqliteLayer } from "#sqlite"
import { Context, Effect, Layer } from "effect"
import { Global } from "../global"
import { Flag } from "../flag/flag"
import { isAbsolute, join } from "path"
import { existsSync } from "fs" // neocode_change
import { DatabaseMigration } from "./migration"
import { InstallationChannel } from "../installation/version"
import { LayerNode } from "../effect/layer-node"

const makeDatabase = EffectDrizzleSqlite.makeWithDefaults()
type DatabaseShape = Effect.Success<typeof makeDatabase>

export interface Interface {
  db: DatabaseShape
}

export class Service extends Context.Service<Service, Interface>()("@opencode/v2/storage/Database") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const db = yield* makeDatabase

    yield* db.run("PRAGMA journal_mode = WAL")
    yield* db.run("PRAGMA synchronous = NORMAL")
    yield* db.run("PRAGMA busy_timeout = 5000")
    yield* db.run("PRAGMA cache_size = -64000")
    yield* db.run("PRAGMA foreign_keys = ON")
    yield* db.run("PRAGMA wal_checkpoint(PASSIVE)")
    yield* DatabaseMigration.apply(db)

    return { db }
  }).pipe(Effect.orDie),
)

export function layerFromPath(filename: string) {
  return layer.pipe(Layer.provide(sqliteLayer({ filename })))
}

export function path() {
  if (Flag.NEO_DB) {
    if (Flag.NEO_DB === ":memory:" || isAbsolute(Flag.NEO_DB)) return Flag.NEO_DB
    return join(Global.Path.data, Flag.NEO_DB)
  }
  if (
    ["latest", "beta", "prod"].includes(InstallationChannel) ||
    process.env.NEO_DISABLE_CHANNEL_DB === "1" ||
    process.env.NEO_DISABLE_CHANNEL_DB === "true"
  )
    return join(Global.Path.data, "neo.db")
  // neocode_change start - neo-branded dev-channel db name, falling back to a pre-existing opencode-named db
  const safe = InstallationChannel.replace(/[^a-zA-Z0-9._-]/g, "-")
  const next = join(Global.Path.data, `neo-${safe}.db`)
  const prev = join(Global.Path.data, `opencode-${safe}.db`)
  if (!existsSync(next) && existsSync(prev)) return prev
  return next
  // neocode_change end
}

export const defaultLayer = Layer.unwrap(
  Effect.gen(function* () {
    return layerFromPath(path())
  }),
).pipe(Layer.provide(Global.defaultLayer))

export const node = LayerNode.make(layerFromPath(path()), [])
