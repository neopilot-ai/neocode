package ai.neocode.client.vfs

import com.intellij.openapi.Disposable
import com.intellij.openapi.project.Project
import com.intellij.util.concurrency.annotations.RequiresEdt
import javax.swing.JComponent

interface NeoEditorKind : NeoVirtualFileKind {
    @RequiresEdt
    fun createContent(project: Project, file: NeoVirtualFile, parent: Disposable): JComponent

    fun preferredFocus(component: JComponent): JComponent? = null
}
