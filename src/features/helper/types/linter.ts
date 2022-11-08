import * as vscode from "vscode";

export default interface Linter {
  languageId: Array<string>,
  process: (output: string[]) => vscode.Diagnostic[];
}
