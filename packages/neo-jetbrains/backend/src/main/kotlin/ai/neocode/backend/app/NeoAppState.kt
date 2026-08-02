package ai.neocode.backend.app

import ai.neocode.jetbrains.api.model.NeoNotifications200ResponseInner
import ai.neocode.jetbrains.api.model.NeoProfile200Response
import ai.neocode.backend.migration.LegacyMigrationDetection
import ai.neocode.rpc.dto.ConfigDto

/**
 * Full application lifecycle state, combining CLI transport connection
 * status with data-loading progress.
 *
 * [ConnectionState] stays internal to [NeoConnectionService] for the
 * transport layer. This sealed class is what the frontend observes.
 */
sealed class NeoAppState {
    data object Disconnected : NeoAppState()
    data class Downloading(val percent: Int, val version: String, val platform: String) : NeoAppState()
    data object Connecting : NeoAppState()
    data class Loading(val progress: LoadProgress) : NeoAppState()
    data class MigrationRequired(val detection: LegacyMigrationDetection) : NeoAppState()
    data class Ready(val data: AppData, val rev: Long = 0) : NeoAppState()
    data class Error(val message: String, val errors: List<LoadError> = emptyList()) : NeoAppState()
}

/**
 * Tracks which global data fetches have completed during the [NeoAppState.Loading] phase.
 */
data class LoadProgress(
    val config: Boolean = false,
    val notifications: Boolean = false,
    val profile: ProfileResult = ProfileResult.PENDING,
)

/** Outcome of the profile fetch. */
enum class ProfileResult { PENDING, LOADED, NOT_LOGGED_IN }

/**
 * Error detail for a single resource that failed to load.
 */
data class LoadError(
    val resource: String,
    val status: Int? = null,
    val detail: String? = null,
)

data class ConfigWarning(
    val path: String,
    val message: String,
    val detail: String? = null,
)

/**
 * All global data that has been successfully loaded.
 * Present only in [NeoAppState.Ready].
 */
data class AppData(
    val profile: NeoProfile200Response?,
    val config: ConfigDto,
    val notifications: List<NeoNotifications200ResponseInner>,
    val warnings: List<ConfigWarning> = emptyList(),
)
