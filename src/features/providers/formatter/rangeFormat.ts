import * as fs from "fs";
import * as vscode from "vscode";

import Configuration from "../../helper/configuration";
import Utilities from "../../helper/utilities";
import SQLFluff from "../sqlfluff";
import CommandOptions from "../types/commandOptions";
import CommandType from "../types/commandType";
import FormatHelper from "./helper";

export class RangeFormattingProvider implements vscode.DocumentRangeFormattingEditProvider {
  async provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken,
  ): Promise<vscode.TextEdit[]> {
    const textEdits = await FormatSelectionProvider.provideTextEdits(document, range);

    return textEdits;
  }
}

export class FormatSelectionProvider {
  static async provideTextEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): Promise<vscode.TextEdit[]> {
    const filePath = Utilities.normalizePath(document.fileName);
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;
    const workingDirectory = Configuration.workingDirectory(rootPath);
    const textEdits: vscode.TextEdit[] = [];

    const endCharacter = document.lineAt(range.end.line).range.end.character;
    const lineRange = new vscode.Range(
      new vscode.Position(range.start.line, 0),
      new vscode.Position(range.end.line, endCharacter),
    );

    if (workingDirectory?.includes("${")) {
      return [];
    }

    Utilities.appendHyphenatedLine();
    Utilities.outputChannel.appendLine(`Range (Lines ${lineRange.start.line} to ${lineRange.end.line}) Format triggered for ${filePath}`);

    if (!Configuration.formatEnabled()) {
      const message = "Format not enabled in the settings. Skipping Format.";
      Utilities.outputChannel.appendLine(message);

      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage(message);
      }

      return [];
    }

    if (Configuration.executeInTerminal()) {
      const invalidSetting = "sqlfluff.experimental.format.executeInTerminal";
      const message = `Unable to format a selection while ${invalidSetting} is enabled. Skipping Format.`;
      Utilities.outputChannel.appendLine(message);

      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage(message);
      }
      return [];
    }

    const commandOptions: CommandOptions = {
      filePath: filePath,
      fileContents: document.getText(lineRange),
    };

    const result = await SQLFluff.run(
      workingDirectory,
      CommandType.FIX,
      Configuration.formatFileArguments(),
      commandOptions,
    );

    if (!result.succeeded) {
      throw new Error("Command failed to execute, check logs for details");
    }

    let lines = FormatHelper.parseLines(result.lines);

    const leadingWhitespace = document.lineAt(range.start.line).firstNonWhitespaceCharacterIndex;
    lines = lines ? FormatHelper.addLeadingWhitespace(lines, document.languageId, leadingWhitespace) : undefined;

    if (lines === undefined) return [];

    if (lines.length > 1 || lines[0] !== "") {
      const eol = document.eol;
      textEdits.push(vscode.TextEdit.replace(
        lineRange,
        eol === vscode.EndOfLine.LF ? lines.join("\n") : lines.join("\r\n"),
      ));
    }

    if (Configuration.executeInTerminal()) {
      await new Promise(sleep => setTimeout(sleep, 250));
    }

    return textEdits;
  }
}
