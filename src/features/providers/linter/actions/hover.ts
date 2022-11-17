/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";

export default class HoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const editor = vscode.window.activeTextEditor;
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    let hover: vscode.Hover | undefined = undefined;
    diagnostics.forEach(diagnostic => {
      if (hover) return;
      if (position.isAfterOrEqual(diagnostic.range.start) && position.isBeforeOrEqual(diagnostic.range.end)) {
        hover = this.createHover(diagnostic);
      } else {
        const wordRange = editor?.document.getWordRangeAtPosition(diagnostic.range.start);
        if (wordRange?.contains(position)) {
          hover = this.createHover(diagnostic);
        }
      }
    });

    return hover;
  }

  private createHover(
    diagnostic: vscode.Diagnostic
  ): vscode.Hover {
    const path = `https://docs.sqlfluff.com/en/stable/rules.html#sqlfluff.rules.Rule_${diagnostic.code}`;
    const markdownString = new vscode.MarkdownString();

    markdownString.appendMarkdown(`[View Documentation](${path}) for Rule ${diagnostic.code}.\n`);

    return new vscode.Hover(markdownString);
  }
}
