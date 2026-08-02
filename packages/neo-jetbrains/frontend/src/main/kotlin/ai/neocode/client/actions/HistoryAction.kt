package ai.neocode.client.actions

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.session.SessionManager
import ai.neocode.client.telemetry.Telemetry
import com.intellij.icons.AllIcons
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.DumbAware

class HistoryAction : AnAction(
    NeoBundle.message("action.Neo.History.text"),
    NeoBundle.message("action.Neo.History.description"),
    AllIcons.Vcs.History,
), DumbAware {
    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("History Opened", mapOf("surface" to "tool_window"))
        e.getData(SessionManager.KEY)?.showHistory()
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.getData(SessionManager.KEY) != null
    }
}
