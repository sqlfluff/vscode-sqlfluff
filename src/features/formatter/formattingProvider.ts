"use strict";

import * as cp from "child_process";
import * as fs from "fs";
import * as vscode from "vscode";

import { Configuration } from "../Helpers/configuration";
import Process from "./process";

export class DocumentFormattingEditProvider {
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    const filePath = document.fileName.replace(/\\/g, "/");
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
    const workingDirectory = Configuration.workingDirectory() ? Configuration.workingDirectory() : rootPath;
    const textEdits: vscode.TextEdit[] = [];

    if (Configuration.formatEnabled()) {
      if (Configuration.executeInTerminal()) {
        if (document.isDirty) {
          // await document.save();
        }

        let args = Configuration.formatFileArguments();
        args = args.concat(Configuration.extraArguments());

        const execOptions: cp.ExecSyncOptions = workingDirectory ?
          {
            cwd: workingDirectory,
            env: {
              LANG: "en_US.utf-8"
            },
          } : undefined;

        const command = `${Configuration.executablePath()} ${args.join(" ")} ${filePath}`;
        try {
          const output = cp.execSync(command, execOptions).toString();
          const contents = fs.readFileSync(document.uri.fsPath.replace(/\\/g, "/"), "utf-8");
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

          console.log(output);
          // await document.save();
        } catch (error) {
          vscode.window.showErrorMessage("SQLFluff Formatting Failed.");
        }
      } else {
        const command = Configuration.executablePath();

        let args = Configuration.formatBufferArguments();
        args = args.concat(Configuration.extraArguments());

        const spawnOptions: cp.SpawnOptions = workingDirectory ?
          {
            cwd: workingDirectory,
            env: {
              LANG: "en_US.utf-8"
            }
          } : undefined;

        const output = await new Process().run(command, args, spawnOptions, document);

        const lines = output.split(/\r?\n/);
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
      }
    }

    return textEdits;
  }
}
