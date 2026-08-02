package ai.neocode.rpc.dto

import kotlinx.serialization.Serializable

@Serializable
data class SkillDto(
    val name: String,
    val description: String? = null,
    val location: String,
)
