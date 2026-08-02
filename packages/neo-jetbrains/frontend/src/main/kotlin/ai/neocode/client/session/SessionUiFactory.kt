package ai.neocode.client.session

import ai.neocode.client.app.NeoAppService
import ai.neocode.client.app.NeoSessionService
import ai.neocode.client.app.Workspace
import ai.neocode.client.util.UiTimerSource
import ai.neocode.client.util.UiTimers
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob

@Service(Service.Level.APP)
class SessionUiFactory(
    private val cs: CoroutineScope,
) {
    fun create(
        project: Project,
        workspace: Workspace,
        manager: SessionManager,
        ref: SessionRef? = null,
        timers: UiTimerSource = UiTimers,
    ): SessionUi = SessionUi(
        project = project,
        workspace = workspace,
        sessions = project.service<NeoSessionService>(),
        app = service<NeoAppService>(),
        cs = scope(),
        ref = ref,
        manager = manager,
        timers = timers,
    )

    fun scope(): CoroutineScope {
        val parent = cs.coroutineContext[Job]
        return CoroutineScope(cs.coroutineContext + SupervisorJob(parent))
    }
}
