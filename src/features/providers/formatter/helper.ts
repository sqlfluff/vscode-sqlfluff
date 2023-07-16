import * as vscode from "vscode";

import Configuration from "../../helper/configuration";

export default class FormatHelper {
  public static parseLines(lines: string[]): string[] | undefined {
    if (lines[0].startsWith("NO SAFETY:")) {
      lines.shift();
      lines.shift();
    }

    if (lines[0].includes("templating/parsing errors remaining")) {
      lines.shift();

      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage("SQLFluff templating/parsing errors found. Unable to run 'sqlfluff fix' even with the errors ignored.");
      }
    }

    if (lines[0].includes("ENOENT")) {
      return undefined;
    }

    if (lines[0].includes("templating/parsing errors found")) {
      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage("SQLFluff templating/parsing errors found.");
      }

      return undefined;
    }

    return lines;
  }
}
