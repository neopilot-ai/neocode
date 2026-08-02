package ai.neocode.backend.cli

import java.util.Properties

object NeoProps {
    private val props by lazy {
        val stream = NeoProps::class.java.classLoader.getResourceAsStream("neo.properties")
            ?: throw IllegalStateException("neo.properties resource not found")
        stream.use {
            Properties().apply { load(it) }
        }
    }

    fun cliVersion(): String = props.getProperty("cli.version")
        ?: throw IllegalStateException("cli.version missing from neo.properties")

    fun pinned(): Boolean = pinned(props)

    internal fun pinned(props: Properties): Boolean = props.getProperty("cli.pinned")?.toBoolean() ?: true
}
