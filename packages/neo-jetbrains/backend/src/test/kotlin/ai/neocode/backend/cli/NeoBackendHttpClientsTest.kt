package ai.neocode.backend.cli

import ai.neocode.backend.cli.NeoBackendHttpClients
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import java.util.Base64
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NeoBackendHttpClientsTest {

    @Test
    fun `api client sends correct basic auth header`() {
        val pwd = "secret123"
        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = NeoBackendHttpClients.api(pwd)
        try {
            val request = okhttp3.Request.Builder()
                .url(server.url("/test"))
                .build()
            client.newCall(request).execute().use { response ->
                assertEquals(200, response.code)
            }

            val recorded = server.takeRequest()
            val expected = "Basic ${Base64.getEncoder().encodeToString("neo:$pwd".toByteArray())}"
            assertEquals(expected, recorded.getHeader("Authorization"))
        } finally {
            NeoBackendHttpClients.shutdown(client)
            server.shutdown()
        }
    }

    @Test
    fun `api client has no call or read timeout`() {
        val client = NeoBackendHttpClients.api("test")
        try {
            assertEquals(0, client.callTimeoutMillis)
            assertEquals(0, client.readTimeoutMillis)
        } finally {
            NeoBackendHttpClients.shutdown(client)
        }
    }

    @Test
    fun `api client has connect timeout`() {
        val client = NeoBackendHttpClients.api("test")
        try {
            assertTrue(client.connectTimeoutMillis > 0)
        } finally {
            NeoBackendHttpClients.shutdown(client)
        }
    }

    @Test
    fun `health client has short timeout`() {
        val client = NeoBackendHttpClients.health("test")
        try {
            assertEquals(3000, client.callTimeoutMillis)
            assertEquals(3000, client.connectTimeoutMillis)
        } finally {
            NeoBackendHttpClients.shutdown(client)
        }
    }

    @Test
    fun `health client sends correct basic auth header`() {
        val pwd = "healthpwd"
        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = NeoBackendHttpClients.health(pwd)
        try {
            val request = okhttp3.Request.Builder()
                .url(server.url("/global/health"))
                .build()
            client.newCall(request).execute().use { response ->
                assertEquals(200, response.code)
            }

            val recorded = server.takeRequest()
            val expected = "Basic ${Base64.getEncoder().encodeToString("neo:$pwd".toByteArray())}"
            assertEquals(expected, recorded.getHeader("Authorization"))
        } finally {
            NeoBackendHttpClients.shutdown(client)
            server.shutdown()
        }
    }

    @Test
    fun `shutdown evicts connection pool`() {
        val client = NeoBackendHttpClients.api("test")
        NeoBackendHttpClients.shutdown(client)
        assertEquals(0, client.connectionPool.connectionCount())
    }

    @Test
    fun `cli download client keeps release download timeouts`() {
        val client = NeoBackendHttpClients.cliDownload()
        try {
            assertEquals(30_000, client.connectTimeoutMillis)
            assertEquals(120_000, client.readTimeoutMillis)
            assertEquals(120_000, client.writeTimeoutMillis)
            assertEquals(0, client.callTimeoutMillis)
        } finally {
            NeoBackendHttpClients.shutdown(client)
        }
    }

    @Test
    fun `model fetch client has bounded 15 second timeouts`() {
        val client = NeoBackendHttpClients.modelFetch()
        try {
            assertEquals(15_000, client.connectTimeoutMillis)
            assertEquals(15_000, client.readTimeoutMillis)
            assertEquals(15_000, client.callTimeoutMillis)
        } finally {
            NeoBackendHttpClients.shutdown(client)
        }
    }

    @Test
    fun `bounded client applies per request timeout and preserves auth`() {
        val pwd = "boundedpwd"
        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = NeoBackendHttpClients.api(pwd)
        val bounded = NeoBackendHttpClients.bounded(client, 7)
        try {
            assertEquals(7_000, bounded.callTimeoutMillis)
            assertEquals(7_000, bounded.readTimeoutMillis)
            assertEquals(client.connectTimeoutMillis, bounded.connectTimeoutMillis)

            val request = okhttp3.Request.Builder().url(server.url("/global/config")).build()
            bounded.newCall(request).execute().use { response ->
                assertEquals(200, response.code)
            }
            val recorded = server.takeRequest()
            val expected = "Basic ${Base64.getEncoder().encodeToString("neo:$pwd".toByteArray())}"
            assertEquals(expected, recorded.getHeader("Authorization"))
        } finally {
            NeoBackendHttpClients.shutdown(client)
            server.shutdown()
        }
    }
}
