"use strict";

import * as fs from "fs";
import * as vscode from "vscode";

import { Configuration } from "../helper/configuration";
import { SQLFluff, SQLFluffCommand } from "../helper/sqlfluff";
import { normalize, Utilities } from "../helper/utilities";

export class FormattingProvider {
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    const filePath = normalize(document.fileName);
    const rootPath = normalize(vscode.workspace.workspaceFolders[0].uri.fsPath);
    const workingDirectory = Configuration.workingDirectory(rootPath);
    const textEdits: vscode.TextEdit[] = [];

    Utilities.appendHyphenatedLine();
    Utilities.outputChannel.appendLine(`Format triggered for ${filePath}`);

    if (Configuration.formatEnabled()) {
      // TODO: Remove this conditional and always save the document.
      if (Configuration.executeInTerminal()) {
        if (document.isDirty) {
          // FIXME: This causes problems when editor.formatOnSave is set to true.
          await document.save();
        }

        try {
          const result = await SQLFluff.run(
            workingDirectory,
            SQLFluffCommand.FIX,
            Configuration.formatFileArguments(),
            { targetFileFullPath: filePath },
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
            textEdits.push(vscode.TextEdit.replace(
              new vscode.Range(0, 0, lineCount, endChar),
              lines.join("\n")
            ));
          }
        } catch (error) {
          Utilities.outputChannel.appendLine("\n--------------------Formatting Error--------------------\n");
          Utilities.outputChannel.appendLine(error);
          if (!Configuration.suppressNotifications()) {
            vscode.window.showErrorMessage("SQLFluff Formatting Failed.");
          }
        }
      } else {
        const result = await SQLFluff.run(
          workingDirectory,
          SQLFluffCommand.FIX,
          Configuration.formatFileArguments(),
          { fileContents: document.getText() },
        );

        if (!result.succeeded) {
          throw new Error("Command failed to execute, check logs for details");
        }

        const lines = result.lines;
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

        if (lines[0].includes("templating/parsing errors found")) {
          if (!Configuration.suppressNotifications()) {
            vscode.window.showErrorMessage("SQLFluff templating/parsing errors found.");
          }
          return [];
        }

        if (lines.length > 1 || lines[0] !== "") {
          textEdits.push(vscode.TextEdit.replace(
            new vscode.Range(0, 0, lineCount, endChar),
            lines.join("\n")
          ));
        }
      }
    } else {
      Utilities.outputChannel.appendLine("Format not enabled in the settings. Skipping Format.");
    }

    if (Configuration.executeInTerminal()) {
      await new Promise(sleep => setTimeout(sleep, 250));
    }

    return textEdits;
  }
}
