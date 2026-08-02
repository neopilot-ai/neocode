package ai.neocode.client.settings

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.settings.agents.AgentBehaviorConfigurable
import ai.neocode.client.settings.models.ModelsConfigurable
import ai.neocode.client.settings.providers.ProvidersConfigurable
import ai.neocode.client.settings.profile.UserProfileConfigurable
import ai.neocode.client.ui.UiStyle
import ai.neocode.client.ui.layout.Stack
import com.intellij.ide.DataManager
import com.intellij.openapi.options.SearchableConfigurable
import com.intellij.openapi.options.ex.Settings
import com.intellij.ui.components.ActionLink
import com.intellij.ui.components.JBLabel
import com.intellij.util.ui.JBUI
import javax.swing.JComponent

/**
 * Root settings entry under Settings -> Tools -> Neo Code.
 *
 * Displays a brief description and a link to the User Profile child page.
 * Child configurables are registered in XML (`neo.jetbrains.frontend.xml`) as
 * `applicationConfigurable` entries with the appropriate `parentId` — that is the
 * single source of truth for the settings hierarchy. This class does NOT implement
 * [com.intellij.openapi.options.SearchableConfigurable.Parent] to avoid creating a
 * second `UserProfileConfigurable` instance alongside the one registered in XML.
 *
 * The link uses [UserProfileConfigurable.ID] to navigate via [Settings.find]/[Settings.select].
 */
class NeoSettingsConfigurable : SearchableConfigurable {

    override fun getId(): String = ID

    override fun getDisplayName(): String = NeoBundle.message("settings.neo.displayName")

    override fun createComponent(): JComponent {
        val panel = Stack.vertical()
        panel.border = JBUI.Borders.empty(UiStyle.Gap.lg(), 0, 0, 0)

        val desc = JBLabel(NeoBundle.message("settings.neo.description"))
        desc.border = JBUI.Borders.emptyBottom(UiStyle.Gap.pad())
        panel.next(desc)

        val link = ActionLink(NeoBundle.message("settings.profile.displayName")) { e ->
            val src = e.source as? JComponent ?: return@ActionLink
            val settings = Settings.KEY.getData(DataManager.getInstance().getDataContext(src)) ?: return@ActionLink
            open(settings, UserProfileConfigurable.ID)
        }
        link.border = JBUI.Borders.emptyBottom(UiStyle.Gap.sm())
        panel.next(link)

        val models = ActionLink(NeoBundle.message("settings.models.displayName")) { e ->
            val src = e.source as? JComponent ?: return@ActionLink
            val settings = Settings.KEY.getData(DataManager.getInstance().getDataContext(src)) ?: return@ActionLink
            open(settings, ModelsConfigurable.ID)
        }
        models.border = JBUI.Borders.emptyBottom(UiStyle.Gap.sm())
        panel.next(models)

        val providers = ActionLink(NeoBundle.message("settings.providers.displayName")) { e ->
            val src = e.source as? JComponent ?: return@ActionLink
            val settings = Settings.KEY.getData(DataManager.getInstance().getDataContext(src)) ?: return@ActionLink
            open(settings, ProvidersConfigurable.ID)
        }
        providers.border = JBUI.Borders.emptyBottom(UiStyle.Gap.sm())
        panel.next(providers)

        val behavior = ActionLink(NeoBundle.message("settings.agentBehavior.displayName")) { e ->
            val src = e.source as? JComponent ?: return@ActionLink
            val settings = Settings.KEY.getData(DataManager.getInstance().getDataContext(src)) ?: return@ActionLink
            open(settings, AgentBehaviorConfigurable.ID)
        }
        behavior.border = JBUI.Borders.emptyBottom(UiStyle.Gap.sm())
        panel.next(behavior)

        return panel
    }

    override fun isModified(): Boolean = false

    override fun apply() = Unit

    internal fun open(settings: Settings, id: String = UserProfileConfigurable.ID) {
        settings.find(id)?.let { settings.select(it) }
    }

    companion object {
        const val ID = "ai.neocode.jetbrains.settings"
    }
}
