package ai.neocode.backend.plugin

import ai.neocode.NeoPlugin
import ai.neocode.backend.app.NeoBackendAppService
import ai.neocode.log.NeoLog
import com.intellij.ide.plugins.DynamicPluginListener
import com.intellij.ide.plugins.IdeaPluginDescriptor
import com.intellij.openapi.components.service

class NeoBackendDynamicPluginListener : DynamicPluginListener {
    private val log = NeoLog.create(NeoBackendDynamicPluginListener::class.java)

    override fun beforePluginUnload(pluginDescriptor: IdeaPluginDescriptor, isUpdate: Boolean) {
        if (pluginDescriptor.pluginId != NeoPlugin.id) return
        log.info("Shutting down Neo backend for plugin unload (isUpdate=$isUpdate)")
        service<NeoBackendAppService>().shutdownForUnload()
    }
}
