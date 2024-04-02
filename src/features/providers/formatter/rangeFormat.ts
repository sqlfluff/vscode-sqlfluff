import * as fs from "fs";
import * as vscode from "vscode";

import Configuration from "../../helper/configuration";
import { DbtInterface } from "../../helper/dbtInterface";
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

    // Do not format the last line if it is only whitespace
    const endLine = !/\S/.test(
      document.lineAt(range.end.line).text.slice(0, range.end.character),
    ) ? range.end.line - 1
      : range.end.line;
    const endCharacter = document.lineAt(endLine).range.end.character;
    const lineRange = new vscode.Range(
      new vscode.Position(range.start.line, 0),
      new vscode.Position(endLine, endCharacter),
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

    let lines = undefined;
    if (!Configuration.dbtInterfaceEnabled()) {
      // Format the selection using sqlfluff CLI
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

      lines = FormatHelper.parseLines(result.lines);
    } else {
       // Format the selection using dbt-core-interface
      const dbtInterface = new DbtInterface(
        document.getText(lineRange),
        workingDirectory,
        Configuration.config(),
      );

      Utilities.outputChannel.appendLine("\n--------------------Executing Command--------------------\n");
      Utilities.outputChannel.appendLine(dbtInterface.getFormatURL());
      Utilities.appendHyphenatedLine();

      const response: any = await dbtInterface.format();
      Utilities.outputChannel.appendLine("Raw DBT-Interface /format output:");
      Utilities.appendHyphenatedLine();
      Utilities.outputChannel.appendLine(JSON.stringify(response, undefined, 2));
      Utilities.appendHyphenatedLine();

      const code = response?.error?.code ?? 0;
      const succeeded = code === 0;
      if (succeeded) {
        // response.sql is a multiline string. Split it into an array of lines.
        // This is similar to FormatHelper.parseLines(), but it does not look
        // for SQLFluff messages in the text because, given this is API output,
        // there won't be any.
        lines = response.sql.split(/\r?\n|\r|\n/g);
      }
    }

    const leadingWhitespace = document.lineAt(range.start.line).firstNonWhitespaceCharacterIndex + 1;
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
