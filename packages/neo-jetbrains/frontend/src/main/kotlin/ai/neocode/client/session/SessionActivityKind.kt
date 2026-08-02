package ai.neocode.client.session

import ai.neocode.client.plugin.NeoBundle
import ai.neocode.client.ui.UiStyle

enum class SessionActivityKind {
    RUNNING,
    LOGIN_REQUIRED,
    PERMISSION,
    PLAN,
    QUESTION,
    ;

    fun label(): String = when (this) {
        RUNNING -> NeoBundle.message("session.part.tool.running")
        LOGIN_REQUIRED -> NeoBundle.message("history.badge.loginRequired")
        PERMISSION -> NeoBundle.message("history.badge.permission")
        PLAN -> NeoBundle.message("history.badge.plan")
        QUESTION -> NeoBundle.message("history.badge.question")
    }

    fun style(): UiStyle.Badge.Style = when (this) {
        RUNNING -> UiStyle.Badge.Alert
        LOGIN_REQUIRED, PERMISSION, PLAN, QUESTION -> UiStyle.Badge.Primary
    }
}
