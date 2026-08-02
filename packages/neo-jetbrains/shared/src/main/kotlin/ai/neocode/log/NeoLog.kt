package ai.neocode.log

import ai.neocode.NeoPlugin
import com.intellij.openapi.application.ApplicationInfo
import com.intellij.openapi.application.PathManager
import com.intellij.openapi.diagnostic.Logger
import java.io.PrintWriter
import java.io.StringWriter
import java.lang.management.ManagementFactory
import java.nio.file.Files
import java.nio.file.Path
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.logging.FileHandler
import java.util.logging.Formatter
import java.util.logging.Level
import java.util.logging.LogRecord

/**
 * Logging interface for the Neo JetBrains plugin.
 *
 * In normal (non-sandbox) mode, output goes through IntelliJ's own [com.intellij.openapi.diagnostic.Logger],
 * which writes to the standard IDE log file, and to rotated `neo-dev.log.*` files inside the IDE log directory.
 *
 * In sandbox mode (i.e. when running via `./gradlew runIde`, detected via the `idea.plugin.in.sandbox.mode`
 * system property), output is written only to `neo-dev.log.*`.
 *
 * Usage:
 * ```kotlin
 * private val log = NeoLog.create(this::class.java)
 *
 * log.info("session started")
 * log.debug { "expensive: ${computeSomething()}" }  // lambda is only evaluated when debug is enabled
 * log.warn("unexpected state", exception)
 * ```
 *
 * The log level for the sandbox file can be controlled via the `neo.dev.log.level` system property
 * (DEBUG, INFO, WARN, ERROR, OFF). Defaults to INFO.
 */
interface NeoLog {
    val isDebugEnabled: Boolean
    fun debug(block: () -> String)
    fun info(msg: String)
    fun warn(msg: String, t: Throwable? = null)
    fun error(msg: String, t: Throwable? = null)

    companion object {
        fun create(cls: Class<*>): NeoLog {
            return create(cls, sandbox())
        }

        internal fun create(cls: Class<*>, sandbox: Boolean): NeoLog = logger(
            sandbox = sandbox,
            intellij = { IntellijLog(cls) },
            file = { FileLog(cls) },
        )

        internal fun logger(sandbox: Boolean, intellij: () -> NeoLog, file: () -> NeoLog): NeoLog {
            if (sandbox) return file()
            return CompositeLog(intellij(), file())
        }

        fun sandbox(): Boolean = System.getProperty("idea.plugin.in.sandbox.mode", "false").toBoolean()

        fun payload(log: NeoLog? = null): Map<String, String> = buildMap {
            put("platform", "jetbrains")
            put("client", "jetbrains")
            put("feature", "jetbrains-plugin")
            runCatching {
                val info = ApplicationInfo.getInstance()
                put("editorName", info.fullApplicationName)
                put("jetbrainsBuild", info.build.asString())
            }.onFailure { log?.info("Could not read ApplicationInfo for environment payload: ${it.message}") }
            runCatching {
                val version = NeoPlugin.version()
                if (version != null) {
                    put("pluginVersion", version)
                    put("appVersion", version)
                }
            }.onFailure { log?.info("Could not read plugin version for environment payload: ${it.message}") }
        }
    }
}

internal class IntellijLog(cls: Class<*>) : NeoLog {
    private val delegate = Logger.getInstance(cls)
    override val isDebugEnabled: Boolean
        get() = delegate.isDebugEnabled
    override fun debug(block: () -> String) {
        if (delegate.isDebugEnabled) delegate.debug(block())
    }
    override fun info(msg: String) = delegate.info(msg)
    override fun warn(msg: String, t: Throwable?) {
        if (t != null) delegate.warn(msg, t) else delegate.warn(msg)
    }
    override fun error(msg: String, t: Throwable?) {
        if (t != null) delegate.error(msg, t) else delegate.error(msg)
    }
}

internal class FileLog(cls: Class<*>) : NeoLog {
    private val name = cls.name

    companion object {
        private val level: Level by lazy { resolveLevel() }
        private const val LIMIT = 5_000_000
        private const val COUNT = 3

        private val root: java.util.logging.Logger by lazy {
            val logger = java.util.logging.Logger.getLogger("ai.neocode")
            val payload = NeoLog.payload().entries.joinToString(" ") { "${it.key}=${it.value}" }
            logger.addHandler(handler)
            logger.useParentHandlers = false
            logger.level = level
            logger.log(Level.INFO, "environment payload: $payload")
            logger
        }

        private val handler: FileHandler by lazy {
            val dir = resolveLogDir()
            val path = dir.resolve("neo-dev.log.%g")
            IntellijLog(FileLog::class.java).info("Neo diagnostic log directory: $dir")
            val h = FileHandler(path.toString(), LIMIT, COUNT, true)
            h.formatter = NeoFormatter()
            h
        }

        private fun resolveLogDir(): Path {
            val dir = PathManager.getLogDir()
            var current = dir
            var side: String? = null
            while (current.parent != null) {
                val name = current.fileName.toString()
                if (name.startsWith("log_run")) {
                    side = if (name.lowercase().contains("frontend")) "neo-frontend" else "neo-backend"
                }
                if (name == "neo.jetbrains" && side != null) {
                    val target = current.resolve(side)
                    Files.createDirectories(target)
                    return target
                }
                current = current.parent
            }
            return dir
        }

        private fun resolveLevel(): Level {
            val prop = System.getProperty("neo.dev.log.level") ?: return Level.INFO
            return when (prop.uppercase()) {
                "DEBUG" -> Level.FINE
                "INFO" -> Level.INFO
                "WARN", "WARNING" -> Level.WARNING
                "ERROR" -> Level.SEVERE
                "OFF" -> Level.OFF
                else -> Level.ALL
            }
        }
    }

    override val isDebugEnabled: Boolean
        get() = root.isLoggable(Level.FINE)

    override fun debug(block: () -> String) {
        if (root.isLoggable(Level.FINE)) root.logp(Level.FINE, name, null, block())
    }
    override fun info(msg: String) = root.logp(Level.INFO, name, null, msg)
    override fun warn(msg: String, t: Throwable?) {
        if (t != null) root.logp(Level.WARNING, name, null, msg, t) else root.logp(Level.WARNING, name, null, msg)
    }
    override fun error(msg: String, t: Throwable?) {
        if (t != null) root.logp(Level.SEVERE, name, null, msg, t) else root.logp(Level.SEVERE, name, null, msg)
    }
}

internal class NeoFormatter : Formatter() {
    private val start = ManagementFactory.getRuntimeMXBean().startTime
    private val fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss,SSS")

    override fun format(record: LogRecord): String {
        val time = Instant.ofEpochMilli(record.millis).atZone(ZoneId.systemDefault())
        val elapsed = record.millis - start
        val level = when (record.level) {
            Level.FINE -> "DEBUG"
            Level.INFO -> "INFO"
            Level.WARNING -> "WARN"
            Level.SEVERE -> "ERROR"
            else -> record.level.name
        }
        val category = record.sourceClassName ?: record.loggerName ?: "neo.dev"
        val sb = StringBuilder()
        sb.append(fmt.format(time))
        sb.append(" [")
        sb.append(elapsed.toString().padStart(8))
        sb.append("]   ")
        sb.append(level.padEnd(5))
        sb.append(" - #")
        sb.append(category)
        sb.append(" - ")
        sb.append(formatMessage(record))
        sb.append('\n')
        if (record.thrown != null) {
            val sw = StringWriter()
            record.thrown.printStackTrace(PrintWriter(sw))
            sb.append(sw)
        }
        return sb.toString()
    }
}

internal class CompositeLog(vararg val delegates: NeoLog) : NeoLog {
    override val isDebugEnabled: Boolean
        get() = delegates.any { it.isDebugEnabled }
    override fun debug(block: () -> String) {
        val active = delegates.filter { it.isDebugEnabled }
        if (active.isEmpty()) return
        val msg = block()
        active.forEach { it.debug { msg } }
    }
    override fun info(msg: String) = delegates.forEach { it.info(msg) }
    override fun warn(msg: String, t: Throwable?) = delegates.forEach { it.warn(msg, t) }
    override fun error(msg: String, t: Throwable?) = delegates.forEach { it.error(msg, t) }
}
