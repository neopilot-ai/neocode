package ai.neocode.client.actions

import ai.neocode.client.NeoNotifications
import ai.neocode.client.migration.NeoMigrationService
import ai.neocode.client.plugin.NeoBundle
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages

class ForceMigrationAction : AnAction(
    NeoBundle.message("action.Neo.ForceMigration.text"),
    NeoBundle.message("action.Neo.ForceMigration.description"),
    null,
), DumbAware {
    internal var confirm: (Project?) -> Boolean = { project ->
        Messages.showYesNoDialog(
            project,
            NeoBundle.message("action.Neo.ForceMigration.confirm.message"),
            NeoBundle.message("action.Neo.ForceMigration.confirm.title"),
            Messages.getWarningIcon(),
        ) == Messages.YES
    }

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.EDT

    override fun actionPerformed(e: AnActionEvent) {
        if (!confirm(e.project)) return
        service<NeoMigrationService>().resetStatusAndRestart { ok ->
            if (ok) return@resetStatusAndRestart
            NeoNotifications.error(NeoBundle.message("action.Neo.ForceMigration.failed"))
        }
    }
}
