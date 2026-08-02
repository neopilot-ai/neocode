@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.backend.app.NeoBackendAppService
import ai.neocode.backend.migration.NeoBackendLegacyMigrationStoreService
import ai.neocode.backend.migration.LegacyMigrationResultItem
import ai.neocode.backend.migration.LegacyMigrationSink
import ai.neocode.backend.migration.LegacyMigrationStatus
import ai.neocode.backend.migration.MigrationItemCategory
import ai.neocode.backend.migration.MigrationItemStatus
import ai.neocode.backend.migration.materializeLegacyMigrationSource
import ai.neocode.rpc.NeoMigrationRpcApi
import ai.neocode.rpc.dto.LegacyCleanupReportDto
import ai.neocode.rpc.dto.LegacyCleanupTargetsDto
import ai.neocode.rpc.dto.LegacyMigrationDetectionDto
import ai.neocode.rpc.dto.LegacyMigrationEventDto
import ai.neocode.rpc.dto.LegacyMigrationSelectionsDto
import ai.neocode.rpc.dto.LegacyMigrationStatusDto
import ai.neocode.backend.app.NeoBackendMigrationManager
import ai.neocode.log.NeoLog
import com.intellij.openapi.components.service
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.trySendBlocking
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.withContext

class NeoMigrationRpcApiImpl : NeoMigrationRpcApi {

    companion object {
        private val LOG = NeoLog.create(NeoMigrationRpcApiImpl::class.java)
    }

    private val app: NeoBackendAppService get() = service()
    private val storeService: NeoBackendLegacyMigrationStoreService get() = service()

    private fun manager(): NeoBackendMigrationManager {
        val http = app.http ?: throw IllegalStateException("Not connected")
        val port = app.port
        return NeoBackendMigrationManager(http, port)
    }

    override suspend fun status(): LegacyMigrationStatusDto? {
        val status = withContext(Dispatchers.IO) { storeService.status() } ?: return null
        LOG.info("Migration RPC status: status=$status")
        return MigrationRpcMapper.toDto(status)
    }

    override suspend fun resetStatus(): Boolean {
        val ok = withContext(Dispatchers.IO) { storeService.resetStatus() }
        if (ok) app.resetMigrationOfferForRerun()
        LOG.info("Migration RPC resetStatus: ok=$ok")
        return ok
    }

    override suspend fun detect(): LegacyMigrationDetectionDto {
        LOG.info("Migration RPC detect: started")
        val mgr = manager()
        val source = storeService.resolveSource(includeFile = app.forceMigrationRequested())
        val store = source.store
        val detection = withContext(Dispatchers.IO) { mgr.detect(store) }
        LOG.info("Migration RPC detect: completed hasData=${detection.hasData} providers=${detection.providers.size} mcp=${detection.mcpServers.size} modes=${detection.customModes.size} sessions=${detection.sessions.size}")
        return MigrationRpcMapper.toDto(detection)
    }

    override suspend fun migrate(selections: LegacyMigrationSelectionsDto): Flow<LegacyMigrationEventDto> {
        LOG.info("Migration RPC migrate: starting ${selectionSummary(selections)}")
        val mgr = manager()
        val domainSelections = MigrationRpcMapper.fromDto(selections)
        val source = withContext(Dispatchers.IO) { storeService.resolveSource(includeFile = app.forceMigrationRequested()) }
        return channelFlow {
            withContext(Dispatchers.IO) {
                val ids = domainSelections.sessions.map { it.id }.toSet()
                val store = materializeLegacyMigrationSource(source, LOG, ids)
                val sink = object : LegacyMigrationSink {
                    override fun item(progress: ai.neocode.backend.migration.LegacyMigrationItemProgress) {
                        LOG.info("Migration RPC item: item=${progress.item} status=${progress.status} message=${progress.message}")
                        trySendBlocking(LegacyMigrationEventDto.Item(MigrationRpcMapper.toDto(progress)))
                    }
                    override fun session(progress: ai.neocode.backend.migration.LegacyMigrationSessionProgress) {
                        LOG.info("Migration RPC session: phase=${progress.phase} session=${progress.session?.id} error=${progress.error}")
                        trySendBlocking(LegacyMigrationEventDto.Session(MigrationRpcMapper.toDto(progress)))
                    }
                }
                val report = runCatching {
                    mgr.migrate(store, domainSelections, sink)
                }.getOrElse { e ->
                    val msg = e.message ?: "Migration failed"
                    LOG.warn("Migration RPC migrate: failed message=$msg", e)
                    val errItem = LegacyMigrationResultItem(
                        item = "Migration",
                        category = MigrationItemCategory.settings,
                        status = MigrationItemStatus.error,
                        message = msg,
                    )
                    trySendBlocking(LegacyMigrationEventDto.Complete(listOf(MigrationRpcMapper.toDto(errItem))))
                    return@withContext
                }
                LOG.info("Migration RPC migrate: complete items=${report.items.size} errors=${report.items.count { it.status == MigrationItemStatus.error }}")
                trySendBlocking(LegacyMigrationEventDto.Complete(report.items.map(MigrationRpcMapper::toDto)))
            }
        }
    }

    override suspend fun skip() {
        LOG.info("Migration RPC skip: marking skipped")
        withContext(Dispatchers.IO) {
            storeService.markStatus(LegacyMigrationStatus.Skipped)
        }
        app.resumeAfterMigration()
        LOG.info("Migration RPC skip: resumed app load")
    }

    override suspend fun resume() {
        LOG.info("Migration RPC resume: resuming app load without marking migration completed")
        app.resumeAfterMigration()
        LOG.info("Migration RPC resume: resumed app load")
    }

    override suspend fun finalize(status: LegacyMigrationStatusDto) {
        LOG.info("Migration RPC finalize: status=$status")
        val domain = MigrationRpcMapper.fromDto(status)
        if (domain != LegacyMigrationStatus.Skipped) {
            withContext(Dispatchers.IO) { storeService.markStatus(domain) }
        }
        app.resumeAfterMigration()
        LOG.info("Migration RPC finalize: resumed app load")
    }

    override suspend fun cleanup(targets: LegacyCleanupTargetsDto): LegacyCleanupReportDto {
        LOG.info("Migration RPC cleanup: providerProfiles=${targets.providerProfiles} mcp=${targets.mcpSettings} modes=${targets.customModes} state=${targets.globalState} history=${targets.taskHistory} file=${targets.legacySettingsFile}")
        val mgr = manager()
        val store = storeService.store()
        val report = withContext(Dispatchers.IO) { mgr.cleanup(store, MigrationRpcMapper.fromDto(targets)) }
        LOG.info("Migration RPC cleanup: cleaned=${report.cleaned.size} errors=${report.errors.size}")
        return MigrationRpcMapper.toDto(report)
    }

    private fun selectionSummary(selections: LegacyMigrationSelectionsDto): String =
        "providers=${selections.providers.size} mcp=${selections.mcpServers.size} modes=${selections.customModes.size} sessions=${selections.sessions.size} model=${selections.defaultModel} settings=true keepFile=${selections.keepLegacySettingsFile}"
}
