import type { Message, Session, Part, SnapshotFileDiff, SessionStatus, Provider } from "@neocode/sdk/v2"
import { createSimpleContext } from "./helper"
import { PreloadMultiFileDiffResult } from "@pierre/diffs/ssr"

export type NormalizedProviderListResponse = {
  all: Map<string, Provider>
  default: {
    [key: string]: string
  }
  connected: Array<string>
}

type Data = {
  agent?: {
    name: string
    color?: string
  }[]
  provider?: NormalizedProviderListResponse
  session: Session[]
  session_status: {
    [sessionID: string]: SessionStatus
  }
  session_diff: {
    [sessionID: string]: SnapshotFileDiff[]
  }
  session_diff_preload?: {
    [sessionID: string]: PreloadMultiFileDiffResult<any>[]
  }
  message: {
    [sessionID: string]: Message[]
  }
  part: {
    [messageID: string]: Part[]
  }
  part_text_accum_delta?: {
    [partID: string]: string
  }
}

export type NavigateToSessionFn = (sessionID: string) => void

export type SessionHrefFn = (sessionID: string) => string

// neocode_change start
export type OpenFileFn = (filePath: string, line?: number, column?: number) => void

export type OpenDiffFn = (diff: {
  file: string
  before?: string // neocode_change - optional, neo uses `patch`
  after?: string // neocode_change - optional, neo uses `patch`
  patch?: string // neocode_change
  additions: number
  deletions: number
}) => void

export type OpenUrlFn = (url: string) => void

export type OpenContentFn = (content: string, language?: string) => void // neocode_change

export type ValidateFilesFn = (paths: string[]) => Promise<string[]> // neocode_change
// neocode_change end

export const { use: useData, provider: DataProvider } = createSimpleContext({
  name: "Data",
  init: (props: {
    data: Data
    directory: string
    onNavigateToSession?: NavigateToSessionFn
    onSessionHref?: SessionHrefFn
    onOpenFile?: OpenFileFn // neocode_change
    onOpenDiff?: OpenDiffFn // neocode_change
    onOpenUrl?: OpenUrlFn // neocode_change
    onOpenContent?: OpenContentFn // neocode_change
    onValidateFiles?: ValidateFilesFn // neocode_change
  }) => {
    return {
      get store() {
        return props.data
      },
      get directory() {
        return props.directory
      },
      navigateToSession: props.onNavigateToSession,
      sessionHref: props.onSessionHref,
      openFile: props.onOpenFile, // neocode_change
      openDiff: props.onOpenDiff, // neocode_change
      openUrl: props.onOpenUrl, // neocode_change
      openContent: props.onOpenContent, // neocode_change
      validateFiles: props.onValidateFiles, // neocode_change
    }
  },
})
