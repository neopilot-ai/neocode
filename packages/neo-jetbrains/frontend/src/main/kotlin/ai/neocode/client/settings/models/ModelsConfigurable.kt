package ai.neocode.client.settings.models

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.settings.base.DraftReadyConfigurable
import com.intellij.openapi.project.ProjectManager
import kotlinx.coroutines.CoroutineScope
import javax.swing.JComponent

class ModelsConfigurable : DraftReadyConfigurable<JComponent>() {
    override fun getId(): String = ID

    override fun getDisplayName(): String = NeoBundle.message("settings.models.displayName")

    override fun create(cs: CoroutineScope): JComponent {
        val dir = ProjectManager.getInstance().openProjects.firstOrNull { !it.isDefault }?.basePath
        return ModelsSettingsUi(cs, directory = dir)
    }

    companion object {
        const val ID = "ai.neocode.jetbrains.settings.models"
    }
}
