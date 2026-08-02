package ai.neocode.client.session.ui

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.session.model.SessionState
import ai.neocode.client.session.ui.style.SessionEditorStyle
import ai.neocode.client.session.ui.style.SessionEditorStyleTarget
import ai.neocode.client.ui.UiStyle
import com.intellij.ui.components.JBLabel
import com.intellij.util.ui.Centerizer
import java.awt.BorderLayout
import javax.swing.JPanel

class LoadingPanel : JPanel(BorderLayout()), SessionEditorStyleTarget {
    private val label = JBLabel(NeoBundle.message("session.empty.loading"))

    init {
        isOpaque = false
        add(Centerizer(label, Centerizer.TYPE.BOTH), BorderLayout.CENTER)
        applyStyle(SessionEditorStyle.current())
    }

    fun setState(state: SessionState) {
        when (state) {
            is SessionState.Retry -> {
                label.text = state.message.ifBlank { NeoBundle.message("session.status.retry") }
                label.foreground = UiStyle.Colors.warningLabelForeground()
            }

            is SessionState.Offline -> {
                label.text = state.message.ifBlank { NeoBundle.message("session.status.offline") }
                label.foreground = UiStyle.Colors.errorLabelForeground()
            }

            else -> {
                label.text = NeoBundle.message("session.empty.loading")
                label.foreground = UiStyle.Colors.weak()
            }
        }
        revalidate()
        repaint()
    }

    /** Exposed for test assertions. */
    fun labelText(): String = label.text

    override fun applyStyle(style: SessionEditorStyle) {
        label.font = style.regularFont
        revalidate()
        repaint()
    }
}
