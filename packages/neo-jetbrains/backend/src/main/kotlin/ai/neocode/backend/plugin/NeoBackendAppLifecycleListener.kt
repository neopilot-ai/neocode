package ai.neocode.backend.plugin

import ai.neocode.backend.app.NeoBackendAppService
import ai.neocode.log.NeoLog
import com.intellij.ide.AppLifecycleListener
import com.intellij.openapi.components.serviceIfCreated

class NeoBackendAppLifecycleListener : AppLifecycleListener {
    private val log = NeoLog.create(NeoBackendAppLifecycleListener::class.java)

    override fun appWillBeClosed(isRestart: Boolean) {
        log.info("appWillBeClosed(isRestart=$isRestart) — stopping Neo CLI")
        runCatching {
            serviceIfCreated<NeoBackendAppService>()?.shutdownForAppClose()
        }.onFailure { log.warn("Failed to stop CLI on app close", it) }
    }
}
