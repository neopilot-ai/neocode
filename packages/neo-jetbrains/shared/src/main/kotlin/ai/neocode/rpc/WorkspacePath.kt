package ai.neocode.rpc

fun isManagedWorktreeStorage(path: String): Boolean {
    val rel = path.replace('\\', '/').trimStart('/')
    return rel == ".neo/worktrees" || rel.startsWith(".neo/worktrees/")
}
