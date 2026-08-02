package ai.neocode.client.settings

import ai.neocode.client.settings.profile.UserProfileConfigurable
import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.project.Project

internal object NeoSettingsSelection {
    // IntelliJ persists the selected settings page with SettingsEditor.SELECTED_CONFIGURABLE.
    const val SELECTED_CONFIGURABLE_KEY = "settings.editor.selected.configurable"

    fun target(project: Project): String {
        val id = PropertiesComponent.getInstance(project).getValue(SELECTED_CONFIGURABLE_KEY)
        if (id != null && isNeo(id)) return id
        return UserProfileConfigurable.ID
    }

    private fun isNeo(id: String?): Boolean {
        if (id == NeoSettingsConfigurable.ID) return true
        return id?.startsWith("${NeoSettingsConfigurable.ID}.") == true
    }
}
