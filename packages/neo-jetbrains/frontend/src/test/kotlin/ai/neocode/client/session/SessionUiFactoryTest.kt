package ai.neocode.client.session

import ai.neocode.client.app.NeoAppService
import ai.neocode.client.app.NeoSessionService
import ai.neocode.client.app.NeoWorkspaceService
import ai.neocode.client.app.Workspace
import ai.neocode.client.testing.FakeAppRpcApi
import ai.neocode.client.testing.FakeSessionRpcApi
import ai.neocode.client.testing.FakeWorkspaceRpcApi
import ai.neocode.rpc.dto.NeoAppStateDto
import ai.neocode.rpc.dto.NeoAppStatusDto
import ai.neocode.rpc.dto.NeoWorkspaceStateDto
import ai.neocode.rpc.dto.NeoWorkspaceStatusDto
import ai.neocode.rpc.dto.SessionDto
import ai.neocode.rpc.dto.SessionTimeDto
import com.intellij.openapi.components.service
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

@Suppress("UnstableApiUsage")
class SessionUiFactoryTest : BasePlatformTestCase() {
    private lateinit var scope: CoroutineScope
    private lateinit var workspace: Workspace
    private lateinit var workspaces: NeoWorkspaceService
    private lateinit var sessions: NeoSessionService
    private lateinit var app: NeoAppService

    override fun setUp() {
        super.setUp()
        scope = CoroutineScope(SupervisorJob())
        sessions = NeoSessionService(project, scope, FakeSessionRpcApi())
        app = NeoAppService(scope, FakeAppRpcApi().also {
            it.state.value = NeoAppStateDto(NeoAppStatusDto.READY)
        })
        workspaces = NeoWorkspaceService(scope, FakeWorkspaceRpcApi().also {
            it.state.value = NeoWorkspaceStateDto(NeoWorkspaceStatusDto.READY)
        })
        workspace = workspaces.workspace("/test")
    }

    override fun tearDown() {
        try {
            scope.cancel()
        } finally {
            super.tearDown()
        }
    }

    fun `test factory creates blank session ui`() {
        val ui = direct().create(project, workspace, FakeManager(), null)

        assertNotNull(ui)
    }

    fun `test factory wires open callback`() {
        val manager = FakeManager()
        val rpc = session("ses_1")
        val ui = SessionUi(project, workspace, sessions, app, scope, manager = manager, workspaces = workspaces)
        val controller = controller(ui)

        com.intellij.openapi.application.ApplicationManager.getApplication().invokeAndWait {
            controller.openSession(rpc)
        }

        assertEquals(listOf("ses_1"), manager.opened)
    }

    fun `test empty panel opens through SessionRef via controller`() {
        val manager = FakeManager()
        val rpc = session("ses_1")
        val ui = SessionUi(project, workspace, sessions, app, scope, manager = manager, workspaces = workspaces)
        val controller = controller(ui)
        val panel = ai.neocode.client.session.ui.empty.EmptySessionPanel(testRootDisposable, controller, listOf(rpc))

        panel.clickRecent(0)

        // Recent click routes through SessionRef.Local path
        assertEquals(listOf("ses_1"), manager.opened)
    }

    fun `test empty panel show history routes through manager`() {
        val manager = FakeManager()
        val ui = SessionUi(project, workspace, sessions, app, scope, manager = manager, workspaces = workspaces)
        val controller = controller(ui)
        val panel = ai.neocode.client.session.ui.empty.EmptySessionPanel(
            testRootDisposable,
            controller,
            emptyList(),
            history = { manager.showHistory() },
        )

        panel.clickShowHistory()

        assertEquals(1, manager.history)
    }

    private fun controller(ui: SessionUi): ai.neocode.client.session.controller.SessionController {
        val field = SessionUi::class.java.getDeclaredField("controller")
        field.isAccessible = true
        return field.get(ui) as ai.neocode.client.session.controller.SessionController
    }

    fun `test application service is available`() {
        assertNotNull(service<SessionUiFactory>())
    }

    private fun direct() = SessionUiFactory(scope)

    private fun session(id: String) = SessionDto(
        id = id,
        projectID = "prj",
        directory = "/test",
        title = "Session $id",
        version = "1",
        time = SessionTimeDto(created = 1.0, updated = 2.0),
    )

    private class FakeManager : SessionManager {
        val opened = mutableListOf<String>()
        var history = 0
        override fun newSession() {
        }

        override fun showHistory() {
            history++
        }

        override fun openSession(ref: SessionRef) {
            val id = when (ref) {
                is SessionRef.Local -> ref.id
                is SessionRef.Cloud -> ref.key
            }
            opened.add(id)
        }
    }
}
