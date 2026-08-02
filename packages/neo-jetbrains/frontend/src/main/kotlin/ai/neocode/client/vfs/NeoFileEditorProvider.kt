package ai.neocode.client.vfs

import ai.neocode.client.session.ui.attachment.ensureAttachmentEditorKind
import com.intellij.openapi.components.service
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorPolicy
import com.intellij.openapi.fileEditor.FileEditorProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.vfs.VirtualFile

class NeoFileEditorProvider : FileEditorProvider, DumbAware {
    override fun accept(project: Project, file: VirtualFile): Boolean {
        ensureAttachmentEditorKind()
        val path = path(file) ?: return false
        return service<NeoEditorKindRegistry>().get(path.kind) != null
    }

    override fun acceptRequiresReadAction(): Boolean = false

    override fun createEditor(project: Project, file: VirtualFile): FileEditor {
        ensureAttachmentEditorKind()
        val path = path(file) ?: error("Invalid Neo virtual file: ${file.path}")
        val neo = file as? NeoVirtualFile ?: NeoVirtualFile(path)
        val kind = service<NeoEditorKindRegistry>().get(neo.path.kind) ?: error("Unknown Neo editor kind: ${neo.path.kind}")
        return NeoFileEditor(project, file, neo, kind)
    }

    override fun disposeEditor(editor: FileEditor) {
        Disposer.dispose(editor)
    }

    override fun getEditorTypeId(): String = EDITOR_TYPE_ID
    override fun getPolicy(): FileEditorPolicy = FileEditorPolicy.HIDE_OTHER_EDITORS

    companion object {
        const val EDITOR_TYPE_ID = "NeoVfsEditor"

        private fun path(file: VirtualFile): NeoPath? {
            if (file is NeoVirtualFile) return file.path
            if (file.fileSystem.protocol != NeoVirtualFileSystem.PROTOCOL && !file.url.startsWith("${NeoVirtualFileSystem.PROTOCOL}://")) return null
            return NeoVirtualFileSystem.decode(file.path) ?: NeoVirtualFileSystem.decode(file.url)
        }
    }
}
