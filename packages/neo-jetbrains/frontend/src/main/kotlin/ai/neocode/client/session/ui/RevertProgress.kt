package ai.neocode.client.session.ui

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.session.ui.style.SessionEditorStyle
import ai.neocode.client.session.ui.style.SessionEditorStyleTarget
import ai.neocode.client.ui.UiStyle
import ai.neocode.client.ui.layout.Stack
import com.intellij.ui.AnimatedIcon
import com.intellij.ui.components.ActionLink
import com.intellij.ui.components.JBLabel
import com.intellij.util.concurrency.annotations.RequiresEdt
import javax.swing.JPanel

class RevertProgress(onCancel: () -> Unit) : JPanel(), SessionEditorStyleTarget {
    private val label = JBLabel()
    private val cancel = ActionLink(NeoBundle.message("session.action.cancel")) { onCancel() }
    private var style = SessionEditorStyle.current()

    init {
        isOpaque = false
        add(Stack.horizontal(UiStyle.Gap.sm())
            .next(JBLabel(AnimatedIcon.Default()))
            .next(label)
            .next(cancel))
        applyStyle(style)
    }

    @RequiresEdt
    fun setText(text: String) {
        if (label.text == text) return
        label.text = text
        revalidate()
        repaint()
    }

    override fun applyStyle(style: SessionEditorStyle) {
        this.style = style
        label.font = style.regularFont
        label.foreground = UiStyle.Colors.fg()
        cancel.font = style.regularFont
        revalidate()
        repaint()
    }
}
