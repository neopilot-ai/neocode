package ai.neocode.client.ui.md

import ai.neocode.client.session.ui.selection.SessionSelection
import ai.neocode.client.session.ui.style.SessionEditorStyle

internal class MdViewHybrid(
    style: SessionEditorStyle = SessionEditorStyle.current(),
    selection: SessionSelection? = null,
    code: MdCodeBlockFactory = MdCodeBlockFactory.default(),
) : ai.neocode.client.ui.md.hybrid.MdViewHybrid(style, selection, code)
