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

    const parsedLines = lines[0].split(/\r?\n|\r|\n/g);
    return parsedLines;
  }

  public static addLeadingWhitespace(lines: string[], languageId: string, leadingWhitespace: number): string[] | undefined {
    const formatSettings = Configuration.formatLanguageSetting(languageId)
    let linesWithWhitespace: string[] = [];

    if (formatSettings?.preserveLeadingWhitespace) {
      if (lines[0].startsWith(" ")) {
        return lines;
      }

      lines.forEach((line) => {
        const emptySpace = new Array(leadingWhitespace).join(" ");
        const whitespaceLine = !/\S/.test(line) ? line : emptySpace.concat(line);
        linesWithWhitespace.push(whitespaceLine);
      })
    } else {
      linesWithWhitespace = lines;
    }

    if (linesWithWhitespace.length > 0 && linesWithWhitespace.slice(-1)[0] === "") {
      linesWithWhitespace.pop();
    }

    return linesWithWhitespace;
  }
}
