@file:Suppress("UnstableApiUsage")

package ai.neocode.backend.rpc

import ai.neocode.rpc.NeoMigrationRpcApi
import com.intellij.platform.rpc.backend.RemoteApiProvider
import fleet.rpc.remoteApiDescriptor

internal class NeoMigrationRpcApiProvider : RemoteApiProvider {
    override fun RemoteApiProvider.Sink.remoteApis() {
        remoteApi(remoteApiDescriptor<NeoMigrationRpcApi>()) {
            NeoMigrationRpcApiImpl()
        }
    }
}
