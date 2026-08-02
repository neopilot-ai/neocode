package ai.neocode.client.session.views.permission

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.session.model.Permission
import ai.neocode.client.session.model.PermissionFileDiff
import ai.neocode.client.session.model.PermissionRequestState
import ai.neocode.client.session.ui.SessionView
import ai.neocode.client.session.views.base.BaseQuestionView
import ai.neocode.client.session.ui.selection.SessionSelection
import ai.neocode.client.session.ui.style.SessionEditorStyle
import ai.neocode.client.session.ui.style.SessionEditorStyleTarget
import ai.neocode.client.session.ui.style.SessionUiStyle
import ai.neocode.client.session.views.SessionViewIcons
import ai.neocode.client.ui.UiStyle
import ai.neocode.client.ui.layout.HAlign
import ai.neocode.client.ui.layout.Stack
import ai.neocode.client.ui.layout.VAlign
import ai.neocode.client.ui.layout.align
import ai.neocode.rpc.dto.PermissionReplyDto
import com.intellij.openapi.Disposable
import com.intellij.openapi.util.Disposer
import com.intellij.ui.ColorUtil
import com.intellij.ui.components.JBHtmlPane
import com.intellij.ui.components.JBHtmlPaneConfiguration
import com.intellij.ui.components.JBHtmlPaneStyleConfiguration
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextArea
import com.intellij.util.ui.JBUI
import com.intellij.util.ui.components.BorderLayoutPanel
import com.intellij.xml.util.XmlStringUtil
import java.awt.BorderLayout
import java.awt.Container
import java.awt.FlowLayout
import javax.swing.JButton
import javax.swing.JPanel
import javax.swing.text.html.StyleSheet

/**
 * Transcript-style permission view — rendered inside [ai.neocode.client.session.ui.SessionMessageListPanel]
 * at the end of the transcript when the session is in
 * [ai.neocode.client.session.model.SessionState.AwaitingPermission].
 *
 * Shows a compact row with action label and target as an inline code fragment, plus diff badges.
 */
class PermissionView(
    private val reply: (String, PermissionReplyDto) -> Unit,
    private val selection: SessionSelection? = null,
    focus: (() -> Unit)? = null,
) : BorderLayoutPanel(), SessionEditorStyleTarget, SessionView {
    override val sessionViewKind = SessionView.Kind.Default

    private var requestId: String? = null
    private var style = SessionEditorStyle.current()

    private val card = BaseQuestionView(selection, focus)

    private val body = Stack.vertical()

    // Track target panes for style updates
    private val panes = mutableListOf<JBHtmlPane>()
    private val regs = mutableListOf<Disposable>()
    private val diffViews = mutableListOf<PermissionDiffView>()

    private val ID_DENY = "deny"
    private val ID_RUN = "run"

    init {
        isOpaque = false
        isVisible = false

        card.setHeaderIcon(SessionViewIcons.warning, NeoBundle.message("session.permission.title"))
        card.setContent(body)
        card.setActions(listOf(
            BaseQuestionView.Action(ID_DENY, NeoBundle.message("session.permission.deny"), primary = false) { decide("reject") },
            BaseQuestionView.Action(ID_RUN, NeoBundle.message("session.permission.run"), primary = true) { decide("once") },
        ))
        addToCenter(card)
    }

    /** Populate the view for [permission] and make it visible. */
    fun show(permission: Permission) {
        requestId = permission.id

        card.setHeader(NeoBundle.message("session.permission.title"))

        body.removeAll()
        disposeRegs()
        panes.clear()
        diffViews.clear()

        val tool = permission.name
        val cmd = permission.meta.command

        val action = toolLabel(tool)
        val target = cmd ?: resolveTarget(permission)
        addDetailRow(action, target, permission.meta.fileDiffs)
        addStateMessage(permission)

        val responding = permission.state == PermissionRequestState.RESPONDING || permission.state == PermissionRequestState.RESOLVED
        card.setActionEnabled(ID_RUN, !responding)
        card.setActionEnabled(ID_DENY, !responding)

        isVisible = true
        refresh()
    }

    /** Hide this view and clear the active request id. */
    fun hideView() {
        requestId = null
        body.removeAll()
        disposeRegs()
        panes.clear()
        diffViews.clear()
        isVisible = false
        refresh()
    }

    override fun applyStyle(style: SessionEditorStyle) {
        this.style = style
        card.applyStyle(style)
        for (pane in panes) {
            applyTargetPane(pane)
        }
        for (dv in diffViews) {
            dv.applyStyle(style)
        }
    }

    /** Adds a three-column permission detail row: tool, target, and changes. */
    private fun addDetailRow(action: String, target: String?, diffs: List<PermissionFileDiff>) {
        val row = JPanel(BorderLayout(SessionUiStyle.View.Layout.GAP, 0)).apply {
            isOpaque = false
        }

        val actionLbl = JBLabel(action).apply {
            font = UiStyle.Fonts.bold()
        }
        row.add(actionLbl.align(HAlign.LEFT, VAlign.CENTER), BorderLayout.WEST)

        if (!target.isNullOrBlank()) {
            val pane = targetPane(target)
            panes.add(pane)
            row.add(pane.align(HAlign.TRACK, VAlign.CENTER), BorderLayout.CENTER)
        }

        if (diffs.isNotEmpty()) {
            val changes = JPanel(FlowLayout(FlowLayout.LEFT, 0, 0)).apply {
                isOpaque = false
            }
            for (diff in diffs) {
                val dv = PermissionDiffView(diff)
                diffViews.add(dv)
                changes.add(dv)
            }
            row.add(changes.align(HAlign.RIGHT, VAlign.CENTER), BorderLayout.EAST)
        }

        body.add(row)
    }

    private fun targetPane(text: String) = JBHtmlPane(
        JBHtmlPaneStyleConfiguration {},
        JBHtmlPaneConfiguration {
            customStyleSheetProvider { targetSheet() }
        },
    ).apply {
        isEditable = false
        isOpaque = true
        this.text = "<html><body><pre>${XmlStringUtil.escapeString(text)}</pre></body></html>"
        applyTargetPane(this)
        selection?.register(this)?.let(regs::add)
    }

    private fun applyTargetPane(pane: JBHtmlPane) {
        pane.font = style.transcriptFont
        pane.foreground = style.editorForeground
        pane.background = SessionUiStyle.View.Surface.headerHoverBgColor()
        pane.reloadCssStylesheets()
    }

    private fun targetSheet(): StyleSheet {
        val sheet = StyleSheet()
        val font = style.transcriptFont
        val fg = ColorUtil.toHtmlColor(style.editorForeground)
        val bg = ColorUtil.toHtmlColor(SessionUiStyle.View.Surface.headerHoverBgColor())
        val family = font.name.replace("\\", "\\\\").replace("'", "\\'")
        sheet.addRule("body { margin: 0; padding: 0 ${UiStyle.Gap.xs()}px; color: $fg; background: $bg; font-family: '$family', monospace; font-size: ${font.size}pt }")
        sheet.addRule("pre { margin: 0; white-space: pre-wrap; font-family: '$family', monospace; font-size: ${font.size}pt }")
        return sheet
    }

    private fun resolveTarget(permission: Permission): String? {
        val path = permission.meta.filePath
        if (!path.isNullOrBlank()) return path

        val filtered = permission.patterns.filter { it != "*" }
        return when {
            filtered.size == 1 -> filtered[0]
            filtered.size > 1 -> filtered.joinToString(", ")
            else -> null
        }
    }

    private fun addStateMessage(permission: Permission) {
        val msg = when (permission.state) {
            PermissionRequestState.ERROR ->
                permission.message ?: NeoBundle.message("session.permission.error")
            PermissionRequestState.RESPONDING ->
                NeoBundle.message("session.permission.responding")
            else -> null
        } ?: return

        val label = JBLabel(msg).apply {
            border = JBUI.Borders.empty(UiStyle.Gap.sm(), 0, 0, 0)
        }
        body.add(label)
    }

    private fun toolLabel(tool: String): String = when (tool) {
        "read" -> NeoBundle.message("session.permission.tool.read")
        "edit" -> NeoBundle.message("session.permission.tool.edit")
        "write" -> NeoBundle.message("session.permission.tool.write")
        "patch" -> NeoBundle.message("session.permission.tool.patch")
        "multiedit" -> NeoBundle.message("session.permission.tool.multiedit")
        "glob" -> NeoBundle.message("session.permission.tool.glob")
        "grep" -> NeoBundle.message("session.permission.tool.grep")
        "list" -> NeoBundle.message("session.permission.tool.list")
        "bash" -> NeoBundle.message("session.permission.tool.bash")
        "external_directory" -> NeoBundle.message("session.permission.tool.external_directory")
        "webfetch" -> NeoBundle.message("session.permission.tool.webfetch")
        "websearch" -> NeoBundle.message("session.permission.tool.websearch")
        "codesearch" -> NeoBundle.message("session.permission.tool.codesearch")
        "todoread" -> NeoBundle.message("session.permission.tool.todoread")
        "todowrite" -> NeoBundle.message("session.permission.tool.todowrite")
        "task" -> NeoBundle.message("session.permission.tool.task")
        "skill" -> NeoBundle.message("session.permission.tool.skill")
        "lsp" -> NeoBundle.message("session.permission.tool.lsp")
        else -> tool
    }

    private fun decide(value: String) {
        val id = requestId ?: return
        card.setActionEnabled(ID_RUN, false)
        card.setActionEnabled(ID_DENY, false)
        reply(id, PermissionReplyDto(reply = value))
    }

    private fun refresh() {
        revalidate()
        repaint()
        parent?.revalidate()
        parent?.repaint()
    }

    private fun disposeRegs() {
        regs.forEach(Disposer::dispose)
        regs.clear()
    }

    // Test helpers
    internal fun runButtonForTest() = buttons(card).first { it.text == NeoBundle.message("session.permission.run") }
    internal fun denyButtonForTest() = buttons(card).first { it.text == NeoBundle.message("session.permission.deny") }
    internal fun codeLabelsForTest() = panes.toList()
    internal fun diffViewsForTest() = diffViews.toList()
    internal fun headerFontForTest() = textAreas(card).first { it.font.isBold }.font

    private fun buttons(root: Container): List<JButton> {
        val result = mutableListOf<JButton>()
        if (root is JButton) result.add(root)
        for (child in root.components) {
            if (child is Container) result.addAll(buttons(child))
        }
        return result
    }

    private fun textAreas(root: Container): List<JBTextArea> {
        val result = mutableListOf<JBTextArea>()
        if (root is JBTextArea) result.add(root)
        for (child in root.components) {
            if (child is Container) result.addAll(textAreas(child))
        }
        return result
    }
}
