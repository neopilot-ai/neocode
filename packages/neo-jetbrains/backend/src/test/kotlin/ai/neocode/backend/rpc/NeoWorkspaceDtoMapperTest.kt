package ai.neocode.backend.rpc

import ai.neocode.backend.workspace.ModelInfo
import ai.neocode.backend.workspace.ModelCostInfo
import ai.neocode.backend.workspace.ModelOptionsInfo
import ai.neocode.backend.workspace.ModelTerminalBenchInfo
import ai.neocode.backend.workspace.ProviderData
import ai.neocode.backend.workspace.ProviderInfo
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NeoWorkspaceDtoMapperTest {

    @Test
    fun `providers preserve prompt training disclosure`() {
        val model = ModelInfo(
            id = "paid",
            name = "Paid",
            attachment = false,
            reasoning = false,
            temperature = false,
            toolCall = true,
            free = false,
            status = null,
            recommendedIndex = null,
            variants = emptyList(),
            limit = null,
            mayTrainOnYourPrompts = true,
        )
        val data = ProviderData(
            providers = listOf(
                ProviderInfo(
                    id = "neo",
                    name = "Neo",
                    source = "api",
                    models = mapOf(model.id to model),
                ),
            ),
            connected = listOf("neo"),
            defaults = emptyMap(),
        )

        val result = NeoWorkspaceDtoMapper.providers(data)

        assertTrue(result.providers.single().models.getValue("paid").mayTrainOnYourPrompts)
    }

    @Test
    fun `providers preserve model preview metadata`() {
        val model = ModelInfo(
            id = "auto",
            name = "Auto",
            inputPrice = 0.1,
            outputPrice = 0.2,
            contextLength = 128000,
            releaseDate = "2026-06-01",
            latest = true,
            attachment = false,
            reasoning = true,
            temperature = false,
            toolCall = true,
            free = false,
            status = null,
            recommendedIndex = null,
            variants = emptyList(),
            limit = null,
            cost = ModelCostInfo(0.1, 0.2),
            options = ModelOptionsInfo("Preview text"),
            terminalBench = ModelTerminalBenchInfo(0.5, 2.0),
        )
        val data = ProviderData(
            providers = listOf(ProviderInfo("neo", "Neo", "api", mapOf(model.id to model))),
            connected = listOf("neo"),
            defaults = emptyMap(),
        )

        val result = NeoWorkspaceDtoMapper.providers(data).providers.single().models.getValue("auto")

        assertEquals(0.1, result.inputPrice)
        assertEquals(0.2, result.outputPrice)
        assertEquals(128000L, result.contextLength)
        assertEquals("2026-06-01", result.releaseDate)
        assertEquals(true, result.latest)
        assertEquals(0.1, result.cost?.input)
        assertEquals("Preview text", result.options?.description)
        assertEquals(0.5, result.terminalBench?.overallScore)
    }
}
