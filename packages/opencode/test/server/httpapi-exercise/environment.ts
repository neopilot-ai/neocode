import { Flag } from "@opencode-ai/core/flag/flag"
import { Effect } from "effect"
import path from "path"

const preserveExerciseGlobalRoot = !!process.env.NEO_HTTPAPI_EXERCISE_GLOBAL
export const exerciseGlobalRoot =
  process.env.NEO_HTTPAPI_EXERCISE_GLOBAL ??
  path.join(process.env.TMPDIR ?? "/tmp", `opencode-httpapi-global-${process.pid}`)
process.env.XDG_DATA_HOME = path.join(exerciseGlobalRoot, "data")
process.env.XDG_CONFIG_HOME = path.join(exerciseGlobalRoot, "config")
process.env.XDG_STATE_HOME = path.join(exerciseGlobalRoot, "state")
process.env.XDG_CACHE_HOME = path.join(exerciseGlobalRoot, "cache")
process.env.NEO_DISABLE_SHARE = "true"
process.env.NEO_DISABLE_SESSION_INGEST = "true" // neocode_change - isolate the exerciser from async Neo session sync
process.env.NEO_DISABLE_PRESENCE = "1" // neocode_change - presence now has a default Event Service URL; never open real sockets from the exerciser
export const exerciseConfigDirectory = path.join(exerciseGlobalRoot, "config", "opencode")
export const exerciseDataDirectory = path.join(exerciseGlobalRoot, "data", "neo") // neocode_change

const preserveExerciseDatabase = !!process.env.NEO_HTTPAPI_EXERCISE_DB
export const exerciseDatabasePath =
  process.env.NEO_HTTPAPI_EXERCISE_DB ??
  path.join(process.env.TMPDIR ?? "/tmp", `opencode-httpapi-exercise-${process.pid}.db`)
process.env.NEO_DB = exerciseDatabasePath
Flag.NEO_DB = exerciseDatabasePath

export const original = {
  NEO_SERVER_PASSWORD: Flag.NEO_SERVER_PASSWORD,
  NEO_SERVER_USERNAME: Flag.NEO_SERVER_USERNAME,
}

export const cleanupExercisePaths = Effect.promise(async () => {
  const fs = await import("fs/promises")
  if (!preserveExerciseDatabase) {
    await Promise.all(
      [exerciseDatabasePath, `${exerciseDatabasePath}-wal`, `${exerciseDatabasePath}-shm`].map((file) =>
        fs.rm(file, { force: true }).catch(() => undefined),
      ),
    )
  }
  if (!preserveExerciseGlobalRoot)
    await fs.rm(exerciseGlobalRoot, { recursive: true, force: true }).catch(() => undefined)
})
