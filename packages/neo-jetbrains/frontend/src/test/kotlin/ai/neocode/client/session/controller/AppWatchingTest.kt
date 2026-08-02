package ai.neocode.client.session.controller

import ai.neocode.rpc.dto.ConfigWarningDto
import ai.neocode.rpc.dto.NeoWorkspaceStatusDto
import ai.neocode.rpc.dto.NeoAppStateDto
import ai.neocode.rpc.dto.NeoAppStatusDto

class AppWatchingTest : SessionControllerTestBase() {

    fun `test app state change fires AppChanged`() {
        val m = controller()
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        flush()

        assertControllerEvents("AppChanged", events)
        assertSession(
            """
            [app: READY] [workspace: PENDING]
            """,
            m,
            show = false,
        )
    }

    fun `test retry connection uses app retry when app is failed`() {
        val m = controller()
        val events = collect(m)
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.ERROR, error = "boom")

        flush()
        events.clear()
        edt { m.retryConnection() }
        flush()

        assertEquals(1, appRpc.retries)
        assertEquals(0, projectRpc.reloads)
        assertTrue(events.any { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })
    }

    fun `test retry connection reloads workspace when app ready and workspace failed`() {
        val m = controller()
        val events = collect(m)
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = ai.neocode.rpc.dto.NeoWorkspaceStateDto(
            status = NeoWorkspaceStatusDto.ERROR,
            error = "workspace fail",
        )

        flush()
        events.clear()
        edt { m.retryConnection() }
        flush()

        assertEquals(0, appRpc.retries)
        assertEquals(1, projectRpc.reloads)
        assertTrue(events.any { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })
    }

    fun `test retry connection uses app retry when app has warnings`() {
        val m = controller()
        val events = collect(m)
        appRpc.state.value = NeoAppStateDto(
            status = NeoAppStatusDto.READY,
            warnings = listOf(ConfigWarningDto(path = ".neo/neo.json", message = "Invalid JSON")),
        )

        flush()
        events.clear()
        edt { m.retryConnection() }
        flush()

        assertEquals(1, appRpc.retries)
        assertEquals(0, projectRpc.reloads)
        assertTrue(events.any { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })
    }

    fun `test retry connection immediately updates connection state`() {
        val m = controller()
        val states = collectStates(m)
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.ERROR, error = "boom")
        flush()
        states.clear()

        edt { m.retryConnection() }
        flush()

        val state = states.single { it.first is SessionControllerEvent.ConnectionChanged.ShowConnecting }.second
        assertEquals(SessionControllerEvent.ConnectionChanged.ShowConnecting, state.connectionState)
        assertEquals(SessionControllerEvent.ConnectionChanged.ShowConnecting, state.connectionTargetState)
    }
}
