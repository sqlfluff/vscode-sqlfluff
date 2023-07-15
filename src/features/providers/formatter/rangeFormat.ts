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
    const filePath = Utilities.normalizePath(document.fileName);
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;
    const workingDirectory = Configuration.workingDirectory(rootPath);
    const textEdits: vscode.TextEdit[] = [];

    if (workingDirectory?.includes("${")) {
      return [];
    }

    Utilities.appendHyphenatedLine();
    Utilities.outputChannel.appendLine(`Range (Lines ${range.start.line} to ${range.end.line}) Format triggered for ${filePath}`);

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
      fileContents: document.getText(range),
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

    const lines = FormatHelper.parseLines(result.lines);
    if (lines === undefined) return [];

    if (lines.length > 1 || lines[0] !== "") {
      textEdits.push(vscode.TextEdit.replace(
        range,
        lines.join("\n"),
      ));
    }

    if (Configuration.executeInTerminal()) {
      await new Promise(sleep => setTimeout(sleep, 250));
    }

    return textEdits;
  }
}
