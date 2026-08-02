package ai.neocode.client.settings

import ai.neocode.client.settings.models.ModelsConfigurable
import ai.neocode.client.settings.profile.UserProfileConfigurable
import com.intellij.ide.util.PropertiesComponent
import com.intellij.testFramework.fixtures.BasePlatformTestCase

class NeoSettingsSelectionTest : BasePlatformTestCase() {

    override fun tearDown() {
        try {
            PropertiesComponent.getInstance(project).unsetValue(NeoSettingsSelection.SELECTED_CONFIGURABLE_KEY)
        } finally {
            super.tearDown()
        }
    }

    fun `test falls back to profile when no last settings page exists`() {
        assertEquals(UserProfileConfigurable.ID, NeoSettingsSelection.target(project))
    }

    fun `test falls back to profile when last page is not neo`() {
        select("preferences.lookFeel")

        assertEquals(UserProfileConfigurable.ID, NeoSettingsSelection.target(project))
    }

    fun `test keeps last neo root page`() {
        select(NeoSettingsConfigurable.ID)

        assertEquals(NeoSettingsConfigurable.ID, NeoSettingsSelection.target(project))
    }

    fun `test keeps last neo child page`() {
        select(ModelsConfigurable.ID)

        assertEquals(ModelsConfigurable.ID, NeoSettingsSelection.target(project))
    }

    private fun select(id: String) {
        PropertiesComponent.getInstance(project).setValue(NeoSettingsSelection.SELECTED_CONFIGURABLE_KEY, id)
    }
}
