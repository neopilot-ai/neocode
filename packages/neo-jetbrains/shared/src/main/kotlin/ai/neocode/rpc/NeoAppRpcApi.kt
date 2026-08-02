package ai.neocode.rpc

import ai.neocode.rpc.dto.DeviceAuthDto
import ai.neocode.rpc.dto.ConfigPatchDto
import ai.neocode.rpc.dto.HealthDto
import ai.neocode.rpc.dto.NeoAppStateDto
import ai.neocode.rpc.dto.ModelFavoriteUpdateDto
import ai.neocode.rpc.dto.ModelSelectionUpdateDto
import ai.neocode.rpc.dto.ModelStateDto
import ai.neocode.rpc.dto.ModelVariantUpdateDto
import ai.neocode.rpc.dto.ProfileDto
import ai.neocode.rpc.dto.TelemetryCaptureDto
import com.intellij.platform.rpc.RemoteApiProviderService
import fleet.rpc.RemoteApi
import fleet.rpc.Rpc
import fleet.rpc.remoteApiDescriptor
import kotlinx.coroutines.flow.Flow

/**
 * App-level RPC API exposed from backend to frontend.
 *
 * All operations are project-neutral — the CLI backend runs once
 * per application, not per project.
 */
@Rpc
interface NeoAppRpcApi : RemoteApi<Unit> {
    companion object {
        suspend fun getInstance(): NeoAppRpcApi {
            return RemoteApiProviderService.resolve(remoteApiDescriptor<NeoAppRpcApi>())
        }
    }

    /** Ensure the CLI backend is running and connected. */
    suspend fun connect()

    /** Observe app lifecycle state changes. */
    suspend fun state(): Flow<NeoAppStateDto>

    /** One-shot health check against /global/health. */
    suspend fun health(): HealthDto

    /** Pinned Core version bundled in backend resources. */
    suspend fun cliVersion(): String

    /** Core platform downloaded by the backend process. */
    suspend fun cliPlatform(): String

    /** Retry app connection or loading after a failure. */
    suspend fun retry()

    /** Kill the Core process and restart it. */
    suspend fun restart()

    /** Kill the Core process, re-download the binary, and restart. */
    suspend fun reinstall()

    /** Load persisted CLI model state such as favorites. */
    suspend fun modelState(): ModelStateDto

    /** Toggle a persisted CLI model favorite. */
    suspend fun updateModelFavorite(update: ModelFavoriteUpdateDto): ModelStateDto

    /** Persist a per-agent model selection. */
    suspend fun updateModelSelection(update: ModelSelectionUpdateDto): ModelStateDto

    /** Clear a persisted per-agent model selection. */
    suspend fun clearModelSelection(agent: String): ModelStateDto

    /** Persist a per-model reasoning variant selection. */
    suspend fun updateModelVariant(update: ModelVariantUpdateDto): ModelStateDto

    /** Patch global CLI config values. */
    suspend fun updateConfig(patch: ConfigPatchDto): NeoAppStateDto

    /** Refresh the user profile and return the latest data, or null if not logged in. */
    suspend fun refreshProfile(): ProfileDto?

    /**
     * Start the device auth login flow for Neo Gateway.
     * Returns device auth details (verification URL and code) to show in the UI.
     */
    suspend fun startLogin(directory: String?): DeviceAuthDto

    /**
     * Complete the device auth login flow. Blocks until the user completes authentication.
     * Returns the fresh profile on success, null if aborted.
     */
    suspend fun completeLogin(directory: String?): ProfileDto?

    /** Log out from Neo Gateway. */
    suspend fun logout(): Boolean

    /**
     * Switch the active account context.
     * Pass null for personal account, or an organization ID for org context.
     * Returns the updated profile, or null if not logged in.
     */
    suspend fun setOrganization(organizationId: String?): ProfileDto?

    /** Fire-and-forget behavior telemetry routed through the CLI server. */
    suspend fun captureTelemetry(capture: TelemetryCaptureDto)
}
