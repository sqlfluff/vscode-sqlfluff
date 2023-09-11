import * as vscode from "vscode";

import { FormattingProvider } from "./providers/formatter/format";
import { RangeFormattingProvider } from "./providers/formatter/rangeFormat";

export class FormattingEditProvider {
  activate(): vscode.DocumentFormattingEditProvider {
    return new FormattingProvider();
  }
}

export class RangeFormattingEditProvider {
  activate(): vscode.DocumentRangeFormattingEditProvider {
    return new RangeFormattingProvider();
  }
}
