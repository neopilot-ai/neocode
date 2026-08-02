package ai.neocode.client.vfs

import com.intellij.openapi.components.Service
import java.util.concurrent.ConcurrentHashMap

@Service(Service.Level.APP)
class NeoVirtualFileKindRegistry {
    private val kinds = ConcurrentHashMap<String, NeoVirtualFileKind>()

    fun register(kind: NeoVirtualFileKind) {
        kinds[kind.id] = kind
    }

    fun unregister(id: String) {
        kinds.remove(id)
    }

    fun clear() {
        kinds.clear()
    }

    fun get(id: String): NeoVirtualFileKind? = kinds[id]
}
