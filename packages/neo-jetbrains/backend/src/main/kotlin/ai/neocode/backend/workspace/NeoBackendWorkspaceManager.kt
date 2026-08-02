package ai.neocode.backend.workspace

import ai.neocode.backend.app.NeoAppState
import ai.neocode.backend.app.NeoBackendSessionManager
import ai.neocode.backend.app.SseEvent
import ai.neocode.log.NeoLog
import ai.neocode.jetbrains.api.client.DefaultApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.SharedFlow
import okhttp3.OkHttpClient
import java.util.concurrent.ConcurrentHashMap

/**
 * Manages [NeoBackendWorkspace] instances by directory path.
 *
 * **Not an IntelliJ service** — owned by [NeoBackendAppService] which
 * calls [start] after [NeoAppState.Ready] and [stop] on disconnect.
 *
 * Workspaces are created on demand via [get] — the first call for a
 * directory creates the workspace and triggers data loading. Subsequent
 * calls return the cached instance. Worktree directories are just
 * another path — no special handling needed.
 */
class NeoBackendWorkspaceManager(
    private val cs: CoroutineScope,
    private val sessions: NeoBackendSessionManager,
    private val log: NeoLog,
) {
    private val workspaces = ConcurrentHashMap<String, NeoBackendWorkspace>()

    private var api: DefaultApi? = null
    private var http: OkHttpClient? = null
    private var port = 0
    private var events: SharedFlow<SseEvent>? = null

    /**
     * Activate with a connected API client and SSE stream.
     * Called by [NeoBackendAppService] after [NeoAppState.Ready].
     * Clears any stale workspaces from a previous connection.
     */
    fun start(api: DefaultApi, http: OkHttpClient, port: Int, events: SharedFlow<SseEvent>) {
        stop()
        this.api = api
        this.http = http
        this.port = port
        this.events = events
        log.info("Workspace manager started")
    }

    /**
     * Deactivate all workspaces. Called by [NeoBackendAppService] on disconnect.
     */
    fun stop() {
        workspaces.values.forEach { it.stop() }
        workspaces.clear()
        api = null
        http = null
        port = 0
        events = null
        log.info("Workspace manager stopped")
    }

    /**
     * Get or create a workspace for a directory.
     * The workspace loads data immediately upon creation.
     */
    fun get(dir: String): NeoBackendWorkspace {
        val client = api ?: throw IllegalStateException("Workspace manager not started")
        val http = http ?: throw IllegalStateException("Workspace manager not started")
        val ev = events!!
        return workspaces.computeIfAbsent(dir) { d ->
            log.info("Creating workspace for $d")
            NeoBackendWorkspace(d, cs, client, http, port, ev, sessions, log).also { it.load() }
        }
    }

    /** Remove a workspace (e.g. when a worktree is deleted). */
    fun remove(dir: String) {
        workspaces.remove(dir)?.stop()
    }
}
