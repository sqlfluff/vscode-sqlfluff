import * as fs from "fs";
import * as vscode from "vscode";

import Configuration from "../../helper/configuration";
import Utilities from "../../helper/utilities";
import SQLFluff from "../sqlfluff";
import CommandOptions from "../types/commandOptions";
import CommandType from "../types/commandType";
import FormatHelper from "./helper";

export class FormattingProvider implements vscode.DocumentFormattingEditProvider {
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken,
  ): Promise<vscode.TextEdit[]> {
    const filePath = Utilities.normalizePath(document.fileName);
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;
    const workingDirectory = Configuration.workingDirectory(rootPath);
    const textEdits: vscode.TextEdit[] = [];

    if (workingDirectory?.includes("${")) {
      return [];
    }

    Utilities.appendHyphenatedLine();
    Utilities.outputChannel.appendLine(`Format triggered for ${filePath}`);

    if (!Configuration.formatEnabled()) {
      const message = "Format not enabled in the settings. Skipping Format.";
      Utilities.outputChannel.appendLine(message);

      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage(message);
      }

      return [];
    }

    // TODO: Remove this conditional and always save the document.
    if (Configuration.executeInTerminal()) {
      if (document.isDirty) {
        // FIXME: This causes problems when editor.formatOnSave is set to true.
        await document.save();
      }

      try {
        const commandOptions: CommandOptions = { filePath: filePath };
        const result = await SQLFluff.run(
          workingDirectory,
          CommandType.FIX,
          Configuration.formatFileArguments(),
          commandOptions,
        );

        if (!result.succeeded) {
          throw new Error("Command failed to execute, check logs for details");
        }

        const contents = fs.readFileSync(filePath, "utf-8");
        const lines = contents.split(/\r?\n/);
        const lineCount = document.lineCount;
        const lastLineRange = document.lineAt(lineCount - 1).range;
        const endChar = lastLineRange.end.character;

        if (lines[0].startsWith("NO SAFETY:")) {
          lines.shift();
          lines.shift();
        }

        if (lines[0].includes("ENOENT")) {
          return [];
        }

        if (lines.length > 1 || lines[0] !== "") {
          textEdits.push(vscode.TextEdit.replace(new vscode.Range(0, 0, lineCount, endChar), lines.join("\n")));
        }
      } catch (error) {
        Utilities.outputChannel.appendLine("\n--------------------Formatting Error--------------------\n");
        Utilities.outputChannel.appendLine(error as string);
        if (!Configuration.suppressNotifications()) {
          vscode.window.showErrorMessage("SQLFluff Formatting Failed.");
        }
      }
    } else {
      const commandOptions: CommandOptions = {
        filePath: filePath,
        fileContents: document.getText(),
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

      const lineCount = document.lineCount;
      const lastLineRange = document.lineAt(lineCount - 1).range;
      const endChar = lastLineRange.end.character;

      if (lines.length > 1 || lines[0] !== "") {
        textEdits.push(vscode.TextEdit.replace(new vscode.Range(0, 0, lineCount, endChar), lines.join("\n")));
      }
    }

    if (Configuration.executeInTerminal()) {
      await new Promise((sleep) => setTimeout(sleep, 250));
    }

    return textEdits;
  }
}
