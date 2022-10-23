import * as vscode from "vscode";

import { FormattingProvider } from "./providers/format";

export class FormattingEditProvider {
  activate(): vscode.DocumentFormattingEditProvider {
    return new FormattingProvider();
  }
}
