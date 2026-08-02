package ai.neocode.client.actions

import ai.neocode.client.app.NeoAppService
import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.telemetry.Telemetry
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware

class RestartNeoAction : AnAction(), DumbAware {
    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("CLI Restart Clicked", mapOf("surface" to "settings"))
        service<NeoAppService>().restartAsync()
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = true
        if (e.place == NeoActionPlaces.connectionRetryPopup()) {
            e.presentation.text = NeoBundle.message("action.Neo.Restart.cli.text")
        }
    }
}
