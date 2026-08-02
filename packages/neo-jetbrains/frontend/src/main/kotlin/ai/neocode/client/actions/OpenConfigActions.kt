package ai.neocode.client.actions

import ai.neocode.client.NeoNotifications
import ai.neocode.client.app.NeoWorkspaceService
import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.telemetry.Telemetry
import ai.neocode.rpc.dto.ConfigTargetDto
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware

abstract class ConfigAction(
    private val open: String,
    private val create: String,
    text: String,
    description: String,
) : AnAction(text, description, null), DumbAware {
    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT

    protected fun text(target: ConfigTargetDto?): String {
        val key = if (target?.exists == false) create else open
        return NeoBundle.message(key, target?.displayPath ?: "...")
    }

    protected fun failed() {
        NeoNotifications.error(NeoBundle.message("action.Neo.OpenConfig.failed"))
    }
}

class OpenLocalConfigAction : ConfigAction(
    open = "action.Neo.OpenLocalConfig.text",
    create = "action.Neo.CreateLocalConfig.text",
    text = NeoBundle.message("action.Neo.OpenLocalConfig.text", "..."),
    description = NeoBundle.message("action.Neo.OpenLocalConfig.description"),
) {
    override fun update(e: AnActionEvent) {
        val dir = e.workspaceDirectory()
        val service = service<NeoWorkspaceService>()
        val target = dir?.let { service.localConfig[it] }
        e.presentation.isEnabled = dir != null
        e.presentation.text = text(target)

        if (dir != null && target == null) {
            service.refreshLocalConfigTarget(dir)
        }
    }

    override fun actionPerformed(e: AnActionEvent) {
        val dir = e.workspaceDirectory() ?: return
        Telemetry.send("Config Opened", mapOf("surface" to "tool_window", "scope" to "local"))
        service<NeoWorkspaceService>().openLocalConfig(dir) { ok ->
            if (!ok) failed()
        }
    }
}

class OpenGlobalConfigAction : ConfigAction(
    open = "action.Neo.OpenGlobalConfig.text",
    create = "action.Neo.CreateGlobalConfig.text",
    text = NeoBundle.message("action.Neo.OpenGlobalConfig.text", "..."),
    description = NeoBundle.message("action.Neo.OpenGlobalConfig.description"),
) {
    override fun update(e: AnActionEvent) {
        val service = service<NeoWorkspaceService>()
        val target = service.globalConfig
        e.presentation.text = text(target)

        if (target == null) {
            service.refreshGlobalConfigTarget()
        }
    }

    override fun actionPerformed(e: AnActionEvent) {
        Telemetry.send("Config Opened", mapOf("surface" to "tool_window", "scope" to "global"))
        service<NeoWorkspaceService>().openGlobalConfig { ok ->
            if (!ok) failed()
        }
    }
}
