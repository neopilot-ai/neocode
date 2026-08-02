package ai.neocode.client.actions

import com.intellij.openapi.actionSystem.ActionPlaces

internal object NeoActionPlaces {
    const val CONNECTION_RETRY = "Neo.ConnectionRetry"

    fun connectionRetryPopup() = ActionPlaces.getActionGroupPopupPlace(CONNECTION_RETRY)
}
