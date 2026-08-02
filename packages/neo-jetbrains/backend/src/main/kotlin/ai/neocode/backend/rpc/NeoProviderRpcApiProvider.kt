@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.rpc.NeoProviderRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class NeoProviderRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<NeoProviderRpcApi>()) {
            NeoProviderRpcApiImpl()
        }
    }
}
