// NeoClaw upgrade view — shown when instance needs upgrade for chat

import { Button } from "@neocode/neo-ui/button"
import { Card, CardTitle, CardDescription, CardActions } from "@neocode/neo-ui/card"
import { useClaw } from "../context/claw"
import { useNeoClawLanguage } from "../context/language"

export function UpgradeView() {
  const claw = useClaw()
  const { t } = useNeoClawLanguage()

  return (
    <div class="neoclaw-center">
      <Card class="neoclaw-card">
        <CardTitle icon={false}>{t("neoClaw.upgrade.title")}</CardTitle>
        <CardDescription>
          <p class="neoclaw-card-text">{t("neoClaw.upgrade.description1")}</p>
          <p class="neoclaw-card-text">
            {t("neoClaw.upgrade.description2.before")}
            <strong>{t("neoClaw.upgrade.description2.bold")}</strong>
            {t("neoClaw.upgrade.description2.after")}
          </p>
        </CardDescription>
        <CardActions>
          <div />
          <Button variant="primary" onClick={() => claw.openExternal("https://app.neo.khulnasoft.com/claw")}>
            {t("neoClaw.upgrade.openDashboard")}
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}
