import * as vscode from "vscode";

export const VIEW_DOCUMENTATION = "sqlfluff.quickfix.viewDocumentation";

export class Documentation {
  static showDocumentation(rule: string) {
    const path = `https://docs.sqlfluff.com/en/stable/rules.html#sqlfluff.rules.sphinx.Rule_${rule}`;

    return vscode.env.openExternal(vscode.Uri.parse(path));
  }
}
