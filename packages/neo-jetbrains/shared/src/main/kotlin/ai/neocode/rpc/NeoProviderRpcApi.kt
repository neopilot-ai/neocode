@file:Suppress("UnstableApiUsage")

package ai.neocode.rpc

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
import com.intellij.platform.rpc.RemoteApiProviderService
import fleet.rpc.RemoteApi
import fleet.rpc.Rpc
import fleet.rpc.remoteApiDescriptor

@Rpc
interface NeoProviderRpcApi : RemoteApi<Unit> {
    companion object {
        suspend fun getInstance(): NeoProviderRpcApi {
            return RemoteApiProviderService.resolve(remoteApiDescriptor<NeoProviderRpcApi>())
        }
    }

    suspend fun state(directory: String): ProviderSettingsDto
    suspend fun connect(input: ProviderConnectDto): ProviderActionResultDto
    suspend fun authorize(input: ProviderOAuthAuthorizeDto): ProviderOAuthReadyDto
    suspend fun callback(input: ProviderOAuthCallbackDto): ProviderActionResultDto
    suspend fun disconnect(input: ProviderDisconnectDto): ProviderActionResultDto
    suspend fun enable(input: ProviderEnableDto): ProviderActionResultDto
    suspend fun saveCustom(input: CustomProviderSaveDto): ProviderActionResultDto
    suspend fun fetchCustomModels(input: CustomModelFetchDto): CustomModelFetchResultDto
}
