package ai.neocode.client.session

import ai.neocode.client.app.Workspace
import ai.neocode.rpc.dto.SessionDto
import com.intellij.openapi.actionSystem.DataKey

interface SessionManager {
    companion object {
        val KEY = DataKey.create<SessionManager>("ai.neocode.client.session.SessionManager")
        val WORKSPACE_KEY = DataKey.create<Workspace>("ai.neocode.client.session.Workspace")
    }

    fun newSession()

    fun showHistory()

    fun openSession(ref: SessionRef)

    fun activity(): Map<String, SessionActivityKind> = emptyMap()

    fun titles(): Map<String, String> = emptyMap()

    fun activityChanged() {}

    fun focusPrompt() {}

    fun openSession(session: SessionDto) {
        openSession(SessionRef.Local(session))
    }
}
