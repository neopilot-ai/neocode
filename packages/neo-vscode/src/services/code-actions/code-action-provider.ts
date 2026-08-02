import * as vscode from "vscode"

export class neocodeActionProvider implements vscode.CodeActionProvider {
  static readonly metadata: vscode.CodeActionProviderMetadata = {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.RefactorRewrite],
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (range.isEmpty) return []

    const actions: vscode.CodeAction[] = []

    const add = new vscode.CodeAction("Add to Neo Code", vscode.CodeActionKind.RefactorRewrite)
    add.command = { command: "neo-code.new.addToContext", title: "Add to Neo Code" }
    actions.push(add)

    const hasDiagnostics = context.diagnostics.length > 0

    if (hasDiagnostics) {
      const fix = new vscode.CodeAction("Fix with Neo Code", vscode.CodeActionKind.QuickFix)
      fix.command = { command: "neo-code.new.fixCode", title: "Fix with Neo Code" }
      fix.isPreferred = true
      actions.push(fix)
    }

    if (!hasDiagnostics) {
      const explain = new vscode.CodeAction("Explain with Neo Code", vscode.CodeActionKind.RefactorRewrite)
      explain.command = { command: "neo-code.new.explainCode", title: "Explain with Neo Code" }
      actions.push(explain)

      const improve = new vscode.CodeAction("Improve with Neo Code", vscode.CodeActionKind.RefactorRewrite)
      improve.command = { command: "neo-code.new.improveCode", title: "Improve with Neo Code" }
      actions.push(improve)
    }

    return actions
  }
}
