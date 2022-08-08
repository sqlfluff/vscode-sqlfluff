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

    const options = workingDirectory ?
      {
        cwd: workingDirectory,
        env: {
          LANG: "en_US.utf-8"
        },
      } : undefined;

    if (Configuration.formatEnabled()) {
      if (Configuration.executeInTerminal()) {
        if (document.isDirty) {
          await document.save();
        }

        let args = Configuration.formatFileArguments();
        args = args.concat(Configuration.extraArguments());
        args.push(filePath);

        let childProcessReturn = cp.spawnSync(Configuration.executablePath(), args, options);
        
        if ((childProcessReturn.status === 0) || (childProcessReturn.status === 1)) {
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
          if (childProcessReturn.status === 0){
            // exit code 0 means sqlfluff fixed all violations.
            vscode.window.showInformationMessage("File formatted successfully.");
          } else {
            // exit code 1 means sqlfluff fixed all fixable violations but there still exists unfixable violations
            vscode.window.showInformationMessage("File formatted successfully. Some unfixable violations found.");
          }
        } else {
          vscode.window.showErrorMessage("SQLFluff Formatting Failed.");
        }

      } else {
        const command = Configuration.executablePath();

        let args = Configuration.formatBufferArguments();
        args = args.concat(Configuration.extraArguments());

        const output = await Process.run(command, args, options, document);
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

        if (lines[0].includes("templating/parsing errors found")) {
          vscode.window.showErrorMessage("SQLFluff templating/parsing errors found.");
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
