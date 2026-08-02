package ai.neocode.client.vfs

import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import java.util.concurrent.ConcurrentHashMap

@Service(Service.Level.APP)
class NeoEditorKindRegistry {
    private val kinds = ConcurrentHashMap<String, NeoEditorKind>()

    fun register(kind: NeoEditorKind) {
        kinds[kind.id] = kind
        service<NeoVirtualFileKindRegistry>().register(kind)
    }

    fun unregister(id: String) {
        kinds.remove(id)
        service<NeoVirtualFileKindRegistry>().unregister(id)
    }

    fun clear() {
        kinds.keys.forEach { id -> unregister(id) }
    }

    fun get(id: String): NeoEditorKind? = kinds[id]
}
