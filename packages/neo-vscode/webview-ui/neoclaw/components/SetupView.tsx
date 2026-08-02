// NeoClaw setup view — shown when no instance is provisioned

import { Button } from "@neocode/neo-ui/button"
import { Card, CardTitle, CardDescription, CardActions } from "@neocode/neo-ui/card"
import { useClaw } from "../context/claw"
import { useNeoClawLanguage } from "../context/language"

export function SetupView() {
  const claw = useClaw()
  const { t } = useNeoClawLanguage()

  return (
    <div class="neoclaw-center">
      <Card class="neoclaw-card">
        <CardTitle icon={false}>{t("neoClaw.setup.title")}</CardTitle>
        <CardDescription>
          <h3 class="neoclaw-card-subtitle">{t("neoClaw.setup.subtitle")}</h3>
          <p class="neoclaw-card-text">{t("neoClaw.setup.description1")}</p>
          <p class="neoclaw-card-text">{t("neoClaw.setup.description2")}</p>
        </CardDescription>
        <CardActions>
          <Button variant="ghost" onClick={() => claw.openExternal("https://neo.khulnasoft.com/neoclaw")}>
            {t("neoClaw.setup.learnMore")}
          </Button>
          <Button variant="primary" onClick={() => claw.openExternal("https://app.neo.khulnasoft.com/claw")}>
            {t("neoClaw.setup.tryNeoClaw")}
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}
