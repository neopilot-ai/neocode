import { createMemo, Match, Switch, type JSX } from "solid-js"
import { SplitBorder } from "@tui/ui/border"
import { useTheme } from "@tui/context/theme"
import { parseNeoErrorCode, neoErrorTitle, neoErrorDescription } from "@/neocode/neo-errors"
import type { AssistantMessage } from "@neocode/sdk/v2"

interface NeoErrorBlockProps {
  error: NonNullable<AssistantMessage["error"]>
  fallback: JSX.Element
}

export function NeoErrorBlock(props: NeoErrorBlockProps) {
  const { theme } = useTheme()

  const neoErrorCode = createMemo(() => {
    return parseNeoErrorCode(props.error)
  })

  const title = createMemo(() => {
    const code = neoErrorCode()
    return code ? neoErrorTitle(code) : undefined
  })

  const description = createMemo(() => {
    const code = neoErrorCode()
    return code ? neoErrorDescription(code) : undefined
  })

  return (
    <Switch fallback={props.fallback}>
      <Match when={neoErrorCode()}>
        <box
          border={["left"]}
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          marginTop={1}
          backgroundColor={theme.backgroundPanel}
          customBorderChars={SplitBorder.customBorderChars}
          borderColor={theme.primary}
        >
          <text fg={theme.text}>{title()}</text>
          <text fg={theme.textMuted}>{description()}</text>
          <text fg={theme.primary}>{"Run /connect or `neo auth login` to connect to Neo Gateway"}</text>
        </box>
      </Match>
    </Switch>
  )
}
