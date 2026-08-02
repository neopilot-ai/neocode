package ai.neocode.client.session.ui.prompt

import ai.neocode.client.session.ui.editor.SessionEditorTextField
import ai.neocode.client.session.ui.selection.SessionSelection
import com.intellij.openapi.project.Project
import com.intellij.util.textCompletion.TextCompletionProvider

internal class PromptEditorTextField(
    project: Project,
    ctx: SendPromptContext,
    completion: TextCompletionProvider?,
    selection: SessionSelection? = null,
) : SessionEditorTextField(project, ctx, completion, selection)
