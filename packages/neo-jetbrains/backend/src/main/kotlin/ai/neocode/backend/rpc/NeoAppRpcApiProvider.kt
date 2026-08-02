@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.rpc.NeoAppRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class NeoAppRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<NeoAppRpcApi>()) {
            NeoAppRpcApiImpl()
        }
    }
}
