@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.backend.provider.NeoBackendProviderSettingsManager
import ai.neocode.rpc.NeoProviderRpcApi
import ai.neocode.rpc.dto.CustomModelFetchDto
import ai.neocode.rpc.dto.CustomModelFetchResultDto
import ai.neocode.rpc.dto.CustomProviderSaveDto
import ai.neocode.rpc.dto.ProviderActionResultDto
import ai.neocode.rpc.dto.ProviderConnectDto
import ai.neocode.rpc.dto.ProviderDisconnectDto
import ai.neocode.rpc.dto.ProviderEnableDto
import ai.neocode.rpc.dto.ProviderOAuthAuthorizeDto
import ai.neocode.rpc.dto.ProviderOAuthCallbackDto
import ai.neocode.rpc.dto.ProviderOAuthReadyDto
import ai.neocode.rpc.dto.ProviderSettingsDto
import com.intellij.openapi.components.service
import ai.neocode.backend.app.NeoBackendAppService
import ai.neocode.log.NeoLog

internal class NeoProviderRpcApiImpl : NeoProviderRpcApi {
    companion object {
        private val LOG = NeoLog.create(NeoProviderRpcApiImpl::class.java)
    }

    private val manager: NeoBackendProviderSettingsManager
        get() = NeoBackendProviderSettingsManager(service<NeoBackendAppService>())

    override suspend fun state(directory: String): ProviderSettingsDto = logged("state dir=$directory") { manager.state(directory) }
    override suspend fun connect(input: ProviderConnectDto): ProviderActionResultDto = logged("connect provider=${input.providerId}") { manager.connect(input) }
    override suspend fun authorize(input: ProviderOAuthAuthorizeDto): ProviderOAuthReadyDto = logged("authorize provider=${input.providerId}") { manager.authorize(input) }
    override suspend fun callback(input: ProviderOAuthCallbackDto): ProviderActionResultDto = logged("callback provider=${input.providerId}") { manager.callback(input) }
    override suspend fun disconnect(input: ProviderDisconnectDto): ProviderActionResultDto = logged("disconnect provider=${input.providerId}") { manager.disconnect(input) }
    override suspend fun enable(input: ProviderEnableDto): ProviderActionResultDto = logged("enable provider=${input.providerId}") { manager.enable(input) }
    override suspend fun saveCustom(input: CustomProviderSaveDto): ProviderActionResultDto = logged("save custom provider=${input.id}") { manager.saveCustom(input) }
    override suspend fun fetchCustomModels(input: CustomModelFetchDto): CustomModelFetchResultDto = logged("fetch custom models") { manager.fetch(input) }

    private suspend fun <T> logged(name: String, block: suspend () -> T): T {
        val start = System.currentTimeMillis()
        LOG.info("provider rpc $name: start")
        return try {
            val result = block()
            LOG.info("provider rpc $name: completed durationMs=${System.currentTimeMillis() - start}")
            result
        } catch (e: Exception) {
            LOG.warn("provider rpc $name: failed durationMs=${System.currentTimeMillis() - start}", e)
            throw e
        }
    }
}
