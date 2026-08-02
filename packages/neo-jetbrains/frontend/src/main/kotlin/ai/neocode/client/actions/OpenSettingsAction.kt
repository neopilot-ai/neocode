package ai.neocode.client.actions

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.settings.NeoSettingsConfigurable
import ai.neocode.client.settings.NeoSettingsSelection
import ai.neocode.client.telemetry.Telemetry
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.options.Configurable
import com.intellij.openapi.options.ConfigurableWithId
import com.intellij.openapi.options.ShowSettingsUtil
import com.intellij.openapi.project.DumbAwareAction
import com.intellij.openapi.project.ProjectManager
import java.util.function.Predicate

class OpenSettingsAction : DumbAwareAction(
    NeoBundle.message("action.Neo.OpenSettings.text"),
    NeoBundle.message("action.Neo.OpenSettings.description"),
    null,
) {
    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("Settings Opened", mapOf("surface" to "tool_window"))
        val project = e.project ?: ProjectManager.getInstance().defaultProject
        val target = NeoSettingsSelection.target(project)
        val util = ShowSettingsUtil.getInstance()
        try {
            util.showSettingsDialog(project, predicate(target), null)
        } catch (err: IllegalStateException) {
            if (target == NeoSettingsConfigurable.ID) throw err
            util.showSettingsDialog(project, predicate(NeoSettingsConfigurable.ID), null)
        }
    }

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT

    private fun predicate(id: String) = Predicate { cfg: Configurable ->
        cfg is ConfigurableWithId && cfg.getId() == id
    }
}
