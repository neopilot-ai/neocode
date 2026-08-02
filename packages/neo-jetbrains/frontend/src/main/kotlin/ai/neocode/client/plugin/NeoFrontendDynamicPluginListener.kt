package ai.neocode.client.plugin

import ai.neocode.NeoPlugin
import ai.neocode.client.session.ui.attachment.unregisterAttachmentEditorKind
import ai.neocode.client.vfs.NeoEditorKindRegistry
import ai.neocode.client.vfs.NeoVirtualFileSystem
import ai.neocode.log.NeoLog
import com.intellij.ide.plugins.DynamicPluginListener
import com.intellij.ide.plugins.IdeaPluginDescriptor
import com.intellij.openapi.components.service
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.ProjectManager
import com.intellij.openapi.wm.ToolWindowManager
import javax.swing.SwingUtilities

class NeoFrontendDynamicPluginListener : DynamicPluginListener {
    override fun beforePluginUnload(pluginDescriptor: IdeaPluginDescriptor, isUpdate: Boolean) {
        if (pluginDescriptor.pluginId != NeoPlugin.id) return
        NeoFrontendUnloadCleanup.cleanup(isUpdate)
    }
}

object NeoFrontendUnloadCleanup {
    private val log = NeoLog.create(NeoFrontendUnloadCleanup::class.java)

    fun cleanup(isUpdate: Boolean) {
        log.info("Cleaning up Neo frontend for plugin unload (isUpdate=$isUpdate)")
        runEdt {
            ProjectManager.getInstance().openProjects.forEach { project ->
                if (project.isDisposed) return@forEach
                ToolWindowManager.getInstance(project).getToolWindow("Neo Code")
                    ?.contentManager
                    ?.removeAllContents(true)
                val editors = FileEditorManager.getInstance(project).openFiles
                    .filter { it.fileSystem === NeoVirtualFileSystem.getInstance() }
                editors.forEach { file -> FileEditorManager.getInstance(project).closeFile(file) }
            }
        }
        unregisterAttachmentEditorKind()
        service<NeoEditorKindRegistry>().clear()
        NeoVirtualFileSystem.getInstance().clear()
    }

    private fun runEdt(block: () -> Unit) {
        if (SwingUtilities.isEventDispatchThread()) {
            block()
            return
        }
        SwingUtilities.invokeAndWait(block)
    }
}
