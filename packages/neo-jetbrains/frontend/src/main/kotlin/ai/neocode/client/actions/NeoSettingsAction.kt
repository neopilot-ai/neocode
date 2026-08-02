package ai.neocode.client.actions

import ai.neocode.client.app.NeoWorkspaceService
import ai.neocode.client.telemetry.Telemetry
import com.intellij.openapi.actionSystem.ActionGroup
import com.intellij.openapi.actionSystem.ActionGroupUtil
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.ui.popup.JBPopupFactory
import kotlinx.coroutines.Job

/**
 * Gear icon action placed in the Neo tool window title bar.
 *
 * Looks up [Neo.SettingsGroup] from [ActionManager] and shows it
 * as a popup. The group composition is declared in
 * `neo.jetbrains.frontend.xml`.
 */
class NeoSettingsAction : AnAction() {

    companion object {
        const val GROUP_ID = "Neo.SettingsGroup"

        internal fun popupGroup(group: ActionGroup): ActionGroup {
            return ActionGroupUtil.forceRecursiveUpdateInBackground(group)
        }

        internal fun refreshConfigTargets(e: AnActionEvent, service: NeoWorkspaceService): List<Job> {
            return listOfNotNull(
                e.workspaceDirectory()?.let { service.refreshLocalConfigTarget(it) },
                service.refreshGlobalConfigTarget(),
            )
        }
    }

    override fun actionPerformed(e: AnActionEvent) {
        val component = e.inputEvent?.component ?: return
        val group = ActionManager.getInstance().getAction(GROUP_ID) as? ActionGroup ?: return
        val service = service<NeoWorkspaceService>()
        refreshConfigTargets(e, service)
        Telemetry.send("Settings Opened", mapOf("surface" to "tool_window"))

        JBPopupFactory.getInstance()
            .createActionGroupPopup(
                null,
                popupGroup(group),
                e.dataContext,
                JBPopupFactory.ActionSelectionAid.SPEEDSEARCH,
                true,
            )
            .showUnderneathOf(component)
    }

}
