package ai.neocode.backend.cli

import kotlin.test.Test
import kotlin.test.assertEquals
import java.io.File
import java.nio.file.Files

class NeoCliConfigPathTest {

    @Test
    fun `neo config dir overrides XDG config home`() {
        val dir = Files.createTempDirectory("neo-config-dir").toFile()
        val xdg = Files.createTempDirectory("neo-xdg-config").toFile()

        val path = NeoCliConfigPath.resolve(
            mapOf(
                "NEO_CONFIG_DIR" to dir.absolutePath,
                "XDG_CONFIG_HOME" to xdg.absolutePath,
            ),
        )

        assertEquals(dir.absoluteFile, path.absoluteFile)
    }

    @Test
    fun `XDG config home resolves to neo subdirectory`() {
        val xdg = Files.createTempDirectory("neo-xdg-config").toFile()

        val path = NeoCliConfigPath.resolve(mapOf("XDG_CONFIG_HOME" to xdg.absolutePath))

        assertEquals(File(xdg, "neo").absoluteFile, path.absoluteFile)
    }

    @Test
    fun `default config home matches CLI xdg fallback`() {
        val home = Files.createTempDirectory("neo-home").toFile()

        val path = NeoCliConfigPath.resolve(mapOf("HOME" to home.absolutePath))

        assertEquals(File(File(home, ".config"), "neo").absoluteFile, path.absoluteFile)
    }

    @Test
    fun `USERPROFILE backs up HOME for default config home`() {
        val home = Files.createTempDirectory("neo-userprofile").toFile()

        val path = NeoCliConfigPath.resolve(
            mapOf(
                "HOME" to "",
                "USERPROFILE" to home.absolutePath,
            ),
        )

        assertEquals(File(File(home, ".config"), "neo").absoluteFile, path.absoluteFile)
    }

    @Test
    fun `blank config env values are ignored`() {
        val home = Files.createTempDirectory("neo-home").toFile()

        val path = NeoCliConfigPath.resolve(
            mapOf(
                "NEO_CONFIG_DIR" to " ",
                "XDG_CONFIG_HOME" to "",
                "HOME" to home.absolutePath,
            ),
        )

        assertEquals(File(File(home, ".config"), "neo").absoluteFile, path.absoluteFile)
    }

    @Test
    fun `legacy settings file resolves under global config dir`() {
        val home = Files.createTempDirectory("neo-home").toFile()

        val path = NeoCliConfigPath.legacySettingsFile(mapOf("HOME" to home.absolutePath))

        assertEquals(File(File(File(home, ".config"), "neo"), "legacy-settings.json").absoluteFile, path.absoluteFile)
    }
}
