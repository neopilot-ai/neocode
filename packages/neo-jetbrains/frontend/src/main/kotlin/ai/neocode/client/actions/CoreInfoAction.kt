package ai.neocode.client.actions

import ai.neocode.client.app.NeoAppService
import ai.neocode.client.plugin.NeoBundle
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware

class CoreInfoAction : AnAction(), DumbAware {
    override fun actionPerformed(e: AnActionEvent) = Unit

    override fun update(e: AnActionEvent) {
        val app = service<NeoAppService>()
        val info = app.core
        if (info == null) app.fetchCoreInfoAsync()
        e.presentation.text = info?.let {
            NeoBundle.message("action.Neo.CoreInfo.text", it.version, it.platform)
        } ?: NeoBundle.message("action.Neo.CoreInfo.loading")
        e.presentation.description = NeoBundle.message("action.Neo.CoreInfo.description")
        e.presentation.isEnabled = false
        e.presentation.isVisible = true
    }

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT
}
