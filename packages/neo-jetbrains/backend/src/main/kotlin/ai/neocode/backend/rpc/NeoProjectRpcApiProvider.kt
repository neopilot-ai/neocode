@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.rpc.NeoWorkspaceRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class NeoProjectRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<NeoWorkspaceRpcApi>()) {
            NeoWorkspaceRpcApiImpl()
        }
    }
}
