import { Component, JSX } from "solid-js"
import { Dialog } from "@neocode/neo-ui/dialog"
import { Button } from "@neocode/neo-ui/button"
import { Icon } from "@neocode/neo-ui/icon"
import { useDialog } from "@neocode/neo-ui/context/dialog"
import { useVSCode } from "../../context/vscode"
import { useLanguage } from "../../context/language"

const GITHUB_ISSUES_URL = "https://github.com/Neopilot-Ai/neocode/issues/new/choose"
const DISCORD_URL = "https://neo.khulnasoft.com/discord"
const SUPPORT_URL = "https://neo.khulnasoft.com/support"

const NeoLogo = (): JSX.Element => {
  const iconsBaseUri = (window as { ICONS_BASE_URI?: string }).ICONS_BASE_URI || ""
  const isLight =
    document.body.classList.contains("vscode-light") || document.body.classList.contains("vscode-high-contrast-light")
  const iconFile = isLight ? "neo-light.svg" : "neo-dark.svg"

  return (
    <div class="feedback-dialog-logo">
      <img src={`${iconsBaseUri}/${iconFile}`} alt="Neo Code" />
    </div>
  )
}

export const FeedbackDialog: Component = () => {
  const language = useLanguage()
  const dialog = useDialog()
  const vscode = useVSCode()

  const open = (url: string) => {
    vscode.postMessage({ type: "openExternal", url })
    dialog.close()
  }

  return (
    <Dialog title="" fit>
      <div class="feedback-dialog">
        <NeoLogo />
        <p class="feedback-dialog-message">{language.t("feedback.dialog.message")}</p>
        <div class="feedback-dialog-actions">
          <Button variant="primary" size="large" data-full-width="true" onClick={() => open(GITHUB_ISSUES_URL)}>
            <Icon name="github" size="small" />
            {language.t("feedback.dialog.github")}
          </Button>
          <Button variant="secondary" size="large" data-full-width="true" onClick={() => open(DISCORD_URL)}>
            <Icon name="discord" size="small" />
            {language.t("feedback.dialog.discord")}
          </Button>
          <Button variant="secondary" size="large" data-full-width="true" onClick={() => open(SUPPORT_URL)}>
            <Icon name="help" size="small" />
            {language.t("feedback.dialog.support")}
          </Button>
        </div>
        <Button variant="ghost" size="small" onClick={() => dialog.close()}>
          {language.t("common.cancel")}
        </Button>
      </div>
    </Dialog>
  )
}
