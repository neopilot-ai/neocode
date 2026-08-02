package ai.neocode.client

import ai.neocode.client.app.NeoWorkspaceService
import ai.neocode.client.app.Workspace
import ai.neocode.client.session.SessionSidePanelManager
import ai.neocode.client.telemetry.Telemetry
import ai.neocode.log.NeoLog
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.platform.project.projectIdOrNull
import com.intellij.ui.content.ContentFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Creates the Neo Code tool window and delegates session content management.
 *
 * Resolves the project directory through the backend (handles split-mode
 * where `project.basePath` is a synthetic frontend path) before creating
 * the workspace. The tool window shows a loading state until resolution
 * completes.
 */
class NeoToolWindowFactory : ToolWindowFactory, DumbAware {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        project.service<NeoToolWindowSetupService>().create(toolWindow)
    }
}

private val LOG = NeoLog.create(NeoToolWindowFactory::class.java)

@Service(Service.Level.PROJECT)
internal class NeoToolWindowSetupService(
    private val project: Project,
    private val cs: CoroutineScope,
) {
    fun create(toolWindow: ToolWindow) {
        val start = System.currentTimeMillis()
        try {
            val workspaces = service<NeoWorkspaceService>()
            val hint = project.basePath ?: ""
            // Experimental IntelliJ ProjectId API keeps multi-window and split-mode routing exact.
            val pid = project.projectIdOrNull()

            cs.launch {
                val dir = workspaces.resolveProjectDirectory(pid, hint)
                val workspace = workspaces.workspace(dir)
                withContext(Dispatchers.Main) {
                    setup(project, toolWindow, workspace)
                }
                Telemetry.send("Tool Window Opened", mapOf(
                    "projectResolved" to dir.isNotBlank().toString(),
                    "durationMs" to (System.currentTimeMillis() - start).toString(),
                ))
            }
        } catch (e: Exception) {
            Telemetry.send("Tool Window Setup Failed", mapOf("stage" to "create", "errorClass" to e::class.java.name))
            LOG.error("Failed to create Neo tool window content", e)
        }
    }

    private fun setup(
        project: Project,
        toolWindow: ToolWindow,
        workspace: Workspace,
    ) {
        try {
            val manager = SessionSidePanelManager(project, workspace)
            val content = ContentFactory.getInstance().createContent(manager.component, "", false)
            content.setDisposer(manager)
            content.setPreferredFocusedComponent { manager.defaultFocusedComponent }
            toolWindow.contentManager.addContent(content)
            toolWindow.contentManager.setSelectedContent(content)
            manager.newSession()

            val actions = listOfNotNull(
                ActionManager.getInstance().getAction("Neo.NewSession"),
                ActionManager.getInstance().getAction("Neo.History"),
                ActionManager.getInstance().getAction("Neo.Settings"),
            )
            toolWindow.setTitleActions(actions)
        } catch (e: Exception) {
            Telemetry.send("Tool Window Setup Failed", mapOf("stage" to "setup", "errorClass" to e::class.java.name))
            LOG.error("Failed to set up Neo tool window content", e)
        }
    }
}
