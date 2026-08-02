package ai.neocode.client.actions

import ai.neocode.client.session.SessionManager
import com.intellij.openapi.actionSystem.AnActionEvent

internal fun AnActionEvent.workspaceDirectory(): String? {
    return getData(SessionManager.WORKSPACE_KEY)?.directory ?: project?.basePath
}
