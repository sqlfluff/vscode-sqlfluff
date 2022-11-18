import { Diagnostic } from "vscode";

export default interface FileDiagnostic {
  filePath: string;
  diagnostics: Diagnostic[],
}
