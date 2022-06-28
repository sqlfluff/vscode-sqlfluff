"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";

import { Configuration } from "../Helpers/configuration";
import { LinterConfiguration } from "../utils/lintingProvider";
import Process from "./process";

export class DocumentFormattingEditProvider {
  public linterConfiguration: () => LinterConfiguration;

  constructor(linterConfiguration: () => LinterConfiguration) {
    this.linterConfiguration = linterConfiguration;
    vscode.workspace.onDidChangeConfiguration(linterConfiguration, this);
  }

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    const linterConfiguration = this.linterConfiguration();
    const filePath = document.fileName.replace(/\\/g, "/");
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
    const workingDirectory = Configuration.workingDirectory() ? Configuration.workingDirectory() : rootPath;

    let message: string;
    if (document.isDirty) {
      await document.save();
      if (document.isDirty) {
        message = "Please save the document before formatting.";
      }
    }

    if (linterConfiguration.formatterEnabled && !document.isDirty) {
      const executable = linterConfiguration.executable;

      let args: string[] = ["fix", "--force"];
      args = args.concat(linterConfiguration.extraArgs);

      const execOptions: cp.ExecSyncOptions = workingDirectory
        ? { cwd: workingDirectory }
        : undefined;

      const command = `${executable} ${args.join(" ")} ${filePath}`;
      try {
        cp.execSync(command, execOptions);
      } catch (error) {
        // message = "SQLFluff formatting failed.";
      }
    }

    if (message !== undefined) {
      vscode.window.showErrorMessage(message);
    }

    return [];
  }
}
