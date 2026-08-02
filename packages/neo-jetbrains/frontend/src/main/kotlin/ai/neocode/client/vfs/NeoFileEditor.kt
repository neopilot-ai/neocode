package ai.neocode.client.vfs

import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.util.concurrency.annotations.RequiresEdt
import javax.swing.JComponent

class NeoFileEditor(
    private val project: Project,
    private val file: VirtualFile,
    private val neo: NeoVirtualFile,
    private val kind: NeoEditorKind,
) : NeoFileEditorBase() {
    private val ui: JComponent by lazy { kind.createContent(project, neo, this) }

    @RequiresEdt
    override fun getComponent(): JComponent = ui

    override fun getPreferredFocusedComponent(): JComponent? = kind.preferredFocus(ui)
    override fun getName(): String = kind.title(neo.path.params)
    override fun getFile(): VirtualFile = file
    override fun isValid(): Boolean = super.isValid() && neo.isValid

    override fun dispose() {
        NeoVirtualFileSystem.getInstance().release(neo.path)
        super.dispose()
    }
}
