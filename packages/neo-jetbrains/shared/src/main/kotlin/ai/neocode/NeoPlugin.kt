package ai.neocode

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.extensions.PluginDescriptor
import com.intellij.openapi.extensions.PluginId

object NeoPlugin {
    const val ID = "ai.neocode.jetbrains"

    val id: PluginId = PluginId.getId(ID)

    fun descriptor(): PluginDescriptor? = PluginManagerCore.getPlugin(id)

    fun version() = descriptor()?.version

    fun isRc() = version()?.contains("-rc.", ignoreCase = true) == true
}
