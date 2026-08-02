package ai.neocode.backend.rpc

import ai.neocode.backend.app.LoadError
import ai.neocode.backend.workspace.AgentData
import ai.neocode.backend.workspace.AgentInfo
import ai.neocode.backend.workspace.CommandInfo
import ai.neocode.backend.workspace.NeoWorkspaceLoadProgress
import ai.neocode.backend.workspace.ModelInfo
import ai.neocode.backend.workspace.ProviderData
import ai.neocode.backend.workspace.ProviderInfo
import ai.neocode.backend.workspace.SkillInfo
import ai.neocode.rpc.dto.ModelAutoRoutingDto
import ai.neocode.rpc.dto.ModelCacheCostDto
import ai.neocode.rpc.dto.ModelCapabilitiesDto
import ai.neocode.rpc.dto.ModelCostDto
import ai.neocode.rpc.dto.AgentDto
import ai.neocode.rpc.dto.AgentsDto
import ai.neocode.rpc.dto.CommandDto
import ai.neocode.rpc.dto.NeoWorkspaceLoadProgressDto
import ai.neocode.rpc.dto.LoadErrorDto
import ai.neocode.rpc.dto.ModelDto
import ai.neocode.rpc.dto.ModelInputCapabilitiesDto
import ai.neocode.rpc.dto.ModelLimitDto
import ai.neocode.rpc.dto.ModelOptionsDto
import ai.neocode.rpc.dto.ModelTerminalBenchDto
import ai.neocode.rpc.dto.ProviderDto
import ai.neocode.rpc.dto.ProvidersDto
import ai.neocode.rpc.dto.SkillDto

internal object NeoWorkspaceDtoMapper {
    fun error(e: LoadError) = LoadErrorDto(
        resource = e.resource,
        status = e.status,
        detail = e.detail,
    )

    fun progress(p: NeoWorkspaceLoadProgress) = NeoWorkspaceLoadProgressDto(
        providers = p.providers,
        agents = p.agents,
        commands = p.commands,
        skills = p.skills,
    )

    fun providers(d: ProviderData) = ProvidersDto(
        providers = d.providers.map(::provider),
        connected = d.connected,
        defaults = d.defaults,
    )

    fun agents(d: AgentData) = AgentsDto(
        agents = d.agents.map(::agent),
        all = d.all.map(::agent),
        default = d.default,
    )

    fun command(c: CommandInfo) = CommandDto(
        name = c.name,
        description = c.description,
        source = c.source,
        hints = c.hints,
    )

    fun skill(s: SkillInfo) = SkillDto(
        name = s.name,
        description = s.description,
        location = s.location,
    )

    private fun provider(p: ProviderInfo) = ProviderDto(
        id = p.id,
        name = p.name,
        source = p.source,
        models = p.models.mapValues { (_, m) -> model(m) },
    )

    private fun model(m: ModelInfo) = ModelDto(
        id = m.id,
        name = m.name,
        inputPrice = m.inputPrice,
        outputPrice = m.outputPrice,
        contextLength = m.contextLength,
        releaseDate = m.releaseDate,
        latest = m.latest,
        attachment = m.attachment,
        reasoning = m.reasoning,
        temperature = m.temperature,
        toolCall = m.toolCall,
        free = m.free,
        byok = m.byok,
        status = m.status,
        recommendedIndex = m.recommendedIndex,
        variants = m.variants,
        limit = m.limit?.let { ModelLimitDto(it.context, it.input, it.output) },
        cost = m.cost?.let { cost ->
            ModelCostDto(
                input = cost.input,
                output = cost.output,
                cache = cost.cache?.let { ModelCacheCostDto(it.read, it.write) },
            )
        },
        capabilities = m.capabilities?.let { cap ->
            ModelCapabilitiesDto(
                reasoning = cap.reasoning,
                input = cap.input?.let { ModelInputCapabilitiesDto(it.text, it.image, it.audio, it.video, it.pdf) },
            )
        },
        options = m.options?.let { ModelOptionsDto(it.description) },
        autoRouting = m.autoRouting?.let { ModelAutoRoutingDto(it.models) },
        terminalBench = m.terminalBench?.let { ModelTerminalBenchDto(it.overallScore, it.avgAttemptCostUsd) },
        mayTrainOnYourPrompts = m.mayTrainOnYourPrompts,
    )

    private fun agent(a: AgentInfo) = AgentDto(
        name = a.name,
        displayName = a.displayName,
        description = a.description,
        mode = a.mode,
        native = a.native,
        hidden = a.hidden,
        color = a.color,
        deprecated = a.deprecated,
    )
}
