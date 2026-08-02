package ai.neocode.client.actions

import ai.neocode.client.app.NeoAppService
import ai.neocode.client.app.NeoWorkspaceService
import ai.neocode.client.app.Workspace
import ai.neocode.client.session.SessionManager
import ai.neocode.client.testing.FakeAppRpcApi
import ai.neocode.client.testing.FakeWorkspaceRpcApi
import ai.neocode.rpc.dto.ConfigTargetDto
import ai.neocode.rpc.dto.NeoWorkspaceStateDto
import ai.neocode.rpc.dto.NeoWorkspaceStatusDto
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.DataContext
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.actionSystem.Presentation
import com.intellij.openapi.actionSystem.ex.ActionUtil
import com.intellij.openapi.application.ApplicationManager
import com.intellij.testFramework.replaceService
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout

@Suppress("UnstableApiUsage")
class NeoRecoveryActionsTest : BasePlatformTestCase() {
    private lateinit var scope: CoroutineScope
    private lateinit var rpc: FakeWorkspaceRpcApi
    private lateinit var appRpc: FakeAppRpcApi

    override fun setUp() {
        super.setUp()
        scope = CoroutineScope(SupervisorJob())
        rpc = FakeWorkspaceRpcApi()
        appRpc = FakeAppRpcApi()
        ApplicationManager.getApplication().replaceService(
            NeoAppService::class.java,
            NeoAppService(scope, appRpc),
            testRootDisposable,
        )
        ApplicationManager.getApplication().replaceService(
            NeoWorkspaceService::class.java,
            NeoWorkspaceService(scope, rpc),
            testRootDisposable,
        )
    }

    override fun tearDown() {
        try {
            scope.cancel()
        } finally {
            super.tearDown()
        }
    }

    fun `test restart action stays enabled for all app states`() {
        val action = RestartNeoAction()
        val event = event(action)

        update(action, event)

        assertTrue("Restart should force-enable recovery action", event.presentation.isEnabled)
    }

    fun `test reinstall action stays enabled for all app states`() {
        val action = ReinstallNeoAction()
        val event = event(action)

        update(action, event)

        assertTrue("Reinstall should force-enable recovery action", event.presentation.isEnabled)
    }

    fun `test restart action adds core suffix in connection retry popup`() {
        val action = RestartNeoAction()
        val event = event(action, place = NeoActionPlaces.connectionRetryPopup())

        update(action, event)

        assertEquals("Restart Core", event.presentation.text)
    }

    fun `test reinstall action adds core suffix in connection retry popup`() {
        val action = ReinstallNeoAction()
        val event = event(action, place = NeoActionPlaces.connectionRetryPopup())

        update(action, event)

        assertEquals("Reinstall Core", event.presentation.text)
    }

    fun `test core group has visible menu text and info action`() {
        val xml = requireNotNull(javaClass.classLoader.getResourceAsStream("neo.jetbrains.frontend.xml"))
            .bufferedReader()
            .use { it.readText() }

        assertTrue(xml.contains("<group id=\"Neo.CliGroup\" text=\"Core\" popup=\"true\">"))
        assertTrue(xml.contains("<reference ref=\"Neo.Restart\"/>"))
        assertTrue(xml.contains("<reference ref=\"Neo.Reinstall\"/>"))
        assertTrue(xml.contains("<reference ref=\"Neo.CoreInfo\"/>"))
        assertTrue(xml.contains("<group id=\"Neo.OpenConfigGroup\" text=\"Config Files\" popup=\"true\">"))
        assertTrue(xml.contains("<reference ref=\"Neo.OpenConfigGroup\"/>"))
        assertFalse(xml.contains("<action id=\"Neo.ShowProfile\""))
        assertFalse(xml.contains("<reference ref=\"Neo.ShowProfile\"/>"))
    }

    fun `test core info action shows version and architecture`() {
        appRpc.cliVersion = "1.2.3"
        appRpc.cliPlatform = "darwin-arm64"
        ApplicationManager.getApplication().executeOnPooledThread {
            runBlocking { app().coreInfo() }
        }.get()
        val action = CoreInfoAction()
        val event = event(action)

        update(action, event)

        assertFalse(event.presentation.isEnabled)
        assertTrue(event.presentation.isVisible)
        assertEquals("Core v1.2.3 • Architecture: darwin-arm64", event.presentation.text)
    }

    fun `test local config action says open when target exists`() {
        rpc.localConfigPath = "/test/.neo/neo.jsonc"
        rpc.localConfigDisplayPath = "~/.neo/neo.jsonc"
        rpc.localConfigExists = true
        service().localConfig["/test"] = ConfigTargetDto("/test/.neo/neo.jsonc", "~/.neo/neo.jsonc", true)
        val action = OpenLocalConfigAction()
        val event = event(action, workspace = workspace("/test"))

        update(action, event)

        assertTrue(event.presentation.isEnabled)
        assertEquals("Open: local ~/.neo/neo.jsonc", event.presentation.text)
        assertEquals(0, rpc.localConfigPathCalls)
    }

    fun `test local config action says create when target is missing`() {
        rpc.localConfigPath = "/test/.neo/neo.jsonc"
        rpc.localConfigDisplayPath = "~/.neo/neo.jsonc"
        rpc.localConfigExists = false
        service().localConfig["/test"] = ConfigTargetDto("/test/.neo/neo.jsonc", "~/.neo/neo.jsonc", false)
        val action = OpenLocalConfigAction()
        val event = event(action, workspace = workspace("/test"))

        update(action, event)

        assertTrue(event.presentation.isEnabled)
        assertEquals("Create: local ~/.neo/neo.jsonc", event.presentation.text)
        assertEquals(0, rpc.localConfigPathCalls)
    }

    fun `test local config action refreshes missing target in background`() {
        rpc.localConfigPath = "/test/.neo/neo.jsonc"
        rpc.localConfigDisplayPath = "/test/.neo/neo.jsonc"
        rpc.localConfigExists = true
        val call = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        rpc.beforeLocalConfigTarget = {
            call.complete(Unit)
            gate.await()
        }
        val action = OpenLocalConfigAction()
        val event = event(action, workspace = workspace("/test"))

        update(action, event)

        assertTrue(event.presentation.isEnabled)
        assertEquals("Open: local ...", event.presentation.text)
        await(call)
        assertEquals(1, rpc.localConfigPathCalls)

        gate.complete(Unit)
        service().localConfig["/test"] = ConfigTargetDto("/test/.neo/neo.jsonc", "/test/.neo/neo.jsonc", true)

        val next = event(action, workspace = workspace("/test"))
        update(action, next)

        assertEquals("Open: local /test/.neo/neo.jsonc", next.presentation.text)
    }

    fun `test local config action dedupes in flight refresh`() {
        val gate = CompletableDeferred<Unit>()
        val call = CompletableDeferred<Unit>()
        val action = OpenLocalConfigAction()
        rpc.beforeLocalConfigTarget = {
            call.complete(Unit)
            gate.await()
        }

        update(action, event(action, workspace = workspace("/test")))
        await(call)
        update(action, event(action, workspace = workspace("/test")))

        assertEquals(1, rpc.localConfigPathCalls)

        gate.complete(Unit)
    }

    fun `test global config action says open when target exists`() {
        rpc.globalConfigPath = "/config/neo.jsonc"
        rpc.globalConfigDisplayPath = "~/.config/neo/neo.jsonc"
        rpc.globalConfigExists = true
        cacheGlobal(ConfigTargetDto("/config/neo.jsonc", "~/.config/neo/neo.jsonc", true))
        val action = OpenGlobalConfigAction()
        val event = event(action)

        update(action, event)

        assertEquals("Open: global ~/.config/neo/neo.jsonc", event.presentation.text)
        assertEquals(0, rpc.globalConfigPathCalls)
    }

    fun `test global config action says create when target is missing`() {
        rpc.globalConfigPath = "/config/neo.jsonc"
        rpc.globalConfigDisplayPath = "~/.config/neo/neo.jsonc"
        rpc.globalConfigExists = false
        cacheGlobal(ConfigTargetDto("/config/neo.jsonc", "~/.config/neo/neo.jsonc", false))
        val action = OpenGlobalConfigAction()
        val event = event(action)

        update(action, event)

        assertEquals("Create: global ~/.config/neo/neo.jsonc", event.presentation.text)
        assertEquals(0, rpc.globalConfigPathCalls)
    }

    fun `test global config action refreshes missing target in background`() {
        rpc.globalConfigPath = "/config/neo.jsonc"
        rpc.globalConfigDisplayPath = "/config/neo.jsonc"
        rpc.globalConfigExists = true
        val call = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        rpc.beforeGlobalConfigTarget = {
            call.complete(Unit)
            gate.await()
        }
        val action = OpenGlobalConfigAction()
        val event = event(action)

        update(action, event)

        assertEquals("Open: global ...", event.presentation.text)
        await(call)
        assertEquals(1, rpc.globalConfigPathCalls)

        gate.complete(Unit)
        cacheGlobal(ConfigTargetDto("/config/neo.jsonc", "/config/neo.jsonc", true))

        val next = event(action)
        update(action, next)

        assertEquals("Open: global /config/neo.jsonc", next.presentation.text)
    }

    fun `test global config action dedupes in flight refresh`() {
        val gate = CompletableDeferred<Unit>()
        val call = CompletableDeferred<Unit>()
        rpc.beforeGlobalConfigTarget = {
            call.complete(Unit)
            gate.await()
        }
        val action = OpenGlobalConfigAction()

        update(action, event(action))
        await(call)
        update(action, event(action))

        assertEquals(1, rpc.globalConfigPathCalls)

        gate.complete(Unit)
    }

    fun `test local config action disables without directory`() {
        val action = OpenLocalConfigAction()
        val event = event(action)

        update(action, event)

        assertFalse(event.presentation.isEnabled)
        assertEquals(0, rpc.localConfigPathCalls)
    }

    fun `test settings popup group updates recursively in background`() {
        val group = DefaultActionGroup()
        val wrapped = NeoSettingsAction.popupGroup(group)

        assertEquals(ActionUpdateThread.BGT, wrapped.actionUpdateThread)
    }

    fun `test settings action prewarms config targets`() {
        val action = NeoSettingsAction()

        runBlocking {
            NeoSettingsAction.refreshConfigTargets(event(action, workspace = workspace("/test")), service()).forEach { it.join() }
        }

        assertEquals(1, rpc.localConfigPathCalls)
        assertEquals(1, rpc.globalConfigPathCalls)
    }

    fun `test workspace creation prewarms config targets`() {
        val local = CompletableDeferred<Unit>()
        val global = CompletableDeferred<Unit>()
        rpc.beforeLocalConfigTarget = { local.complete(Unit) }
        rpc.beforeGlobalConfigTarget = { global.complete(Unit) }

        service().workspace("/test")

        await(local)
        await(global)
        assertEquals(1, rpc.localConfigPathCalls)
        assertEquals(1, rpc.globalConfigPathCalls)
    }

    private fun event(action: AnAction, workspace: Workspace? = null, place: String = ""): AnActionEvent {
        val presentation = Presentation().apply { copyFrom(action.templatePresentation) }
        presentation.isEnabled = false
        return AnActionEvent.createFromDataContext(place, presentation, context(workspace))
    }

    private fun update(action: AnAction, event: AnActionEvent) {
        ApplicationManager.getApplication().executeOnPooledThread {
            ActionUtil.updateAction(action, event)
        }.get()
    }

    private fun await(signal: CompletableDeferred<Unit>) = runBlocking {
        withTimeout(5_000) { signal.await() }
    }

    private fun service(): NeoWorkspaceService = ApplicationManager.getApplication().getService(NeoWorkspaceService::class.java)

    private fun app(): NeoAppService = ApplicationManager.getApplication().getService(NeoAppService::class.java)

    private fun cacheGlobal(target: ConfigTargetDto) {
        val field = NeoWorkspaceService::class.java.getDeclaredField("globalConfig")
        field.isAccessible = true
        field.set(service(), target)
    }

    private fun context(workspace: Workspace?): DataContext {
        return DataContext { id ->
            when (id) {
                SessionManager.WORKSPACE_KEY.name -> workspace
                CommonDataKeys.PROJECT.name -> project.takeIf { workspace != null }
                else -> null
            }
        }
    }

    private fun workspace(dir: String): Workspace {
        return Workspace(
            dir,
            MutableStateFlow(NeoWorkspaceStateDto(NeoWorkspaceStatusDto.READY)),
            reload = {},
        )
    }
}
