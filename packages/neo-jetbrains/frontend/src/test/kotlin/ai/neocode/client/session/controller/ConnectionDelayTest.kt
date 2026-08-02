package ai.neocode.client.session.controller

import ai.neocode.rpc.dto.ConfigWarningDto
import ai.neocode.rpc.dto.NeoAppStateDto
import ai.neocode.rpc.dto.NeoAppStatusDto
import ai.neocode.rpc.dto.NeoWorkspaceStateDto
import ai.neocode.rpc.dto.NeoWorkspaceStatusDto
import ai.neocode.rpc.dto.LoadErrorDto
import com.intellij.openapi.util.Disposer

class ConnectionDelayTest : SessionControllerTestBase() {

    fun `test short connecting state does not fire connection banner`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 100)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        pause(25)
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        pause(150)

        assertFalse(events.any { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })
    }

    fun `test persistent connecting state fires connection banner after delay`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        pause(20)
        assertFalse(events.any { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })

        pause(80)

        assertEquals(1, events.count { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })
    }

    fun `test connecting event sees updated connection state on EDT`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val states = collectStates(m)
        flush()
        states.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        pause(80)

        val state = states.single { it.first is SessionControllerEvent.ConnectionChanged.ShowConnecting }.second
        assertEquals(SessionControllerEvent.ConnectionChanged.ShowConnecting, state.connectionState)
    }

    fun `test short app error is suppressed`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 100)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.ERROR, error = "boom")
        pause(25)
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        pause(150)

        assertFalse(events.any { it is SessionControllerEvent.ConnectionChanged.ShowError })
    }

    fun `test persistent app error fires latest error after delay`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(
            status = NeoAppStatusDto.ERROR,
            error = "CLI startup failed",
            errors = listOf(
                LoadErrorDto(resource = "connection", detail = "stderr line"),
                LoadErrorDto(resource = "config", detail = "HTTP 500"),
            ),
        )
        pause(80)

        val event = events.filterIsInstance<SessionControllerEvent.ConnectionChanged.ShowError>().single()
        assertEquals("Connection failed", event.summary)
        assertEquals("stderr line\nconfig: HTTP 500", event.detail)
    }

    fun `test changed error restarts delay and shows latest state`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 100)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.ERROR, error = "first")
        pause(50)
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.ERROR, error = "second")
        pause(150)

        val errors = events.filterIsInstance<SessionControllerEvent.ConnectionChanged.ShowError>()
        assertEquals(listOf("Connection failed"), errors.map { it.summary })
        assertEquals(listOf("second"), errors.map { it.detail })
    }

    fun `test persistent workspace error is delayed`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val events = collect(m)
        flush()
        events.clear()

        projectRpc.state.value = NeoWorkspaceStateDto(
            status = NeoWorkspaceStatusDto.ERROR,
            error = "workspace failed",
            errors = listOf(LoadErrorDto(resource = "providers", detail = "bad provider json")),
        )
        pause(20)
        assertFalse(events.any { it is SessionControllerEvent.ConnectionChanged.ShowError })

        pause(80)

        val event = events.filterIsInstance<SessionControllerEvent.ConnectionChanged.ShowError>().single()
        assertEquals("Workspace loading failed", event.summary)
        assertEquals("providers: bad provider json", event.detail)
    }

    fun `test ready hides visible delayed connection banner immediately`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        pause(80)
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        pause(10)

        assertTrue(events.any { it is SessionControllerEvent.ConnectionChanged.Hide })
    }

    fun `test hide event sees updated connection state on EDT`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val states = collectStates(m)
        flush()
        states.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        pause(80)
        states.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        pause(10)

        val state = states.single { it.first is SessionControllerEvent.ConnectionChanged.Hide }.second
        assertEquals(SessionControllerEvent.ConnectionChanged.Hide, state.connectionState)
    }

    fun `test config warning remains immediate`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 1_000)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(
            status = NeoAppStatusDto.READY,
            warnings = listOf(ConfigWarningDto(path = ".neo/neo.json", message = "Invalid JSON")),
        )
        pause(10)

        val event = events.filterIsInstance<SessionControllerEvent.ConnectionChanged.ShowWarning>().single()
        assertEquals("Configuration warnings", event.summary)
        assertEquals(".neo/neo.json: Invalid JSON", event.detail)
    }

    fun `test warning event sees updated connection state on EDT`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 1_000)
        val states = collectStates(m)
        flush()
        states.clear()

        appRpc.state.value = NeoAppStateDto(
            status = NeoAppStatusDto.READY,
            warnings = listOf(ConfigWarningDto(path = ".neo/neo.json", message = "Invalid JSON")),
        )
        pause(10)

        val event = states.single { it.first is SessionControllerEvent.ConnectionChanged.ShowWarning }
        assertEquals(event.first, event.second.connectionState)
    }

    fun `test dispose suppresses pending delayed connection event`() {
        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        projectRpc.state.value = workspaceReady()
        val m = controller(displayMs = 50)
        val events = collect(m)
        flush()
        events.clear()

        appRpc.state.value = NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        pause(20)
        Disposer.dispose(m)
        pause(100)

        assertFalse(events.any { it is SessionControllerEvent.ConnectionChanged.ShowConnecting })
    }
}
