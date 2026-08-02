// NeoClaw root component

import { Switch, Match } from "solid-js"
import { ThemeProvider } from "@neocode/neo-ui/theme"
import { MarkedProvider } from "@neocode/neo-ui/context/marked"
import { Button } from "@neocode/neo-ui/button"
import { Spinner } from "@neocode/neo-ui/spinner"
import { Toast } from "@neocode/neo-ui/toast"
import { ClawProvider, useClaw } from "./context/claw"
import { NeoClawLanguageProvider, useNeoClawLanguage } from "./context/language"
import { ConversationList } from "./components/ConversationList"
import { MessageArea } from "./components/MessageArea"
import { StatusSidebar } from "./components/StatusSidebar"
import { SetupView } from "./components/SetupView"
import { UpgradeView } from "./components/UpgradeView"

function Content() {
  const claw = useClaw()
  const { t } = useNeoClawLanguage()

  return (
    <div class="neoclaw-root">
      <Switch>
        <Match when={claw.phase() === "loading"}>
          <div class="neoclaw-center">
            <div class="neoclaw-loading">
              <Spinner />
              <span>{t("neoClaw.loading")}</span>
            </div>
          </div>
        </Match>
        <Match when={claw.phase() === "noInstance"}>
          <SetupView />
        </Match>
        <Match when={claw.phase() === "needsUpgrade"}>
          <UpgradeView />
        </Match>
        <Match when={claw.phase() === "error"}>
          <div class="neoclaw-center">
            <div class="neoclaw-error-view">
              <span class="neoclaw-error-text">{claw.error()}</span>
              <Button variant="primary" onClick={() => claw.retry()}>
                {t("neoClaw.error.retry")}
              </Button>
            </div>
          </div>
        </Match>
        <Match when={claw.phase() === "ready"}>
          <div class="neoclaw-layout">
            <ConversationList />
            <MessageArea />
            <StatusSidebar />
          </div>
        </Match>
      </Switch>
      <Toast.Region />
    </div>
  )
}

export function NeoClawApp() {
  return (
    <ThemeProvider defaultTheme="neo-vscode">
      <ClawProvider>
        <LanguageBridge>
          <MarkedProvider>
            <Content />
          </MarkedProvider>
        </LanguageBridge>
      </ClawProvider>
    </ThemeProvider>
  )
}

/** Bridges the claw context locale into the language provider. Must be below ClawProvider. */
function LanguageBridge(props: { children: any }) {
  const claw = useClaw()
  return <NeoClawLanguageProvider locale={claw.locale}>{props.children}</NeoClawLanguageProvider>
}
