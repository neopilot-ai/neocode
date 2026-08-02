package ai.neocode.backend.cli

import com.intellij.openapi.application.PathManager
import com.intellij.openapi.util.SystemInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStream
import java.io.OutputStream
import java.util.zip.ZipInputStream

object NeoRepoCli {
    suspend fun extract(force: Boolean): File = extract(
        force = force,
        root = File(PathManager.getSystemPath(), "neo/repo-cli"),
        source = {
            NeoRepoCli::class.java.classLoader.getResourceAsStream("neo-cli.zip")
                ?: throw IllegalStateException("neo-cli.zip resource not found; rebuild with neo.cli.pinned=false")
        },
    )

    internal suspend fun extract(force: Boolean, root: File, source: () -> InputStream): File = withContext(Dispatchers.IO) {
        val exe = File(root, "bin/${NeoCliPlatform.exe()}")
        val done = File(root, ".complete")
        if (!force && done.isFile && exe.isFile) {
            if (!SystemInfo.isWindows) exe.setExecutable(true)
            return@withContext exe
        }

        if (root.exists() && !root.deleteRecursively()) {
            throw IllegalStateException("Failed to delete local repo CLI under ${root.absolutePath}")
        }
        if (!root.isDirectory && !root.mkdirs()) {
            throw IllegalStateException("Failed to create local repo CLI directory ${root.absolutePath}")
        }

        source().use { input ->
            ZipInputStream(input.buffered()).use { zip ->
                while (true) {
                    val entry = zip.nextEntry ?: break
                    write(root, entry.name, entry.isDirectory) { out -> zip.copyTo(out) }
                    zip.closeEntry()
                }
            }
        }

        if (!exe.isFile) throw IllegalStateException("Local repo CLI archive did not contain bin/${NeoCliPlatform.exe()}")
        if (!SystemInfo.isWindows) exe.setExecutable(true)
        done.writeText("ok\n")
        return@withContext exe
    }

    private fun write(dir: File, name: String, directory: Boolean, copy: (OutputStream) -> Unit) {
        val path = if (name.startsWith("bin/")) name else "bin/$name"
        val target = File(dir, path).canonicalFile
        val base = dir.canonicalFile
        if (target != base && !target.path.startsWith(base.path + File.separator)) {
            throw IllegalStateException("Archive entry escapes target directory: $name")
        }
        if (directory) {
            target.mkdirs()
            return
        }
        target.parentFile.mkdirs()
        target.outputStream().use(copy)
        if (!SystemInfo.isWindows && (target.name == "neo" || target.name == "bwrap")) {
            target.setExecutable(true)
        }
    }
}
