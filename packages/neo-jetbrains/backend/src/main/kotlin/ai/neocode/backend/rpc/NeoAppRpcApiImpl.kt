@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.backend.app.NeoAppState
import ai.neocode.backend.app.NeoBackendAppService
import ai.neocode.backend.telemetry.NeoBackendTelemetry
import ai.neocode.backend.app.ConfigWarning
import ai.neocode.backend.app.LoadError
import ai.neocode.backend.app.LoadProgress
import ai.neocode.backend.app.ProfileResult
import ai.neocode.backend.cli.NeoCliPlatform
import ai.neocode.backend.cli.NeoProps
import ai.neocode.jetbrains.api.model.NeoProfile200Response
import ai.neocode.rpc.dto.ConfigPatchDto
import ai.neocode.rpc.NeoAppRpcApi
import ai.neocode.rpc.dto.ConfigWarningDto
import ai.neocode.rpc.dto.DeviceAuthDto
import ai.neocode.rpc.dto.HealthDto
import ai.neocode.rpc.dto.NeoAppStateDto
import ai.neocode.rpc.dto.NeoAppStatusDto
import ai.neocode.rpc.dto.LoadErrorDto
import ai.neocode.rpc.dto.LoadProgressDto
import ai.neocode.rpc.dto.ModelFavoriteUpdateDto
import ai.neocode.rpc.dto.ModelSelectionUpdateDto
import ai.neocode.rpc.dto.ModelStateDto
import ai.neocode.rpc.dto.ModelVariantUpdateDto
import ai.neocode.rpc.dto.ProfileBalanceDto
import ai.neocode.rpc.dto.ProfileDto
import ai.neocode.rpc.dto.ProfileNeoPassDto
import ai.neocode.rpc.dto.ProfileOrganizationDto
import ai.neocode.rpc.dto.ProfileStatusDto
import ai.neocode.rpc.dto.TelemetryCaptureDto
import com.intellij.openapi.components.service
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

/**
 * Backend implementation of [NeoAppRpcApi].
 *
 * Delegates directly to the app-level [NeoBackendAppService] —
 * no project resolution needed since all operations are app-scoped.
 */
class NeoAppRpcApiImpl : NeoAppRpcApi {

    private val app: NeoBackendAppService get() = service()

    override suspend fun connect() = app.connect()

    override suspend fun state(): Flow<NeoAppStateDto> =
        app.appState.map(::dto).distinctUntilChanged()

    override suspend fun health(): HealthDto = app.health()

    override suspend fun cliVersion(): String = NeoProps.cliVersion()

    override suspend fun cliPlatform(): String = NeoCliPlatform.current()

    override suspend fun retry() = app.retry()

    override suspend fun restart() = app.restart()

    override suspend fun reinstall() = app.reinstall()

    override suspend fun modelState(): ModelStateDto {
        app.requireReady()
        return app.models.state()
    }

    override suspend fun updateModelFavorite(update: ModelFavoriteUpdateDto): ModelStateDto {
        app.requireReady()
        return app.models.favorite(update)
    }

    override suspend fun updateModelSelection(update: ModelSelectionUpdateDto): ModelStateDto {
        app.requireReady()
        return app.models.selection(update)
    }

    override suspend fun clearModelSelection(agent: String): ModelStateDto {
        app.requireReady()
        return app.models.clear(agent)
    }

    override suspend fun updateModelVariant(update: ModelVariantUpdateDto): ModelStateDto {
        app.requireReady()
        return app.models.variant(update)
    }

    override suspend fun updateConfig(patch: ConfigPatchDto): NeoAppStateDto {
        app.requireReady()
        return appStateDto(app.updateConfig(patch))
    }

    override suspend fun refreshProfile(): ProfileDto? = app.refreshProfile()?.let(::profileDto)

    override suspend fun startLogin(directory: String?): DeviceAuthDto = app.startLogin(directory)

    override suspend fun completeLogin(directory: String?): ProfileDto? = app.completeLogin(directory)?.let(::profileDto)

    override suspend fun logout(): Boolean = app.logout()

    override suspend fun setOrganization(organizationId: String?): ProfileDto? =
        app.setOrganization(organizationId)?.let(::profileDto)

    override suspend fun captureTelemetry(capture: TelemetryCaptureDto) {
        service<NeoBackendTelemetry>().capture(app.http, app.port, capture.event, capture.properties)
    }

    private fun dto(state: NeoAppState): NeoAppStateDto =
        appStateDto(state)
}

internal fun appStateDto(state: NeoAppState): NeoAppStateDto =
    when (state) {
        NeoAppState.Disconnected -> NeoAppStateDto(NeoAppStatusDto.DISCONNECTED)
        is NeoAppState.Downloading -> NeoAppStateDto(
            status = NeoAppStatusDto.DOWNLOADING,
            downloadPercent = state.percent,
            downloadVersion = state.version,
            downloadPlatform = state.platform,
        )
        NeoAppState.Connecting -> NeoAppStateDto(NeoAppStatusDto.CONNECTING)
        is NeoAppState.Loading -> NeoAppStateDto(
            status = NeoAppStatusDto.LOADING,
            progress = progress(state.progress),
        )
        is NeoAppState.MigrationRequired -> NeoAppStateDto(
            status = NeoAppStatusDto.MIGRATION_REQUIRED,
            migration = MigrationRpcMapper.toDto(state.detection),
        )
        is NeoAppState.Ready -> NeoAppStateDto(
            status = NeoAppStatusDto.READY,
            progress = LoadProgressDto(
                config = true,
                notifications = true,
                profile = if (state.data.profile != null) ProfileStatusDto.LOADED
                    else ProfileStatusDto.NOT_LOGGED_IN,
            ),
            warnings = state.data.warnings.map(::warning),
            config = state.data.config,
            profile = state.data.profile?.let(::profileDto),
        )
        is NeoAppState.Error -> NeoAppStateDto(
            status = NeoAppStatusDto.ERROR,
            error = state.message,
            errors = state.errors.map(::error),
        )
    }

internal fun profileDto(p: NeoProfile200Response): ProfileDto = ProfileDto(
    email = p.profile.email,
    name = p.profile.name,
    organizations = p.profile.organizations.orEmpty().map { org ->
        ProfileOrganizationDto(id = org.id, name = org.name, role = org.role)
    },
    // The pinned CLI release does not expose hasPersonalAccount yet, so default to
    // showing the personal account. Flip back to p.profile.hasPersonalAccount once a
    // CLI release ships the field.
    hasPersonalAccount = true,
    balance = p.balance?.balance?.let { ProfileBalanceDto(balance = it) },
    neoPass = p.neoPass?.let {
        val base = it.currentPeriodBaseCreditsUsd ?: return@let null
        val usage = it.currentPeriodUsageUsd ?: return@let null
        val bonus = it.currentPeriodBonusCreditsUsd ?: return@let null
        ProfileNeoPassDto(
            currentPeriodBaseCreditsUsd = base,
            currentPeriodUsageUsd = usage,
            currentPeriodBonusCreditsUsd = bonus,
            nextBillingAt = it.nextBillingAt,
        )
    },
    currentOrgId = p.currentOrgId,
)

private fun progress(p: LoadProgress) = LoadProgressDto(
    config = p.config,
    notifications = p.notifications,
    profile = when (p.profile) {
        ProfileResult.PENDING -> ProfileStatusDto.PENDING
        ProfileResult.LOADED -> ProfileStatusDto.LOADED
        ProfileResult.NOT_LOGGED_IN -> ProfileStatusDto.NOT_LOGGED_IN
    },
)

private fun error(e: LoadError) = LoadErrorDto(
    resource = e.resource,
    status = e.status,
    detail = e.detail,
)

private fun warning(w: ConfigWarning) = ConfigWarningDto(
    path = w.path,
    message = w.message,
    detail = w.detail,
)
