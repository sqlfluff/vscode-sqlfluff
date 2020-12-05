"use strict";

import * as cp from "child_process";

import { TextEdit } from "vscode";
import * as vscode from "vscode";

import { LinterConfiguration } from "../utils/lintingProvider";
import { resolve } from "path";

export class DocumentFormattingEditProvider {
  public linterConfigurationFunc: () => LinterConfiguration;

  constructor(linterConfigurationFunc: () => LinterConfiguration) {
    this.linterConfigurationFunc = linterConfigurationFunc;
    vscode.workspace.onDidChangeConfiguration(linterConfigurationFunc, this);
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): vscode.TextEdit[] {
    const textEdits: TextEdit[] = [];
    const linterConfiguration = this.linterConfigurationFunc();

    if (linterConfiguration.formatterEnabled) {
      let executable = linterConfiguration.executable;
      let args: string[] = ["fix", "--force", "--no-safety", document.fileName];
      let options = vscode.workspace.rootPath
        ? { cwd: vscode.workspace.rootPath }
        : undefined;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "SQLFluff is formatting the file.",
          cancellable: false,
        },
        async (progress, token) => {
          let childProcess = cp.spawn(executable, args, options);
          childProcess.on("error", (error: Error) => {
            let message: string = "";
            if ((<any>error).code === "ENOENT") {
              message = `Cannot lint ${document.fileName}. The executable was not found. Use the 'Executable Path' setting to configure the location of the executable`;
            } else {
              message = error.message
                ? error.message
                : `Failed to run executable using path: ${executable}. Reason is unknown.`;
            }
            vscode.window.showInformationMessage(message);
            resolve();
          });
        }
      );
    }
    return textEdits;
  }
}
