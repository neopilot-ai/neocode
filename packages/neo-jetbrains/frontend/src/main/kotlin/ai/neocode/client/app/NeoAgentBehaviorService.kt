@file:Suppress("UnstableApiUsage")

package ai.neocode.client.app

import ai.neocode.log.NeoLog
import ai.neocode.rpc.NeoAgentBehaviorRpcApi
import ai.neocode.rpc.dto.AgentDetailDto
import ai.neocode.rpc.dto.AgentCreateDto
import ai.neocode.rpc.dto.CommandDto
import ai.neocode.rpc.dto.McpConfigDto
import ai.neocode.rpc.dto.McpServerConfigDto
import ai.neocode.rpc.dto.McpStatusDto
import ai.neocode.rpc.dto.SkillDto
import com.intellij.openapi.components.Service
import fleet.rpc.client.durable
import kotlinx.coroutines.CoroutineScope

@Service(Service.Level.APP)
class NeoAgentBehaviorService internal constructor(
    private val cs: CoroutineScope,
    private val rpc: NeoAgentBehaviorRpcApi?,
) {
    constructor(cs: CoroutineScope) : this(cs, null)

    companion object {
        private val LOG = NeoLog.create(NeoAgentBehaviorService::class.java)
    }

    private suspend fun <T> call(block: suspend NeoAgentBehaviorRpcApi.() -> T): T {
        val api = rpc
        return if (api != null) block(api) else durable { block(NeoAgentBehaviorRpcApi.getInstance()) }
    }

    suspend fun agents(directory: String): List<AgentDetailDto> = safe(emptyList()) { call { agents(directory) } }

    suspend fun skills(directory: String): List<SkillDto> = safe(emptyList()) { call { skills(directory) } }

    suspend fun commands(directory: String): List<CommandDto> = safe(emptyList()) { call { commands(directory) } }

    suspend fun mcpStatus(directory: String): List<McpStatusDto> = try {
        LOG.info("mcp status: requesting dir=$directory")
        call { mcpStatus(directory) }.also { LOG.info("mcp status: received dir=$directory count=${it.size}") }
    } catch (e: Exception) {
        LOG.warn("mcp status failed dir=$directory", e)
        emptyList()
    }

    suspend fun mcpConfig(directory: String): Map<String, McpServerConfigDto> = safe(emptyMap()) { call { mcpConfig(directory) } }

    suspend fun saveMcp(directory: String, name: String, scope: String, config: McpConfigDto?): Boolean =
        safe(false) { call { saveMcp(directory, name, scope, config) } }

    suspend fun removeSkill(directory: String, location: String): Boolean = safe(false) { call { removeSkill(directory, location) } }

    suspend fun removeAgent(directory: String, name: String): Boolean = safe(false) { call { removeAgent(directory, name) } }

    suspend fun createAgent(directory: String, input: AgentCreateDto): Boolean = safe(false) { call { createAgent(directory, input) } }

    suspend fun mcpConnect(directory: String, name: String): Boolean = safe(false) { call { mcpConnect(directory, name) } }

    suspend fun mcpDisconnect(directory: String, name: String): Boolean = safe(false) { call { mcpDisconnect(directory, name) } }

    suspend fun mcpAuthenticate(directory: String, name: String): Boolean = safe(false) { call { mcpAuthenticate(directory, name) } }

    suspend fun claudeCodeCompat(): Boolean = safe(false) { call { claudeCodeCompat() } }

    suspend fun setClaudeCodeCompat(value: Boolean): Boolean = safe(false) { call { setClaudeCodeCompat(value) } }

    private suspend fun <T> safe(fallback: T, block: suspend () -> T): T = try {
        block()
    } catch (e: Exception) {
        LOG.warn("agent behavior RPC failed", e)
        fallback
    }
}
