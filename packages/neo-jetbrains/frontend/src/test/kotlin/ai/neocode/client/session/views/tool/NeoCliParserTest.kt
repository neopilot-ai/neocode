package ai.neocode.client.session.views.tool

import ai.neocode.cli.NeoCliParser
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class NeoCliParserTest {
    @Test
    fun `tag extracts trimmed tool xml value`() {
        val text = """
            <path>
              /tmp/example.txt
            </path>
            <type>file</type>
        """.trimIndent()

        assertEquals("/tmp/example.txt", NeoCliParser.tag(text, "path"))
        assertEquals("file", NeoCliParser.tag(text, "type"))
    }

    @Test
    fun `tag returns null for blank or missing value`() {
        assertNull(NeoCliParser.tag("<path>   </path>", "path"))
        assertNull(NeoCliParser.tag("<type>file</type>", "path"))
    }
}
