"use strict";

import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { Configuration } from "../helpers/configuration";
import { SQLFluff, SQLFluffCommand } from "../utils/sqlfluff";

export class DocumentFormattingEditProvider {
  public outputChannel: vscode.OutputChannel;
  public runner: SQLFluff;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.runner = new SQLFluff(this.outputChannel);
  }
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    const filePath = document.fileName.replace(/\\/g, "/");
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
    const workingDirectory = Configuration.workingDirectory() ? Configuration.workingDirectory() : rootPath;
    const textEdits: vscode.TextEdit[] = [];
    this.outputChannel.appendLine(`Format triggered for ${filePath}`);

    if (Configuration.formatEnabled()) {
      if (document.isDirty) {
        await document.save();
      }

      try {
        const result = await this.runner.run(
          workingDirectory,
          SQLFluffCommand.FIX,
          Configuration.formatFileArguments(),
          {
            targetFileFullPath: filePath,
          },
        );
        if (!result.succeeded) {
          throw new Error('Command failed to execute, check logs for details');
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
        vscode.window.showErrorMessage(`SQLFluff Formatting Failed: ${error.message}`);
      }
    } else {
      this.outputChannel.appendLine("Skipping format, not enabled in settings");
    }

    return textEdits;
  }
}
