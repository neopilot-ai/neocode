package ai.neocode.backend.dev

import ai.neocode.log.NeoLog

object NeoDevMode {
    fun enabled(): Boolean = NeoLog.sandbox()
}
