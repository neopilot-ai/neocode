@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.rpc.NeoSessionRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class NeoSessionRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<NeoSessionRpcApi>()) {
            NeoSessionRpcApiImpl()
        }
    }
}
