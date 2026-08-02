package ai.neocode.client.settings.models

import ai.neocode.client.session.ui.model.ModelPicker
import com.intellij.testFramework.fixtures.BasePlatformTestCase

class ModelSettingPickerTest : BasePlatformTestCase() {

    fun `test picker re-enables after ready state follows disabled state`() {
        val picker = ModelSettingPicker()
        val items = listOf(ModelPicker.Item("auto", "Auto", "neo", "Neo"))

        picker.setItems(emptyList(), null)
        picker.isEnabled = false
        picker.setItems(items, null)
        picker.isEnabled = true

        assertTrue(picker.picker.isEnabled)
    }
}
